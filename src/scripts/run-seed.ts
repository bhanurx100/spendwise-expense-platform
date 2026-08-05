/**
 * scripts/run-seed.ts
 *
 * The single seed entrypoint (`npm run db:seed`). Flow:
 *
 *   1. Build the demo user's accounts + full 15-month transaction timeline
 *      in memory (seed/timeline/index.ts).
 *   2. VALIDATE everything in memory — transaction volume, category
 *      integrity, calendar/month reconciliation, and (critically) that no
 *      asset account ever goes negative anywhere in its history — BEFORE
 *      touching the database. If anything fails, this throws and NOTHING
 *      is written. "If any mismatch exists, throw error, do not seed."
 *   3. Delete this demo user's existing accounts/categories/subcategories/
 *      transactions/split-groups (cascades handle the dependent rows) and
 *      re-insert fresh — this is what makes "running the seed twice
 *      generates identical data" actually true, rather than merely "does
 *      not error on duplicate ids."
 *   4. Insert accounts, categories, subcategories, transactions (with
 *      real `type`/`status`/`direction`/`paymentMethod`), and SplitPay data.
 *   5. Install the balance-sync trigger and backfill `accounts.current_balance`
 *      (seed/core/balance-sync.ts) — every seed run keeps this column
 *      correct automatically now; it's no longer a separate manual step.
 */

import "dotenv/config"
import { eq } from "drizzle-orm"
import { db, sql } from "@/src/db/drizzle"
import { users, accounts, categories, subcategories, transactions, splitGroups, splitMembers } from "@/src/db/schema"

import { demoUser } from "./seed/demo-user"
import type { DemoUserBlueprint } from "./seed/demo-user/demo-user.types"
import { demoIdentities } from "./seed/core/demo-identities.seed"
import { buildAccounts } from "./seed/core/accounts.seed"
import { buildTimeline } from "./seed/timeline"
import { validateGeneratedData, printValidationReport } from "./seed/core/analytics.generator"
import { installBalanceSyncAndBackfill } from "./seed/core/balance-sync"
import { categories as globalCategories } from "./seed/core/categories.seed"
import { subcategories as globalSubcategories } from "./seed/core/subcategories.seed"
import { addMonths } from "./seed/lib/kernel"
import { SEED_REFERENCE_DATE, DEMO_USER_SLUG } from "./seed/lib/constants"
import type { Transaction } from "./seed/lib/domain"

async function seedDemoUser(user: DemoUserBlueprint) {
  const identity = demoIdentities.find((d) => d.email === user.email)
  if (!identity) throw new Error(`No demo identity for ${user.email}`)
  const userId = identity.userId
  const joinedOn = addMonths(SEED_REFERENCE_DATE, -user.joinedMonthsAgo)

  // ── 1. Build everything in memory ─────────────────────────────────────
  const accountRows = buildAccounts(DEMO_USER_SLUG, userId, joinedOn, user.accounts)
  const timeline = buildTimeline(user, userId, SEED_REFERENCE_DATE)

  // ── 2. Validate — throws and writes nothing if anything is wrong ──────
  const report = validateGeneratedData(user, accountRows, timeline.transactions, timeline.rangeStart, timeline.rangeEnd)
  printValidationReport(report)

  // ── 3. Clean slate for this demo user (true idempotency) ──────────────
  // Deleting `accounts` cascades to `transactions` (transactions.account_id
  // has ON DELETE CASCADE); deleting `splitGroups` cascades to
  // `splitMembers`. Order matters only in that categories/subcategories
  // reference each other, not the accounts/transactions/splitpay chain.
  await db.delete(accounts).where(eq(accounts.userId, userId))
  await db.delete(subcategories).where(eq(subcategories.userId, userId))
  await db.delete(categories).where(eq(categories.userId, userId))
  await db.delete(splitGroups).where(eq(splitGroups.userId, userId))

  await db.insert(users).values({
    id: userId, email: identity.email, name: user.displayName,
    provider: "demo", isDemo: true, status: "active",
  }).onConflictDoUpdate({ target: users.id, set: { name: user.displayName, email: identity.email } })

  // ── 4a. Accounts ────────────────────────────────────────────────────
  for (const acc of accountRows) {
    await db.insert(accounts).values({
      id: acc.id, name: acc.name, userId, type: acc.type, institution: acc.institutionId,
      openingBalance: acc.openingBalanceMilli, currentBalance: acc.openingBalanceMilli, maskedNumber: acc.maskedNumber,
      isPrimary: acc.isPrimary, linkedAccountId: acc.linkedAccountId,
    })
  }

  const allTx = timeline.transactions

  // ── 4b. Categories / subcategories actually used by this history ─────
  const categoryIdMap = new Map<string, string>()
  for (const catId of Array.from(new Set(allTx.map((t) => t.categoryId)))) {
    const meta = globalCategories.find((c) => c.id === catId)
    if (!meta) continue
    const localId = `${DEMO_USER_SLUG}_${catId}`
    categoryIdMap.set(catId, localId)
    await db.insert(categories).values({ id: localId, name: meta.name, userId })
  }

  const subcategoryIdMap = new Map<string, string>()
  for (const subId of Array.from(new Set(allTx.map((t) => t.subcategoryId).filter(Boolean) as string[]))) {
    const meta = globalSubcategories.find((s) => s.id === subId)
    if (!meta) continue
    const localId = `${DEMO_USER_SLUG}_${subId}`
    subcategoryIdMap.set(subId, localId)
    await db.insert(subcategories).values({
      id: localId, userId, categoryId: categoryIdMap.get(meta.categoryId) ?? "", name: meta.name,
    })
  }

  // ── 4c. Transactions ───────────────────────────────────────────────────
  //
  // The ONE sign rule for the whole system: every generated Transaction
  // carries an unsigned `amountMilli` plus an explicit `direction`. The
  // signed `amount` column is derived here, exactly once, the same way
  // seed/core/balance.generator.ts derives it for validation — so the
  // number this loop writes and the number that engine already verified
  // reconciles can never be two different calculations.
  function toRow(t: Transaction) {
    return {
      id: t.id,
      accountId: t.accountId,
      categoryId: categoryIdMap.get(t.categoryId) ?? null,
      subcategoryId: t.subcategoryId ? subcategoryIdMap.get(t.subcategoryId) ?? null : null,
      amount: t.direction === "credit" ? t.amountMilli : -t.amountMilli,
      payee: t.merchantName,
      notes: t.notes,
      date: t.date,
      type: t.type,
      status: t.status,
      direction: t.direction,
      paymentMethod: t.paymentMethod,
    }
  }

  const rows = allTx.map(toRow)
  const BATCH = 200
  for (let i = 0; i < rows.length; i += BATCH) {
    await db.insert(transactions).values(rows.slice(i, i + BATCH))
  }

  // ── 4d. SplitPay ───────────────────────────────────────────────────────
  const contactsById = new Map(user.splitContacts.map((c) => [c.id, c]))
  for (const group of user.splitGroups) {
    const groupId = `${DEMO_USER_SLUG}_group_${group.id}`
    await db.insert(splitGroups).values({
      id: groupId, userId, workspaceId: null,
      createdBy: userId, updatedBy: userId, name: group.name, emojiIcon: group.icon,
      status: group.status, amount: group.totalAmountMilli, totalAmount: group.totalAmountMilli, currency: "INR",
    })

    for (const memberId of group.memberIds) {
      const contact = contactsById.get(memberId)
      if (!contact) continue
      const netBalance = group.memberNetBalanceMilli[memberId] ?? 0
      const direction = netBalance > 0 ? "owes-you" : netBalance < 0 ? "you-owe" : "settled"
      await db.insert(splitMembers).values({
        id: `${DEMO_USER_SLUG}_member_${group.id}_${memberId}`, userId,
        groupId,
        name: contact.name,
        avatar: contact.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase(),
        netBalance, direction, createdBy: userId, updatedBy: userId,
      })
    }
  }

  // ── 5. Balance sync: install the trigger + backfill current_balance ──
  // This is the step that used to be a separate, easy-to-forget manual
  // command (`npm run db:sync-balances`) — running it automatically here
  // is the actual fix for "current balances don't reconcile."
  const backfilled = await installBalanceSyncAndBackfill(sql)

  console.log(`✅ ${user.displayName} (${identity.email}) — ${rows.length} transactions, ${accountRows.length} accounts, ${user.splitGroups.length} SplitPay groups`)
  console.log("   Balances (backfilled + trigger-guaranteed going forward):")
  for (const row of backfilled) {
    console.log(`     ${row.name}: ₹${(row.current_balance / 1000).toLocaleString("en-IN")}`)
  }
}

async function main() {
  await seedDemoUser(demoUser)
  console.log("\nDemo login:")
  const identity = demoIdentities.find((d) => d.email === demoUser.email)
  if (identity) console.log(`  ${identity.email} / ${identity.password}`)
  process.exit(0)
}

main().catch((err) => { console.error(err); process.exit(1) })
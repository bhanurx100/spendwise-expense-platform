/**
 * scripts/seed/finance/investment.generator.ts
 *
 * Single responsibility: `investments` with a `monthlyContributionMilli` →
 * a real monthly debit transaction. Walks each investment's own start date
 * (which may be before or after the history window) so a SIP that started
 * mid-history doesn't appear to have been running since day one.
 */

import { addMonths, atTime, randInt } from "../lib/kernel";
import { buildTx, monthlyOccurrences, type EngineContext } from "../lib/engine";
import type { DemoUserBlueprint } from "../demo-user/demo-user.types";
import type { Transaction } from "../lib/domain";

function investmentMerchant(kind: DemoUserBlueprint["investments"][number]["kind"]): string {
  // Mapped to the closest existing catalog entry rather than inventing a
  // new merchant per investment kind.
  return kind === "mutual-fund-sip" ? "mer_zerodha_coin" : "mer_epfo";
}

export function generateInvestmentContributions(ctx: EngineContext, from: Date, to: Date): Transaction[] {
  const out: Transaction[] = [];
  for (const inv of ctx.user.investments) {
    if (!inv.monthlyContributionMilli) continue;
    const investmentStart = addMonths(to, -inv.startedMonthsAgo);
    const windowStart = investmentStart.getTime() > from.getTime() ? investmentStart : from;
    const merchantId = investmentMerchant(inv.kind);
    for (const day of Array.from(monthlyOccurrences(windowStart, to, 28))) {
      out.push(
        buildTx(ctx, {
          tag: `invest-${inv.id}`,
          date: atTime(day, 20, randInt(ctx.rng, 0, 40)),
          merchantId,
          accountSlug: inv.linkedAccountSlug,
          amountMilli: inv.monthlyContributionMilli,
          direction: "debit",
          type: "expense",
          notes: inv.label,
          isRecurring: true,
        }),
      );
    }
  }
  return out;
}
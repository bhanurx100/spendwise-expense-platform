/**
 * scripts/seed/finance/expense.generator.ts
 *
 * Single responsibility: every recurring or probabilistic *expense* that
 * isn't a subscription, an investment contribution, or a life event —
 * rent/mobile/internet/fuel (`recurringExpenses`), electricity/gas
 * (`bills`), everyday discretionary spend (`spendingHabits`, seasonally
 * scaled), and lower-frequency bigger-ticket spend (`occasionalEvents`).
 *
 * Seasonality (`seasonalMultiplierFor`): festival months and December
 * spend more; a post-holiday month spends less. Habits resolve a per-week
 * multiplier from `seasonalMultipliers` and scale that week's occurrence
 * count (and, for a boosted week, the amount too) by it — rather than
 * every week drawing from the same flat range all 15 months.
 */

import { addDays, addMonths, atTime, chance, eachDay, isWeekend, randAmount, randInt } from "../lib/kernel";
import { buildTx, monthlyOccurrences, type EngineContext } from "../lib/engine";
import type { DemoUserBlueprint } from "../demo-user/demo-user.types";
import type { Transaction } from "../lib/domain";

// ─── Recurring bills (rent, mobile, internet, fuel top-ups) ────────────────

export function generateRecurringExpenses(ctx: EngineContext, from: Date, to: Date): Transaction[] {
  const out: Transaction[] = [];
  for (const rec of ctx.user.recurringExpenses) {
    for (const day of Array.from(monthlyOccurrences(from, to, rec.dayOfMonth))) {
      const amount = randAmount(ctx.rng, rec.amountRangeMilli[0], rec.amountRangeMilli[1], 100);
      out.push(
        buildTx(ctx, {
          tag: "recur",
          date: atTime(day, 10, randInt(ctx.rng, 0, 40)),
          merchantId: rec.merchantId,
          accountSlug: rec.accountSlug,
          amountMilli: amount,
          direction: "debit",
          type: "expense",
          notes: rec.label,
          isRecurring: true,
        }),
      );
    }
  }
  return out;
}

// ─── Utility bills (electricity, gas) ───────────────────────────────────────
//
// Declared in the blueprint but historically never read by any generator —
// Electricity and Gas never actually appeared despite being required every
// month. This is the generator that was missing.

export function generateBills(ctx: EngineContext, from: Date, to: Date): Transaction[] {
  const out: Transaction[] = [];
  for (const bill of ctx.user.bills) {
    for (const day of Array.from(monthlyOccurrences(from, to, bill.dueDayOfMonth))) {
      const amount = randAmount(ctx.rng, bill.amountRangeMilli[0], bill.amountRangeMilli[1], 100);
      out.push(
        buildTx(ctx, {
          tag: `bill-${bill.id}`,
          date: atTime(day, bill.autopay ? 6 : randInt(ctx.rng, 9, 21), randInt(ctx.rng, 0, 59)),
          merchantId: bill.merchantId,
          accountSlug: bill.linkedAccountSlug,
          amountMilli: amount,
          direction: "debit",
          type: "expense",
          notes: bill.label,
          isRecurring: bill.autopay,
        }),
      );
    }
  }
  return out;
}

// ─── Everyday discretionary spend, seasonally scaled ───────────────────────

/** The multiplier this calendar week's spending should be scaled by, for a
 *  given habit — the product of every SeasonalMultiplierBlueprint whose
 *  month-of-year and habitIds match. */
function seasonalMultiplierFor(user: DemoUserBlueprint, habitId: string, weekMidpoint: Date): number {
  const monthOfYear = weekMidpoint.getMonth();
  let multiplier = 1;
  for (const season of user.seasonalMultipliers) {
    if (!season.monthsOfYear.includes(monthOfYear)) continue;
    if (season.habitIds !== "all" && !season.habitIds.includes(habitId)) continue;
    multiplier *= season.multiplier;
  }
  return multiplier;
}

export function generateSpendingHabits(ctx: EngineContext, from: Date, to: Date): Transaction[] {
  const out: Transaction[] = [];
  const weeks: Date[][] = [];
  let weekStart = new Date(from);
  while (weekStart.getTime() <= to.getTime()) {
    const days = eachDay(weekStart, addDays(weekStart, 6)).filter((d) => d.getTime() <= to.getTime());
    weeks.push(days);
    weekStart = addDays(weekStart, 7);
  }

  for (const habit of ctx.user.spendingHabits) {
    for (const week of weeks) {
      if (week.length === 0) continue;
      const midpoint = week[Math.floor(week.length / 2)];
      const seasonal = seasonalMultiplierFor(ctx.user, habit.id, midpoint);

      const baseOccurrences = randInt(ctx.rng, habit.timesPerWeek[0], habit.timesPerWeek[1]);
      // Scale by the seasonal multiplier, keeping a fractional remainder as
      // a probability roll so a 1.3x multiplier means "usually the same
      // count, sometimes one more" rather than every week rounding
      // identically (which would look mechanical, not natural).
      const scaled = baseOccurrences * seasonal;
      const occurrences = Math.floor(scaled) + (chance(ctx.rng, scaled - Math.floor(scaled)) ? 1 : 0);

      for (let i = 0; i < occurrences; i++) {
        const weekendBias = habit.weekendMultiplier ?? 1;
        const weekendDays = week.filter(isWeekend);
        const weekdayDays = week.filter((d) => !isWeekend(d));
        const useWeekend = weekendDays.length > 0 && chance(ctx.rng, Math.min(0.85, 0.25 * weekendBias));
        const pool = useWeekend ? weekendDays : weekdayDays.length ? weekdayDays : week;
        const day = pool[randInt(ctx.rng, 0, pool.length - 1)];
        const merchantId = habit.merchantIds[randInt(ctx.rng, 0, habit.merchantIds.length - 1)];
        const accountSlug = habit.accountSlugs[randInt(ctx.rng, 0, habit.accountSlugs.length - 1)];
        // Seasonal weeks also spend a bit more per transaction, not just
        // more often (a festival dinner costs more than a Tuesday dinner).
        const amountBoost = seasonal > 1 ? Math.min(seasonal, 1.5) : 1;
        const amount = Math.round((randAmount(ctx.rng, habit.amountRangeMilli[0], habit.amountRangeMilli[1], 10) * amountBoost) / 10) * 10;
        const [hMin, hMax] = habit.hourRange ?? [9, 21];
        out.push(
          buildTx(ctx, {
            tag: `habit-${habit.id}`,
            date: atTime(day, randInt(ctx.rng, hMin, hMax), randInt(ctx.rng, 0, 59)),
            merchantId,
            accountSlug,
            amountMilli: amount,
            direction: "debit",
            type: "expense",
          }),
        );
      }
    }
  }
  return out;
}

// ─── Occasional bigger-ticket events (probabilistic, monthly roll) ─────────

export function generateOccasionalEvents(ctx: EngineContext, from: Date, to: Date): Transaction[] {
  const out: Transaction[] = [];
  let cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  while (cursor.getTime() <= to.getTime()) {
    for (const event of ctx.user.occasionalEvents) {
      if (chance(ctx.rng, event.probabilityPerMonth)) {
        const day = addDays(cursor, randInt(ctx.rng, 0, 26));
        if (day.getTime() < from.getTime() || day.getTime() > to.getTime()) continue;
        const merchantId = event.merchantIds[randInt(ctx.rng, 0, event.merchantIds.length - 1)];
        const accountSlug = event.accountSlugs[randInt(ctx.rng, 0, event.accountSlugs.length - 1)];
        const amount = randAmount(ctx.rng, event.amountRangeMilli[0], event.amountRangeMilli[1], 100);
        const isIncome = event.type === "income";
        out.push(
          buildTx(ctx, {
            tag: `occasional-${event.id}`,
            date: atTime(day, randInt(ctx.rng, 8, 21), randInt(ctx.rng, 0, 59)),
            merchantId,
            accountSlug,
            amountMilli: amount,
            direction: isIncome ? "credit" : "debit",
            type: isIncome ? "income" : "expense",
            notes: event.note,
          }),
        );
      }
    }
    cursor = addMonths(cursor, 1);
  }
  return out;
}
# Seed architecture

## What runs

`src/scripts/run-seed.ts` is the only seed entry point. It inserts directly
into the real tables in `src/db/schema.ts` (`users`, `accounts`,
`categories`, `subcategories`, `transactions`, `splitGroups`,
`splitMembers`) and nothing else. It is fully isolated from runtime:
nothing under `src/app`, `src/server`, or `src/features` imports anything
from this folder. Its contract is generate → insert → exit, per the Phase 1
seed-isolation rule.

The files it actually depends on:

```
run-seed.ts
├─ demo-user/            (the one demo persona's blueprint + types)
├─ core/demo-identities.seed.ts
├─ core/accounts.seed.ts
├─ core/institutions.seed.ts
├─ core/preferences.seed.ts   (types only)
├─ core/merchant-rules.seed.ts, core/merchants.seed.ts
├─ core/categories.seed.ts, core/subcategories.seed.ts
├─ finance/transactions.seed.ts, finance/transfers.seed.ts
└─ lib/kernel.ts, lib/constants.ts, lib/domain.ts
```

## What was removed, and why

As of this Phase 1 pass, a second, disconnected "seed kernel"
(`seed/index.ts::seedAll`, `integration/*`, `runtime/demo-session.ts`, and
generators for `bills`, `budgets`, `goals`, `investments`, `loans`,
`recurring`, `reminders`, `subscriptions`, `notifications`, full SplitPay
settlements/activity, plus `analytics/*` and `core/currencies.seed.ts` /
`core/users.seed.ts`) has been deleted.

That kernel targeted a `SeedRepository` interface describing ~15 tables
that don't exist in `schema.ts`, and no adapter implementing that
interface against Postgres ever existed — `seedAll()` could not run
against the real database. It also included a well-built demo-session
clone-on-login/delete-on-logout mechanism that nothing in the real auth
flow ever called. None of it was reachable from `run-seed.ts` or from any
runtime code path (verified by import-graph trace, zero references outside
`src/scripts/seed/`).

Per the Phase 1 goal of eliminating architectural debt rather than
preserving two parallel, disagreeing implementations, the disconnected
kernel was removed instead of wired up — wiring it up would mean building
the Budgets/Goals/Bills/Investments/Notifications schema and services,
which are explicitly out of scope for Phase 1.

## Phase 2 extension point

`lib/domain.ts` still defines the richer domain types (`RecurringSeries`,
`Investment`, etc.) referenced by `demo-user/demo-user.types.ts` and is
kept as-is — it's a reasonable starting shape for Phase 2 schema design,
even though no generator currently produces those records. When a Phase 2
module (e.g. Budgets) is implemented, its seed generator should follow the
same pattern as `finance/transactions.seed.ts`: pure data generation, no DB
access, imported directly by `run-seed.ts`, with the DB insert added to
`seedDemoUser()` there — not a second seed kernel.

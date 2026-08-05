/**
 * server/services/balance-service.ts
 *
 * Business-logic wrapper around balance-repository. This is the module
 * every feature service (accounts, dashboard, transactions, and future
 * Portfolio/Analytics) should import — not the repository directly — so
 * balance rules (rounding, currency handling, future multi-currency
 * conversion, etc.) have exactly one place to live.
 */

import {
  getAccountBalances,
  getAccountBalance,
} from "@/src/server/repositories/balance-repository";

export const balanceService = {
  /** Map<accountId, balance> for every account owned by the user. */
  getBalancesForUser: (userId: string) => getAccountBalances(userId),

  /** Balance for a single account; also acts as an ownership check. */
  getBalanceForAccount: (accountId: string, userId: string) =>
    getAccountBalance(accountId, userId),

  /** Sum of every account balance for the user — the "total balance" figure. */
  async getTotalBalanceForUser(userId: string): Promise<number> {
    const balances = await getAccountBalances(userId);
    let total = 0;
    for (const balance of Array.from(balances.values())) {
      total += balance;
    }
    return total;
  },
};

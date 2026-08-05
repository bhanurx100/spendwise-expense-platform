/**
 * scripts/seed/core/institutions.seed.ts
 *
 * Global institution catalog. Accounts (core/accounts.seed.ts) reference
 * these by id rather than embedding institution names as free text — this
 * is what lets Accounts-page logos/network marks resolve consistently and
 * lets a future bank-sync integration match against a known institution
 * instead of inventing one per user.
 */

import type { Institution } from "../lib/domain";

export const institutions: Institution[] = [
  { id: "inst_hdfc", name: "HDFC Bank", kind: "bank", country: "IN" },
  { id: "inst_icici", name: "ICICI Bank", kind: "bank", country: "IN" },
  { id: "inst_axis", name: "Axis Bank", kind: "bank", country: "IN" },
  { id: "inst_sbi", name: "State Bank of India", kind: "bank", country: "IN" },
  { id: "inst_kotak", name: "Kotak Mahindra Bank", kind: "bank", country: "IN" },
  { id: "inst_paytm", name: "Paytm Wallet", kind: "wallet", country: "IN" },
  { id: "inst_phonepe", name: "PhonePe", kind: "wallet", country: "IN" },
  { id: "inst_gpay", name: "Google Pay", kind: "wallet", country: "IN" },
  { id: "inst_zerodha", name: "Zerodha", kind: "broker", country: "IN" },
  { id: "inst_groww", name: "Groww", kind: "broker", country: "IN" },
  { id: "inst_wise", name: "Wise", kind: "payment-processor", country: "GB" },
  { id: "inst_paypal", name: "PayPal", kind: "payment-processor", country: "US" },
  { id: "inst_stripe", name: "Stripe", kind: "payment-processor", country: "US" },
  { id: "inst_visa", name: "Visa", kind: "card-network", country: "US" },
  { id: "inst_rupay", name: "RuPay", kind: "card-network", country: "IN" },
  { id: "inst_cash", name: "Cash", kind: "wallet", country: "IN" },
];

export function getInstitution(id: string): Institution {
  const found = institutions.find((i) => i.id === id);
  if (!found) throw new Error(`Unknown institution: ${id}`);
  return found;
}
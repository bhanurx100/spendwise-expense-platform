/**
 * scripts/seed/core/merchants.seed.ts
 *
 * Global merchant catalog. This is the same table a real bank-sync or CSV
 * import would match against ("existing merchants matched, unknown
 * merchants created" per the runtime flow) — persona files never invent a
 * merchant name inline, they reference one by id from here.
 */

import type { Merchant } from "../lib/domain";

function m(id: string, name: string, categoryId: string, subcategoryId: string): Merchant {
  return { id, name, categoryId, subcategoryId, logoKey: id };
}

export const merchants: Merchant[] = [
  // Food
  m("mer_swiggy", "Swiggy", "cat_food", "sub_dining"),
  m("mer_zomato", "Zomato", "cat_food", "sub_dining"),
  m("mer_mcdonalds", "McDonald's", "cat_food", "sub_fast_food"),
  m("mer_dominos", "Domino's Pizza", "cat_food", "sub_fast_food"),
  m("mer_kfc", "KFC", "cat_food", "sub_fast_food"),
  m("mer_burger_king", "Burger King", "cat_food", "sub_fast_food"),
  m("mer_starbucks", "Starbucks", "cat_food", "sub_coffee"),
  m("mer_ccd", "Café Coffee Day", "cat_food", "sub_coffee"),
  m("mer_restaurant_generic", "Restaurant", "cat_food", "sub_dining"),
  m("mer_bigbasket", "BigBasket", "cat_food", "sub_groceries"),
  m("mer_zepto", "Zepto", "cat_food", "sub_groceries"),
  m("mer_blinkit", "Blinkit", "cat_food", "sub_groceries"),
  m("mer_dmart", "DMart", "cat_food", "sub_groceries"),
  m("mer_reliance_smart", "Reliance Smart", "cat_food", "sub_groceries"),
  m("mer_college_canteen", "College Canteen", "cat_food", "sub_dining"),
  m("mer_hostel_mess", "Hostel Mess", "cat_food", "sub_dining"),

  // Shopping
  m("mer_amazon", "Amazon", "cat_shopping", "sub_general_shopping"),
  m("mer_flipkart", "Flipkart", "cat_shopping", "sub_general_shopping"),
  m("mer_myntra", "Myntra", "cat_shopping", "sub_fashion"),
  m("mer_nykaa", "Nykaa", "cat_shopping", "sub_fashion"),
  m("mer_croma", "Croma", "cat_shopping", "sub_electronics"),
  m("mer_decathlon", "Decathlon", "cat_shopping", "sub_home"),
  m("mer_apple", "Apple Store", "cat_shopping", "sub_electronics"),
  m("mer_urban_ladder", "Urban Ladder", "cat_shopping", "sub_furniture"),
  m("mer_ikea", "IKEA", "cat_shopping", "sub_furniture"),
  m("mer_home_improvement_generic", "Home Improvement Store", "cat_shopping", "sub_home_improvement"),

  // Travel
  m("mer_uber", "Uber", "cat_travel", "sub_cab"),
  m("mer_ola", "Ola Cabs", "cat_travel", "sub_cab"),
  m("mer_rapido", "Rapido", "cat_travel", "sub_cab"),
  m("mer_irctc", "IRCTC", "cat_travel", "sub_flights"),
  m("mer_indigo", "IndiGo Airlines", "cat_travel", "sub_flights"),
  m("mer_air_india", "Air India", "cat_travel", "sub_flights"),
  m("mer_redbus", "RedBus", "cat_travel", "sub_transit"),
  m("mer_metro", "Metro Rail", "cat_travel", "sub_transit"),
  m("mer_indianoil", "IndianOil Petrol Pump", "cat_travel", "sub_fuel"),
  m("mer_hp_petrol", "HP Petrol Pump", "cat_travel", "sub_fuel"),
  m("mer_bharat_petroleum", "Bharat Petroleum", "cat_travel", "sub_fuel"),
  m("mer_hotel_generic", "Hotel Booking", "cat_travel", "sub_hotels"),

  // Finance / payments (transfers & CC payments route through these)
  m("mer_hdfc_bank", "HDFC Bank", "cat_transfer", "sub_internal_transfer"),
  m("mer_icici_bank", "ICICI Bank", "cat_transfer", "sub_internal_transfer"),
  m("mer_axis_bank", "Axis Bank", "cat_transfer", "sub_internal_transfer"),
  m("mer_sbi", "SBI", "cat_transfer", "sub_internal_transfer"),
  m("mer_kotak", "Kotak Mahindra Bank", "cat_transfer", "sub_internal_transfer"),
  m("mer_phonepe", "PhonePe", "cat_transfer", "sub_internal_transfer"),
  m("mer_gpay", "Google Pay", "cat_transfer", "sub_internal_transfer"),
  m("mer_paytm", "Paytm", "cat_transfer", "sub_internal_transfer"),
  m("mer_razorpay", "Razorpay", "cat_transfer", "sub_internal_transfer"),
  m("mer_credit_card_payment", "Credit Card Payment", "cat_transfer", "sub_internal_transfer"),

  // Healthcare
  m("mer_apollo", "Apollo Pharmacy", "cat_healthcare", "sub_medicines"),
  m("mer_practo", "Practo", "cat_healthcare", "sub_doctor"),
  m("mer_medplus", "MedPlus", "cat_healthcare", "sub_medicines"),
  m("mer_cultfit", "Cult.fit", "cat_healthcare", "sub_fitness"),
  m("mer_lic", "LIC", "cat_healthcare", "sub_insurance"),
  m("mer_star_health", "Star Health Insurance", "cat_healthcare", "sub_insurance"),

  // Entertainment
  m("mer_netflix", "Netflix", "cat_entertainment", "sub_streaming"),
  m("mer_spotify", "Spotify", "cat_entertainment", "sub_streaming"),
  m("mer_prime_video", "Amazon Prime Video", "cat_entertainment", "sub_streaming"),
  m("mer_hotstar", "Disney+ Hotstar", "cat_entertainment", "sub_streaming"),
  m("mer_bookmyshow", "BookMyShow", "cat_entertainment", "sub_movies"),
  m("mer_steam", "Steam", "cat_entertainment", "sub_gaming"),
  m("mer_playstation", "PlayStation Store", "cat_entertainment", "sub_gaming"),
  m("mer_youtube_premium", "YouTube Premium", "cat_entertainment", "sub_streaming"),

  // Education
  m("mer_udemy", "Udemy", "cat_education", "sub_courses"),
  m("mer_coursera", "Coursera", "cat_education", "sub_courses"),
  m("mer_books_beyond", "Books & Beyond", "cat_education", "sub_books"),
  m("mer_school_generic", "School Fees Office", "cat_education", "sub_school_fees"),

  // Business / freelancer tools
  m("mer_aws", "AWS", "cat_business", "sub_cloud_infra"),
  m("mer_digitalocean", "DigitalOcean", "cat_business", "sub_cloud_infra"),
  m("mer_vercel", "Vercel", "cat_business", "sub_cloud_infra"),
  m("mer_github", "GitHub", "cat_business", "sub_saas_tools"),
  m("mer_figma", "Figma", "cat_business", "sub_saas_tools"),
  m("mer_adobe", "Adobe Creative Cloud", "cat_business", "sub_saas_tools"),
  m("mer_wise", "Wise Transfer", "cat_transfer", "sub_internal_transfer"),
  m("mer_gst_portal", "GST Portal", "cat_business", "sub_taxes"),
  m("mer_wework", "WeWork", "cat_business", "sub_office_rent"),

  // Housing / family
  m("mer_landlord", "Landlord", "cat_housing", "sub_rent"),
  m("mer_home_loan_bank", "Home Loan EMI", "cat_housing", "sub_home_emi"),
  m("mer_car_loan_bank", "Car Loan EMI", "cat_business", "sub_car_emi"),
  m("mer_bescom", "BESCOM Electricity", "cat_bills", "sub_electricity"),
  m("mer_bwssb", "BWSSB Water", "cat_bills", "sub_water"),
  m("mer_indane_gas", "Indane Gas", "cat_bills", "sub_gas"),
  m("mer_airtel", "Airtel", "cat_bills", "sub_mobile"),
  m("mer_jio_mobile", "Jio Mobile", "cat_bills", "sub_mobile"),
  m("mer_jiofiber", "JioFiber", "cat_bills", "sub_internet"),
  m("mer_act_broadband", "ACT Fibernet", "cat_bills", "sub_internet"),

  // Income sources
  m("mer_employer_generic", "Employer Payroll", "cat_income", "sub_salary"),
  m("mer_upwork", "Upwork", "cat_income", "sub_client_payment"),
  m("mer_fiverr", "Fiverr", "cat_income", "sub_client_payment"),
  m("mer_parents", "Parents Transfer", "cat_income", "sub_pocket_money"),
  m("mer_university", "University Scholarship Office", "cat_income", "sub_scholarship"),
  m("mer_bank_interest", "Savings Account Interest", "cat_income", "sub_interest"),
  m("mer_dividend_credit", "Dividend Payout", "cat_income", "sub_investment_redemption"),
  m("mer_cashback_reward", "Cashback Reward", "cat_income", "sub_cashback"),
  m("mer_employer_reimbursement", "Employer Reimbursement", "cat_income", "sub_reimbursement"),
  m("mer_investment_redemption", "Mutual Fund Redemption", "cat_income", "sub_investment_redemption"),
  m("mer_order_refund", "Order Refund", "cat_income", "sub_refund"),
  m("mer_tax_refund", "Income Tax Refund", "cat_income", "sub_refund"),
  m("mer_gift_income", "Gift Received", "cat_income", "sub_bonus"),

  // Investment platforms
  m("mer_zerodha_coin", "Zerodha Coin", "cat_investment", "sub_mutual_funds"),
  m("mer_groww", "Groww", "cat_investment", "sub_mutual_funds"),
  m("mer_zerodha_kite", "Zerodha Kite", "cat_investment", "sub_stocks"),
  m("mer_coindcx", "CoinDCX", "cat_investment", "sub_crypto"),
  m("mer_epfo", "EPFO", "cat_investment", "sub_epf"),
  m("mer_safegold", "SafeGold Digital Gold", "cat_investment", "sub_gold"),

  // Taxes & government
  m("mer_income_tax_portal", "Income Tax e-Filing Portal", "cat_business", "sub_income_tax"),
  m("mer_property_tax_office", "Municipal Property Tax", "cat_housing", "sub_property_tax"),
  m("mer_govt_services_generic", "Government Services (Passport/RTO)", "cat_others", "sub_govt_services"),

  // Cash & charity
  m("mer_atm_withdrawal", "ATM Cash Withdrawal", "cat_transfer", "sub_atm_withdrawal"),
  m("mer_charity_generic", "Charity Donation", "cat_others", "sub_charity"),
  m("mer_bank_charges", "Bank Charges", "cat_bills", "sub_bank_charges"),
  m("mer_fd_bank", "Bank Fixed Deposit", "cat_investment", "sub_fixed_deposit"),

  // Others
  m("mer_local_store", "Local Store", "cat_others", "sub_miscellaneous"),
  m("mer_gift_generic", "Gift", "cat_others", "sub_gifts"),
  m("mer_salon", "Urban Company Salon", "cat_others", "sub_miscellaneous"),
];

export function getMerchant(id: string): Merchant {
  const found = merchants.find((mm) => mm.id === id);
  if (!found) throw new Error(`Unknown merchant: ${id}`);
  return found;
}
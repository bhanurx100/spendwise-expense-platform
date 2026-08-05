/**
 * Merchant/Icon color mapping — centralized brand colors.
 *
 * This file provides brand-specific colors for common merchants and services.
 * When a merchant name matches, use its brand color. Otherwise, fall back to
 * the category palette or a default color.
 *
 * This is NOT in data.ts because data.ts is temporary/demo data.
 * Real merchant data comes from the database, so color mapping should be
 * computed dynamically based on merchant names.
 */

export const MERCHANT_COLORS: Record<string, string> = {
  // Food & Delivery
  'zomato': '#ef233c',
  'swiggy': '#fc8019',
  'starbucks': '#00704a',
  'mcdonalds': '#ffc72c',
  'dominos': '#00648d',
  'kfc': '#c41024',
  'subway': '#005d4b',
  'pizza hut': '#e31837',
  'burger king': '#d62300',

  // Shopping & E-commerce
  'amazon': '#ff9900',
  'flipkart': '#2874f0',
  'myntra': '#ff3f6c',
  'ajio': '#4a4a4a',
  'meesho': '#f43397',
  'nykaa': '#ff3f6c',
  'tata cliq': '#0a2351',
  'snapdeal': '#e40046',

  // Payments & Finance
  'paytm': '#00baf2',
  'phonepe': '#6739b7',
  'google pay': '#4285f4',
  'gpay': '#4285f4',
  'upi': '#ffffff',
  'razorpay': '#072654',
  'payu': '#0088cc',

  // Utilities & Bills
  'airtel': '#ed1c24',
  'jio': '#1c2331',
  'vi': '#e40000',
  'bsnl': '#0057b8',
  'act fibernet': '#00a651',
  'airtel xstream': '#ed1c24',
  'tata play': '#0057b8',

  // Banking
  'hdfc bank': '#0057b8',
  'icici bank': '#ffd700',
  'sbi': '#1a4d2e',
  'axis bank': '#8b3a3a',
  'kotak': '#2874f0',
  'indusind': '#e40046',

  // Entertainment
  'netflix': '#e50914',
  'spotify': '#1db954',
  'youtube': '#ff0000',
  'prime video': '#00a8e1',
  'hotstar': '#09061c',
  'disney+': '#113ccf',
  'sonyliv': '#000000',

  // Travel
  'uber': '#000000',
  'ola': '#000000',
  'makemytrip': '#d32f2f',
  'cleartrip': '#e31837',
  'irctc': '#1a237e',
  'redbus': '#d32f2f',

  // Others
  'google': '#4285f4',
  'microsoft': '#00a4ef',
  'apple': '#000000',
  'facebook': '#1877f2',
  'instagram': '#e1306c',
  'twitter': '#1da1f2',
  'linkedin': '#0077b5',
  'whatsapp': '#25d366',
}

/**
 * Get color for a merchant by name (case-insensitive).
 * Returns brand color if known, otherwise returns null.
 */
export function getMerchantColor(merchantName: string): string | null {
  if (!merchantName) return null
  const normalizedName = merchantName.toLowerCase().trim()
  return MERCHANT_COLORS[normalizedName] || null
}

/**
 * Get color for an icon name.
 * Returns brand color if the icon corresponds to a known merchant,
 * otherwise returns null.
 */
export function getIconColor(iconName: string): string | null {
  if (!iconName) return null
  const normalizedIcon = iconName.toLowerCase().trim()
  
  // Map icon names to merchant names
  const iconToMerchant: Record<string, string> = {
    'shopping-bag': 'amazon',
    'utensils': 'zomato',
    'wifi': 'airtel',
    'credit-card': 'hdfc bank',
    'smartphone': 'airtel',
    'play': 'netflix',
    'wallet': 'paytm',
    'briefcase': 'google',
  }
  
  const merchantName = iconToMerchant[normalizedIcon]
  if (merchantName) {
    return MERCHANT_COLORS[merchantName] || null
  }
  
  return null
}

/**
 * Category color palette — presentation-layer concern.
 *
 * Database entities carry content only; distinct visual colors are assigned
 * here, by display position. Categories added or removed later are colored
 * automatically — no data change required.
 */
export const CATEGORY_PALETTE = [
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
  '#6366f1', // indigo
  '#84cc16', // lime
  '#14b8a6', // teal
  '#a855f7', // violet
] as const

export function categoryPaletteColor(index: number): string {
  return CATEGORY_PALETTE[((index % CATEGORY_PALETTE.length) + CATEGORY_PALETTE.length) % CATEGORY_PALETTE.length]
}

/**
 * Return the categories with palette colors applied by display position.
 * Pass the array in the exact order it will be rendered.
 */
export function withCategoryPalette<T extends { color: string }>(categories: T[]): T[] {
  return categories.map((c, i) => ({ ...c, color: categoryPaletteColor(i) }))
}

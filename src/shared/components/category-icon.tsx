'use client'

import {
  AlertTriangle,
  BookOpen,
  Briefcase,
  Car,
  Crown,
  FileText,
  Flame,
  Fuel,
  Heart,
  HeartPulse,
  Home,
  Landmark,
  MoreHorizontal,
  Palmtree,
  PiggyBank,
  Pizza,
  Plane,
  Play,
  Popcorn,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Utensils,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { getIconColor, getMerchantColor } from '@/src/shared/lib/merchant-colors'
import { categoryPaletteColor } from '@/src/shared/lib/category-colors'

const icons: Record<string, LucideIcon> = {
  'shopping-bag': ShoppingBag,
  utensils: Utensils,
  'file-text': FileText,
  car: Car,
  play: Play,
  'heart-pulse': HeartPulse,
  heart: Heart,
  'book-open': BookOpen,
  plane: Plane,
  'more-horizontal': MoreHorizontal,
  briefcase: Briefcase,
  fuel: Fuel,
  wallet: Wallet,
  landmark: Landmark,
  'piggy-bank': PiggyBank,
  palmtree: Palmtree,
  pizza: Pizza,
  home: Home,
  popcorn: Popcorn,
  crown: Crown,
  'trending-up': TrendingUp,
  flame: Flame,
  'alert-triangle': AlertTriangle,
  sparkles: Sparkles,
  zap: Zap,
}

export function CategoryIcon({
  name,
  className,
  color,
  index,
  merchant,
}: {
  name: string
  className?: string
  color?: string
  index?: number
  merchant?: string
}) {
  const Icon = icons[name] ?? MoreHorizontal

  // Use provided color, or get from merchant name, or get from icon mapping, or fall back to palette
  const iconColor = color || (merchant ? getMerchantColor(merchant) : undefined) || getIconColor(name) || (index !== undefined ? categoryPaletteColor(index) : undefined)

  return <Icon className={className} style={iconColor ? { color: iconColor } : undefined} aria-hidden="true" />
}

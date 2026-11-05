/**
 * AccountNavigation.js — Single Source of Truth for Customer Navigation
 * Clean flat list without section headings, Notifications, Profile, or Security.
 * (Notifications, Profile, and Security are accessed via the Top Navbar).
 */

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Heart,
  Star,
  CreditCard,
  RotateCcw,
  RefreshCw,
  TrendingUp,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'

export const CUSTOMER_NAV_ITEMS = [
  { label: 'Overview',   path: ROUTES.CUSTOMER_DASHBOARD,     icon: LayoutDashboard },
  { label: 'Analytics',  path: ROUTES.CUSTOMER_ANALYTICS,     icon: TrendingUp },
  { label: 'My Orders',  path: ROUTES.CUSTOMER_ORDERS,        icon: Package },
  { label: 'Cart',       path: ROUTES.CUSTOMER_CART,          icon: ShoppingCart },
  { label: 'Wishlist',   path: ROUTES.CUSTOMER_WISHLIST,      icon: Heart },
  { label: 'Reviews',    path: ROUTES.CUSTOMER_REVIEWS,       icon: Star },
  { label: 'Payments',   path: ROUTES.CUSTOMER_PAYMENTS,      icon: CreditCard },
  { label: 'Returns',    path: ROUTES.CUSTOMER_RETURNS,       icon: RotateCcw },
  { label: 'Refunds',    path: ROUTES.CUSTOMER_REFUNDS,       icon: RefreshCw },
]

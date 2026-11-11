/**
 * AccountNavigation.js — Single Source of Truth for Customer Navigation
 * Structured into logical sections with clear hierarchy, icons, routes, and badge mappings.
 */

import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  ShoppingCart,
  Heart,
  Star,
  CreditCard,
  RotateCcw,
  RefreshCw,
  TrendingUp,
  User,
  Bell,
  ShieldCheck,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'

export const CUSTOMER_NAV_SECTIONS = [
  {
    title: 'Marketplace',
    items: [
      { label: 'Overview', path: ROUTES.CUSTOMER_DASHBOARD, icon: LayoutDashboard },
      { label: 'Explore Products', path: ROUTES.CUSTOMER_PRODUCTS, icon: ShoppingBag },
      { label: 'Cart', path: ROUTES.CUSTOMER_CART, icon: ShoppingCart, badgeKey: 'cart' },
      { label: 'Wishlist', path: ROUTES.CUSTOMER_WISHLIST, icon: Heart },
    ],
  },
  {
    title: 'Orders & Purchases',
    items: [
      { label: 'My Orders', path: ROUTES.CUSTOMER_ORDERS, icon: Package },
      { label: 'Reviews & Ratings', path: ROUTES.CUSTOMER_REVIEWS, icon: Star },
      { label: 'Returns', path: ROUTES.CUSTOMER_RETURNS, icon: RotateCcw },
      { label: 'Refunds', path: ROUTES.CUSTOMER_REFUNDS, icon: RefreshCw },
    ],
  },
  {
    title: 'Account & Insights',
    items: [
      { label: 'Payment History', path: ROUTES.CUSTOMER_PAYMENTS, icon: CreditCard },
      { label: 'Spending Analytics', path: ROUTES.CUSTOMER_ANALYTICS, icon: TrendingUp },
      { label: 'My Profile & Addresses', path: ROUTES.CUSTOMER_PROFILE, icon: User },
      { label: 'Login Activity', path: ROUTES.CUSTOMER_LOGIN_ACTIVITY, icon: ShieldCheck },
      { label: 'Notifications', path: ROUTES.CUSTOMER_NOTIFICATIONS, icon: Bell, badgeKey: 'notifications' },
    ],
  },
]

// Flat list for any consumer requiring an unnested array of all customer items
export const CUSTOMER_NAV_ITEMS = CUSTOMER_NAV_SECTIONS.flatMap((section) => section.items)

export default CUSTOMER_NAV_SECTIONS

/**
 * routes.js — Application Route Constants
 *
 * WHY THIS FILE EXISTS:
 *   If you write '/customer/dashboard' as a raw string in 10 places and
 *   later rename the route, you must find and update all 10 places.
 *   With constants, you update ONE line here.
 *
 *   Import: import { ROUTES } from '@/constants/routes'
 *   Usage:  <Link to={ROUTES.CUSTOMER_DASHBOARD}>Dashboard</Link>
 *           navigate(ROUTES.LOGIN)
 */

export const ROUTES = {
  // Root
  HOME: '/',

  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  VERIFY_OTP: '/verify-otp',
  RESET_PASSWORD: '/reset-password',
  UNAUTHORIZED: '/forbidden',

  // Customer
  CUSTOMER_DASHBOARD: '/customer/dashboard',
  CUSTOMER_ANALYTICS: '/customer/analytics',
  CUSTOMER_PROFILE: '/customer/profile',
  CUSTOMER_PRODUCTS: '/customer/products',
  CUSTOMER_PRODUCT_DETAILS: '/customer/products/:id',
  CUSTOMER_CART: '/customer/cart',
  CUSTOMER_WISHLIST: '/customer/wishlist',
  CUSTOMER_CHECKOUT: '/customer/checkout',
  CUSTOMER_ORDERS: '/customer/orders',
  CUSTOMER_ORDER_DETAILS: '/customer/orders/:id',
  CUSTOMER_PAYMENTS: '/customer/payments',
  CUSTOMER_REVIEWS: '/customer/reviews',
  CUSTOMER_RETURNS: '/customer/returns',
  CUSTOMER_REFUNDS: '/customer/refunds',
  CUSTOMER_NOTIFICATIONS: '/customer/notifications',

  // Seller
  SELLER_DASHBOARD: '/seller/dashboard',
  SELLER_PROFILE: '/seller/profile',
  SELLER_PRODUCTS: '/seller/products',
  SELLER_ADD_PRODUCT: '/seller/products/add',
  SELLER_EDIT_PRODUCT: '/seller/products/:id/edit',
  SELLER_INVENTORY: '/seller/inventory',
  SELLER_ORDERS: '/seller/orders',
  SELLER_ORDER_DETAILS: '/seller/orders/:id',
  SELLER_REVENUE: '/seller/revenue',
  SELLER_ANALYTICS: '/seller/analytics',
  SELLER_REVIEWS: '/seller/reviews',
  SELLER_NOTIFICATIONS: '/seller/notifications',

  // Admin
  ADMIN_PROFILE: '/admin/profile',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_CUSTOMERS: '/admin/customers',
  ADMIN_SELLERS: '/admin/sellers',
  ADMIN_SELLER_DETAILS: '/admin/sellers/:id',
  ADMIN_SELLER_VERIFICATION: '/admin/sellers/verification',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_ORDER_DETAILS: '/admin/orders/:id',
  ADMIN_PAYMENTS: '/admin/payments',
  ADMIN_INVENTORY: '/admin/inventory',
  ADMIN_REVIEWS: '/admin/reviews',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_NOTIFICATIONS: '/admin/notifications',
}

// Role constants — must match backend role names exactly
export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  SELLER: 'SELLER',
  ADMIN: 'ADMIN',
}

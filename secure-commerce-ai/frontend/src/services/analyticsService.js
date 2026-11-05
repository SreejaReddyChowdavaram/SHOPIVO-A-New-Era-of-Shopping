import api from './api'

/**
 * analyticsService.js — Unified API client for Customer, Seller, and Admin analytics dashboards.
 */

// ─── Customer Analytics ────────────────────────────────────────────────────────

/**
 * Fetch customer overview metrics (orders, spend, returns, refunds, wishlist) for a given date range.
 * @param {object} params - { range, startDate, endDate }
 */
export const getCustomerOverview = async (params = {}) => {
  const response = await api.get('/customer/analytics/overview', { params })
  return response.data?.data
}

/**
 * Fetch customer charts data (order trends, status donut, spend analysis, returns).
 * @param {object} params - { range, startDate, endDate }
 */
export const getCustomerCharts = async (params = {}) => {
  const response = await api.get('/customer/analytics/charts', { params })
  return response.data?.data
}

/**
 * Fetch customer recent activity (purchases and return requests).
 */
export const getCustomerRecentActivity = async () => {
  const response = await api.get('/customer/analytics/recent-activity')
  return response.data?.data
}

// ─── Seller Analytics ──────────────────────────────────────────────────────────

/**
 * Fetch seller overview metrics (products, units sold, orders received, gross sales, refunds).
 * @param {object} params - { range, startDate, endDate }
 */
export const getSellerOverview = async (params = {}) => {
  const response = await api.get('/seller/analytics/overview', { params })
  return response.data?.data
}

/**
 * Fetch seller charts data (monthly sales, orders, status donut, top products, sales vs returns).
 * @param {object} params - { range, startDate, endDate }
 */
export const getSellerCharts = async (params = {}) => {
  const response = await api.get('/seller/analytics/charts', { params })
  return response.data?.data
}

/**
 * Fetch recent seller orders received.
 * @param {number} limit
 */
export const getSellerRecentOrders = async (limit = 10) => {
  const response = await api.get('/seller/analytics/recent-orders', { params: { limit } })
  return response.data?.data
}

/**
 * Legacy helper — Fetch high-level summary metrics.
 */
export const getSellerAnalyticsSummary = async (range = 'all') => {
  const response = await api.get('/seller/analytics/summary', { params: { range } })
  return response.data?.data
}

/**
 * Legacy helper — Fetch daily sales time-series trend data.
 */
export const getSellerSalesTrend = async (range = '7d') => {
  const response = await api.get('/seller/analytics/sales', { params: { range } })
  return response.data?.data
}

/**
 * Legacy helper — Fetch top-selling products for the authenticated seller.
 */
export const getSellerTopProducts = async (range = 'all', limit = 5) => {
  const response = await api.get('/seller/analytics/top-products', { params: { range, limit } })
  return response.data?.data
}

// ─── Admin Analytics ───────────────────────────────────────────────────────────

/**
 * Fetch platform-wide admin overview metrics (customers, sellers, orders, GMV, refunds).
 * @param {object} params - { range, startDate, endDate }
 */
export const getAdminOverview = async (params = {}) => {
  const response = await api.get('/admin/analytics/overview', { params })
  return response.data?.data
}

/**
 * Fetch admin platform charts (order trends, GMV, status donut, user growth, top products, payments).
 * @param {object} params - { range, startDate, endDate }
 */
export const getAdminCharts = async (params = {}) => {
  const response = await api.get('/admin/analytics/charts', { params })
  return response.data?.data
}

/**
 * Fetch platform-wide recent activity (recent orders, new customers, new sellers, recent returns).
 */
export const getAdminRecentActivity = async () => {
  const response = await api.get('/admin/analytics/recent-activity')
  return response.data?.data
}

export default {
  // Customer
  getCustomerOverview,
  getCustomerCharts,
  getCustomerRecentActivity,

  // Seller
  getSellerOverview,
  getSellerCharts,
  getSellerRecentOrders,
  getSellerAnalyticsSummary,
  getSellerSalesTrend,
  getSellerTopProducts,

  // Admin
  getAdminOverview,
  getAdminCharts,
  getAdminRecentActivity,
}

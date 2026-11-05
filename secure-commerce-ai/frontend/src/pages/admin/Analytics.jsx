/**
 * Analytics.jsx — Admin Platform Analytics & Intelligence Portal
 * Route: /admin/analytics
 * Layout: AdminLayout
 *
 * Provides platform-wide analytics and executive intelligence:
 *  - 4 Vibrant hero gradient summary cards (GMV, Orders, Registered Customers, Catalog)
 *  - 6 Secondary metric cards (Delivered, Pending, Cancelled, Returns, Sellers, Refunds)
 *  - Date-range filter (Today, 7d, 30d, This Month, Last Month, This Year, All Time, Custom Range)
 *  - Platform GMV vs Net Revenue trend chart
 *  - Order status distribution donut chart
 *  - Platform order trends line chart (Completed vs Cancelled)
 *  - Customer growth & seller onboarding cohort chart
 *  - Top performing sellers and top platform products rankings
 *  - Purchases vs returns bar chart
 *  - Payment method breakdown donut chart
 *  - Live platform activity: recent orders, new customers, new sellers, recent returns
 */

import React from 'react'
import AdminAnalyticsDashboard from './AdminAnalyticsDashboard'

const Analytics = () => {
  return <AdminAnalyticsDashboard />
}

export default Analytics

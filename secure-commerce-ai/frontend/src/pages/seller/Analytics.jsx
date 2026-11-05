/**
 * Analytics.jsx — Seller Sales Analytics & Performance Overview
 * Route: /seller/analytics (and /seller/revenue)
 * Layout: SellerLayout
 *
 * Provides real-time metrics, historical trends, and product performance:
 *  - 4 Vibrant gradient summary cards (Orders, Gross Sales, Active Catalog, Units Sold)
 *  - Date-range filtering (Today, Last 7 Days, Last 30 Days, This Month, Last Month, This Year, All Time, Custom Range)
 *  - Sales trend area chart, orders received bar chart, status donut chart
 *  - Top-selling products ranking, sales vs returns comparison
 *  - Real-time recent seller orders table
 */

import React from 'react'
import SellerAnalyticsDashboard from './SellerAnalyticsDashboard'

const Analytics = () => {
  return <SellerAnalyticsDashboard />
}

export default Analytics

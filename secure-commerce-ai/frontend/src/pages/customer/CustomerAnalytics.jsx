import React, { useState, useEffect, useCallback } from 'react'
import {
  ShoppingBag,
  DollarSign,
  Clock,
  RotateCcw,
  PackageCheck,
  XCircle,
  Heart,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import CustomerDateFilter from '@/components/customer/analytics/CustomerDateFilter'
import CustomerMetricCard from '@/components/customer/analytics/CustomerMetricCard'
import CustomerTrendChart from '@/components/customer/analytics/CustomerTrendChart'
import CustomerStatusDonut from '@/components/customer/analytics/CustomerStatusDonut'
import CustomerRecentPurchases from '@/components/customer/analytics/CustomerRecentPurchases'
import CustomerAnalyticsSkeleton from '@/components/customer/analytics/CustomerAnalyticsSkeleton'
import {
  getCustomerOverview,
  getCustomerCharts,
  getCustomerRecentActivity,
} from '@/services/analyticsService'
import { ROUTES } from '@/constants/routes'

export default function CustomerAnalytics() {
  const [range, setRange] = useState('all')
  const [customStart, setCustomStart] = useState(null)
  const [customEnd, setCustomEnd] = useState(null)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const [overview, setOverview] = useState({
    totalOrders: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    returnedOrders: 0,
    totalAmountSpent: 0,
    totalRefundAmount: 0,
    wishlistCount: 0,
    dateRangeLabel: 'All Time',
  })

  const [charts, setCharts] = useState({
    monthlyPurchases: [],
    orderStatusDistribution: [],
    spendingAnalysis: [],
  })

  const [activity, setActivity] = useState({
    recentPurchases: [],
  })

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setRefreshing(true)
    setError(null)

    try {
      const params = { range }
      if (range === 'custom' && customStart && customEnd) {
        params.startDate = customStart
        params.endDate = customEnd
      }

      const [ovData, chData, actData] = await Promise.all([
        getCustomerOverview(params),
        getCustomerCharts(params),
        getCustomerRecentActivity(),
      ])

      if (ovData) setOverview(ovData)
      if (chData) {
        setCharts({
          monthlyPurchases: chData.monthlyPurchases || [],
          orderStatusDistribution: chData.orderStatusDistribution || [],
          spendingAnalysis: chData.spendingAnalysis || [],
        })
      }
      if (actData) {
        setActivity({
          recentPurchases: actData.recentPurchases || [],
        })
      }
    } catch (err) {
      console.error('Failed to load customer analytics:', err)
      setError(err.response?.data?.message || err.message || 'Failed to load customer analytics data.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [range, customStart, customEnd])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRangeChange = (newRange, start, end) => {
    setRange(newRange)
    if (newRange === 'custom') {
      setCustomStart(start)
      setCustomEnd(end)
    } else {
      setCustomStart(null)
      setCustomEnd(null)
    }
  }

  const formatCurrency = (val) => {
    return `₹${Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-7 pb-6 max-w-[1440px] mx-auto w-full">
      {/* ── Page Header & Quick Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-1 border-b border-slate-200/60 dark:border-[#1e293b]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <span>Customer Analytics</span>
            {refreshing && <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your shopping activity, purchases, spending and returns.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap sm:flex-nowrap">
          <CustomerDateFilter
            currentRange={range}
            currentLabel={overview.dateRangeLabel}
            onRangeChange={handleRangeChange}
          />
          <button
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            type="button"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#101726] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2438] transition-colors shadow-xs cursor-pointer disabled:opacity-60 shrink-0"
            aria-label="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* ── Error Banner with Retry ── */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadData(false)}
            type="button"
            className="px-3 py-1 font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Loading Skeleton vs Content ── */}
      {loading ? (
        <CustomerAnalyticsSkeleton />
      ) : (
        <div className="flex flex-col gap-6 sm:gap-7">
          {/* ── 1. Unified 8-KPI Metric Grid ── */}
          {/* Desktop >= 1280px: 4 columns (2 rows of 4) */}
          {/* Tablet/Laptop: 2 columns */}
          {/* Narrow Mobile < 480px: 1 column */}
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Metric 1: Orders Placed */}
            <CustomerMetricCard
              title="Orders Placed"
              value={overview.totalOrders.toLocaleString()}
              subLabel="Completed Orders"
              subValue={`${overview.deliveredOrders} Delivered`}
              icon={ShoppingBag}
              color="blue"
            />

            {/* Metric 2: Total Spent */}
            <CustomerMetricCard
              title="Total Spent"
              value={formatCurrency(overview.totalAmountSpent)}
              subLabel="Purchase Value"
              subValue={overview.dateRangeLabel}
              icon={DollarSign}
              color="emerald"
            />

            {/* Metric 3: Pending Orders */}
            <CustomerMetricCard
              title="Pending Orders"
              value={overview.pendingOrders.toLocaleString()}
              subLabel="Awaiting Delivery"
              subValue={overview.pendingOrders > 0 ? `${overview.pendingOrders} In Transit` : 'None active'}
              icon={Clock}
              color="amber"
            />

            {/* Metric 4: Total Returns */}
            <CustomerMetricCard
              title="Total Returns"
              value={overview.returnedOrders.toLocaleString()}
              subLabel="Return Requests"
              subValue={`${overview.returnedOrders} Processed`}
              icon={RotateCcw}
              color="rose"
            />

            {/* Metric 5: Delivered Orders */}
            <CustomerMetricCard
              title="Delivered Orders"
              value={overview.deliveredOrders.toLocaleString()}
              subLabel="Fulfillment Status"
              subValue="Fulfilled & Received"
              icon={PackageCheck}
              color="emerald"
            />

            {/* Metric 6: Cancelled Orders */}
            <CustomerMetricCard
              title="Cancelled Orders"
              value={overview.cancelledOrders.toLocaleString()}
              subLabel="Order Status"
              subValue="Cancelled before shipping"
              icon={XCircle}
              color="red"
            />

            {/* Metric 7: Refunded Amount */}
            <CustomerMetricCard
              title="Refunded Amount"
              value={formatCurrency(overview.totalRefundAmount)}
              subLabel="Reversal Status"
              subValue="Processed to source"
              icon={RotateCcw}
              color="purple"
            />

            {/* Metric 8: Wishlist Products */}
            <CustomerMetricCard
              title="Wishlist Products"
              value={overview.wishlistCount.toLocaleString()}
              subLabel="Saved Items"
              subValue="Watching for deals"
              icon={Heart}
              color="violet"
            />
          </div>

          {/* ── 2. Charts Section (Balanced 2-Column Grid) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            <CustomerTrendChart
              title="Purchase Activity Trend"
              subtitle="Monthly orders placed over time"
              data={charts.monthlyPurchases}
              height={280}
            />

            <CustomerStatusDonut
              title="Order Status Distribution"
              subtitle="Delivered / Pending / Shipped / Cancelled / Returned"
              data={charts.orderStatusDistribution}
              totalLabel="Orders"
              height={280}
            />
          </div>

          {/* ── 3. Bottom Section: Recently Purchased Products ── */}
          <div>
            <CustomerRecentPurchases
              title="Recently Purchased Products"
              subtitle="Your latest order items and fulfillment status"
              orders={activity.recentPurchases}
              viewAllLink={ROUTES.CUSTOMER_ORDERS}
            />
          </div>
        </div>
      )}
    </div>
  )
}

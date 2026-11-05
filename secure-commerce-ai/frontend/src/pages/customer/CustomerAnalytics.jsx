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
import AnalyticsDateFilter from '@/components/analytics/AnalyticsDateFilter'
import AnalyticsSummaryCard from '@/components/analytics/AnalyticsSummaryCard'
import AnalyticsSecondaryStat from '@/components/analytics/AnalyticsSecondaryStat'
import AnalyticsLineChart from '@/components/analytics/AnalyticsLineChart'
import AnalyticsDonutChart from '@/components/analytics/AnalyticsDonutChart'
import AnalyticsBarChart from '@/components/analytics/AnalyticsBarChart'
import RecentOrdersTable from '@/components/analytics/RecentOrdersTable'
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
    return `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-7 pb-12 max-w-[1400px] mx-auto">
      {/* ── Page Header & Quick Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <span>Customer Analytics</span>
            {refreshing && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your shopping activity, purchases, spending, and returns.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#25334A] bg-white dark:bg-[#111C30] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* ── Date Filter Bar ── */}
      <AnalyticsDateFilter
        currentRange={range}
        currentLabel={overview.dateRangeLabel}
        onRangeChange={handleRangeChange}
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-28 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-medium text-slate-500">Loading your shopping analytics...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 sm:gap-7">
          {/* ── 1. Top Section: 4 Main Summary Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <AnalyticsSummaryCard
              title="Orders Placed"
              value={overview.totalOrders.toLocaleString()}
              subLabel="Completed Orders"
              subValue={`${overview.deliveredOrders} Delivered`}
              icon={ShoppingBag}
              gradientColor="blue"
            />

            <AnalyticsSummaryCard
              title="Total Spent"
              value={formatCurrency(overview.totalAmountSpent)}
              subLabel="Purchase Value"
              subValue={overview.dateRangeLabel}
              icon={DollarSign}
              gradientColor="emerald"
            />

            <AnalyticsSummaryCard
              title="Pending Orders"
              value={overview.pendingOrders.toLocaleString()}
              subLabel="Awaiting Delivery"
              subValue={overview.pendingOrders > 0 ? `${overview.pendingOrders} In Transit` : 'None active'}
              icon={Clock}
              gradientColor="amber"
            />

            <AnalyticsSummaryCard
              title="Total Returns"
              value={overview.returnedOrders.toLocaleString()}
              subLabel="Return Requests"
              subValue={`${overview.returnedOrders} Processed`}
              icon={RotateCcw}
              gradientColor="rose"
            />
          </div>

          {/* ── 2. Secondary Metrics (4-stat row) ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <AnalyticsSecondaryStat
              title="Delivered Orders"
              value={overview.deliveredOrders.toLocaleString()}
              icon={PackageCheck}
              color="emerald"
              subText="Fulfilled & Received"
            />

            <AnalyticsSecondaryStat
              title="Cancelled Orders"
              value={overview.cancelledOrders.toLocaleString()}
              icon={XCircle}
              color="rose"
              subText="Cancelled before shipping"
            />

            <AnalyticsSecondaryStat
              title="Refunded Amount"
              value={formatCurrency(overview.totalRefundAmount)}
              icon={DollarSign}
              color="blue"
              subText="Processed to source"
            />

            <AnalyticsSecondaryStat
              title="Wishlist Products"
              value={overview.wishlistCount.toLocaleString()}
              icon={Heart}
              color="pink"
              subText="Saved items watching"
            />
          </div>

          {/* ── 3. Middle Section: Charts ── */}
          {/* Row 1: Line Chart (60%) + Donut Chart (40%) on Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
            {/* Chart A: Purchase Activity Trend (~60% on desktop) */}
            <div className="lg:col-span-7">
              <AnalyticsLineChart
                title="Purchase Activity Trend"
                subtitle="Monthly orders placed over time"
                data={charts.monthlyPurchases}
                series={[
                  { key: 'orderCount', name: 'Orders Placed', color: '#3b82f6' }
                ]}
                height={320}
                type="area"
              />
            </div>

            {/* Chart B: Order Status Distribution (~40% on desktop) */}
            <div className="lg:col-span-5">
              <AnalyticsDonutChart
                title="Order Status Distribution"
                subtitle="Delivered / Pending / Shipped / Cancelled / Returned"
                data={charts.orderStatusDistribution}
                totalLabel="Orders"
                height={320}
              />
            </div>
          </div>

          {/* Row 2: Monthly Spending Breakdown (Full Width) */}
          <div>
            <AnalyticsBarChart
              title="Monthly Spending Breakdown"
              subtitle="Total money spent per month on fulfilled orders (in ₹)"
              data={charts.spendingAnalysis}
              series={[
                { key: 'amountSpent', name: 'Amount Spent (₹)', color: '#10b981' }
              ]}
              isCurrency={true}
              xKey="month"
              height={320}
            />
          </div>

          {/* ── 4. Bottom Section: Recently Purchased Products (Full Width) ── */}
          <div>
            <RecentOrdersTable
              title="Recently Purchased Products"
              subtitle="Your latest order items and fulfillment status"
              orders={activity.recentPurchases}
              role="customer"
              viewAllLink={ROUTES.CUSTOMER_ORDERS}
            />
          </div>
        </div>
      )}
    </div>
  )
}

import React, { useState, useEffect, useCallback } from 'react'
import {
  Package,
  ShoppingBag,
  DollarSign,
  PackageCheck,
  Clock,
  XCircle,
  RotateCcw,
  Boxes,
  AlertCircle,
  Loader2,
  RefreshCw,
  Tag,
} from 'lucide-react'
import AnalyticsDateFilter from '@/components/analytics/AnalyticsDateFilter'
import AnalyticsSummaryCard from '@/components/analytics/AnalyticsSummaryCard'
import AnalyticsSecondaryStat from '@/components/analytics/AnalyticsSecondaryStat'
import AnalyticsLineChart from '@/components/analytics/AnalyticsLineChart'
import AnalyticsDonutChart from '@/components/analytics/AnalyticsDonutChart'
import AnalyticsBarChart from '@/components/analytics/AnalyticsBarChart'
import RecentOrdersTable from '@/components/analytics/RecentOrdersTable'
import TopProductsList from '@/components/analytics/TopProductsList'
import {
  getSellerOverview,
  getSellerCharts,
  getSellerRecentOrders,
} from '@/services/analyticsService'
import { ROUTES } from '@/constants/routes'

export default function SellerAnalyticsDashboard() {
  const [range, setRange] = useState('all')
  const [customStart, setCustomStart] = useState(null)
  const [customEnd, setCustomEnd] = useState(null)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const [overview, setOverview] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalOrdersReceived: 0,
    totalUnitsSold: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    returnedOrders: 0,
    grossSales: 0,
    refundAmount: 0,
    dateRangeLabel: 'All Time',
  })

  const [charts, setCharts] = useState({
    monthlySales: [],
    ordersReceived: [],
    orderStatusDistribution: [],
    topProducts: [],
    salesVsReturns: [],
    revenueOverview: [],
  })

  const [recentOrders, setRecentOrders] = useState([])

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

      const [ovData, chData, ordersData] = await Promise.all([
        getSellerOverview(params),
        getSellerCharts(params),
        getSellerRecentOrders(10),
      ])

      if (ovData) setOverview(ovData)
      if (chData) setCharts(chData)
      if (ordersData) setRecentOrders(ordersData)
    } catch (err) {
      console.error('Failed to load seller analytics:', err)
      setError(err.response?.data?.message || err.message || 'Failed to load seller analytics.')
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
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)] flex items-center gap-2.5">
            <span>Seller Analytics</span>
            {refreshing && <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
            Track your storefront revenue, order velocity, catalog reach, and product performance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors shadow-xs cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[var(--color-primary)]' : ''}`} />
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
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">Aggregating seller sales and orders data...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 sm:gap-7">
          {/* ── 1. Top Section: 4 Primary Summary Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
            <AnalyticsSummaryCard
              title="Orders Received"
              value={overview.totalOrdersReceived.toLocaleString()}
              subLabel="Completed Orders"
              subValue={`${overview.deliveredOrders} Delivered`}
              icon={ShoppingBag}
              gradientColor="blue"
            />

            <AnalyticsSummaryCard
              title="Gross Sales"
              value={formatCurrency(overview.grossSales)}
              subLabel="Selected Period"
              subValue={overview.dateRangeLabel}
              icon={DollarSign}
              gradientColor="emerald"
            />

            <AnalyticsSummaryCard
              title="Active Catalog"
              value={overview.activeProducts.toLocaleString()}
              subLabel="Total Listings"
              subValue={`${overview.totalProducts} Products`}
              icon={Boxes}
              gradientColor="amber"
            />

            <AnalyticsSummaryCard
              title="Units Sold"
              value={(overview.totalUnitsSold || 0).toLocaleString()}
              subLabel="Refunded Value"
              subValue={formatCurrency(overview.refundAmount)}
              icon={Tag}
              gradientColor="rose"
            />
          </div>

          {/* ── 2. Secondary Metrics (6-stat grid) ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <AnalyticsSecondaryStat
              title="Delivered"
              value={overview.deliveredOrders.toLocaleString()}
              icon={PackageCheck}
              color="emerald"
              subText="Fulfilled items"
            />

            <AnalyticsSecondaryStat
              title="Pending"
              value={overview.pendingOrders.toLocaleString()}
              icon={Clock}
              color="amber"
              subText="In fulfillment"
            />

            <AnalyticsSecondaryStat
              title="Cancelled"
              value={overview.cancelledOrders.toLocaleString()}
              icon={XCircle}
              color="rose"
              subText="Order cancellations"
            />

            <AnalyticsSecondaryStat
              title="Returned"
              value={overview.returnedOrders.toLocaleString()}
              icon={RotateCcw}
              color="pink"
              subText="Return requests"
            />

            <AnalyticsSecondaryStat
              title="Total Products"
              value={overview.totalProducts.toLocaleString()}
              icon={Package}
              color="blue"
              subText="In catalog"
            />

            <AnalyticsSecondaryStat
              title="Refund Value"
              value={formatCurrency(overview.refundAmount)}
              icon={DollarSign}
              color="slate"
              subText="Processed refunds"
            />
          </div>

          {/* ── 3. Middle Section: Charts (2-Column Grid) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 1: Sales Volume Trend */}
            <AnalyticsLineChart
              title="Sales Volume Trend"
              subtitle="Monthly gross revenue generated across non-cancelled orders"
              data={charts.monthlySales}
              series={[
                { key: 'grossSales', name: 'Gross Sales (₹)', color: '#0F8F6B' }
              ]}
              isCurrency={true}
              height={320}
              type="area"
            />

            {/* Chart 2: Order Status Distribution */}
            <AnalyticsDonutChart
              title="Order Status Distribution"
              subtitle="Breakdown of customer orders containing your items"
              data={charts.orderStatusDistribution}
              totalLabel="Orders"
              height={320}
            />

            {/* Chart 3: Orders Received by Month */}
            <AnalyticsBarChart
              title="Orders Received by Month"
              subtitle="Distinct orders and units sold"
              data={charts.ordersReceived}
              series={[
                { key: 'ordersReceived', name: 'Orders Received', color: '#0F8F6B' },
                { key: 'unitsSold', name: 'Units Sold', color: '#0B7A5B' },
              ]}
              xKey="month"
              height={320}
            />

            {/* Chart 4: Sales vs Returns Comparison */}
            <AnalyticsBarChart
              title="Sales vs. Returns Comparison"
              subtitle="Comparison of units sold against returned items"
              data={charts.salesVsReturns}
              series={[
                { key: 'unitsSold', name: 'Units Sold', color: '#0F8F6B' },
                { key: 'unitsReturned', name: 'Units Returned', color: '#f87171' },
              ]}
              xKey="month"
              height={320}
            />
          </div>

          {/* ── 4. Bottom Section: Top Products & Recent Orders ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-1">
              <TopProductsList
                title="Top-Selling Products"
                subtitle="Ranked by total units sold"
                products={charts.topProducts}
                role="seller"
              />
            </div>

            <div className="lg:col-span-2">
              <RecentOrdersTable
                title="Recent Orders Received"
                subtitle="Real-time multi-vendor customer orders"
                orders={recentOrders}
                role="seller"
                viewAllLink={ROUTES.SELLER_ORDERS}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

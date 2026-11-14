import React, { useState, useEffect, useCallback } from 'react'
import {
  Package,
  ShoppingBag,
  DollarSign,
  PackageCheck,
  Clock,
  XCircle,
  TrendingUp,
  Tag,
  AlertCircle,
  Loader2,
  RefreshCw,
  BarChart3,
  Scale,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { useTheme } from '@/context/ThemeContext'
import CustomerDateFilter from '@/components/customer/analytics/CustomerDateFilter'
import CustomerMetricCard from '@/components/customer/analytics/CustomerMetricCard'
import CustomerStatusDonut from '@/components/customer/analytics/CustomerStatusDonut'
import CustomerAnalyticsSkeleton from '@/components/customer/analytics/CustomerAnalyticsSkeleton'
import RecentOrdersTable from '@/components/analytics/RecentOrdersTable'
import TopProductsList from '@/components/analytics/TopProductsList'
import {
  getSellerOverview,
  getSellerCharts,
  getSellerRecentOrders,
} from '@/services/analyticsService'
import { ROUTES } from '@/constants/routes'

export default function SellerAnalyticsDashboard() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

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
      if (chData) {
        setCharts({
          monthlySales: chData.monthlySales || chData.revenueOverview || [],
          ordersReceived: chData.ordersReceived || [],
          orderStatusDistribution: chData.orderStatusDistribution || [],
          topProducts: chData.topProducts || [],
          salesVsReturns: chData.salesVsReturns || [],
          revenueOverview: chData.revenueOverview || [],
        })
      }
      if (ordersData) {
        setRecentOrders(ordersData)
      }
    } catch (err) {
      console.error('Failed to load seller analytics:', err)
      setError(err.response?.data?.message || err.message || 'Failed to load seller analytics data.')
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

  // Calculate Average Order Value (AOV)
  const averageOrderValue =
    overview.totalOrdersReceived > 0
      ? Number(overview.grossSales || 0) / overview.totalOrdersReceived
      : 0

  // Custom Chart Tooltips
  const CurrencyTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3.5 py-2.5 shadow-xl text-xs text-[var(--color-text-primary)]">
          <p className="font-bold text-[var(--color-text-secondary)] mb-1 border-b border-[var(--color-border)] pb-1">
            {label}
          </p>
          <div className="flex items-center justify-between gap-4 pt-0.5">
            <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
              Sales:
            </span>
            <span className="font-extrabold text-[var(--color-primary)]">
              {formatCurrency(payload[0].value)}
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  const CountTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3.5 py-2.5 shadow-xl text-xs text-[var(--color-text-primary)]">
          <p className="font-bold text-[var(--color-text-secondary)] mb-1 border-b border-[var(--color-border)] pb-1">
            {label}
          </p>
          <div className="flex items-center justify-between gap-4 pt-0.5">
            <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
              Orders:
            </span>
            <span className="font-extrabold text-[var(--color-primary)]">
              {Number(payload[0].value).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  const ComparisonTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3.5 py-2.5 shadow-xl text-xs text-[var(--color-text-primary)]">
          <p className="font-bold text-[var(--color-text-secondary)] mb-1.5 border-b border-[var(--color-border)] pb-1">
            {label}
          </p>
          {payload.map((entry, idx) => (
            <div key={`comp-entry-${idx}`} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-extrabold text-[var(--color-text-primary)]">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-7 pb-6 max-w-[1440px] mx-auto w-full">
      {/* ── Page Header & Quick Controls (Matches Customer Analytics) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-1 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)] flex items-center gap-2.5">
            <span>Seller Analytics</span>
            {refreshing && <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
            Track your storefront revenue, order velocity, catalog reach, and product performance.
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
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors shadow-xs cursor-pointer disabled:opacity-60 shrink-0"
            aria-label="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[var(--color-primary)]' : ''}`} />
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
          {/* ── 1. Unified 8-KPI Metric Grid (Exact CustomerAnalytics Styling) ── */}
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Metric 1: Total Revenue */}
            <CustomerMetricCard
              title="Total Revenue"
              value={formatCurrency(overview.grossSales)}
              icon={DollarSign}
              color="emerald"
            />

            {/* Metric 2: Total Orders */}
            <CustomerMetricCard
              title="Orders Received"
              value={overview.totalOrdersReceived.toLocaleString()}
              icon={ShoppingBag}
              color="blue"
            />

            {/* Metric 3: Products Sold */}
            <CustomerMetricCard
              title="Products Sold"
              value={(overview.totalUnitsSold || 0).toLocaleString()}
              icon={Tag}
              color="purple"
            />

            {/* Metric 4: Average Order Value */}
            <CustomerMetricCard
              title="Average Order Value"
              value={formatCurrency(averageOrderValue)}
              icon={TrendingUp}
              color="green"
            />

            {/* Metric 5: Delivered Orders */}
            <CustomerMetricCard
              title="Delivered Orders"
              value={overview.deliveredOrders.toLocaleString()}
              icon={PackageCheck}
              color="emerald"
            />

            {/* Metric 6: Pending Orders */}
            <CustomerMetricCard
              title="Pending Orders"
              value={overview.pendingOrders.toLocaleString()}
              icon={Clock}
              color="amber"
            />

            {/* Metric 7: Cancelled Orders */}
            <CustomerMetricCard
              title="Cancelled Orders"
              value={overview.cancelledOrders.toLocaleString()}
              icon={XCircle}
              color="red"
            />

            {/* Metric 8: Active Products */}
            <CustomerMetricCard
              title="Total Products"
              value={overview.totalProducts.toLocaleString()}
              icon={Package}
              color="violet"
            />
          </div>

          {/* ── 2. Primary Charts Section (Balanced 2-Column Grid) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {/* Chart 1: Revenue Over Time */}
            <div className="group relative flex flex-col justify-between rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] p-5 sm:p-6 shadow-xs transition-all duration-200 hover:shadow-md">
              <div className="flex flex-col items-center justify-center text-center mb-4 sm:mb-5">
                <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] flex items-center justify-center gap-2">
                  <TrendingUp className="w-4.5 h-4.5 text-[var(--color-primary)] shrink-0" aria-hidden="true" />
                  <span>Revenue Over Time</span>
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 text-center">
                  Monthly gross sales generated by your store
                </p>
              </div>

              <div className="w-full flex-1 flex items-center justify-center" style={{ height: 280 }}>
                {charts.monthlySales && charts.monthlySales.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={charts.monthlySales}
                      margin={{ top: 12, right: 16, left: -16, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="sellerRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0F8F6B" stopOpacity={isDark ? 0.45 : 0.25} />
                          <stop offset="95%" stopColor="#0F8F6B" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={isDark ? 'var(--color-border)' : '#D8EBE4'}
                      />
                      <XAxis
                        dataKey="label"
                        stroke={isDark ? 'var(--color-text-secondary)' : '#667B72'}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        dy={6}
                      />
                      <YAxis
                        stroke={isDark ? 'var(--color-text-secondary)' : '#667B72'}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `₹${v}`}
                      />
                      <Tooltip content={<CurrencyTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        name="Gross Revenue"
                        stroke="#0F8F6B"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#sellerRevenueGradient)"
                        activeDot={{ r: 5, fill: '#0F8F6B', stroke: isDark ? 'var(--color-surface)' : '#ffffff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-xs text-slate-400 gap-2">
                    <DollarSign className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <span>No sales revenue recorded for this period</span>
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Order Status Distribution (Exact CustomerStatusDonut) */}
            <CustomerStatusDonut
              title="Order Status Distribution"
              subtitle="Delivered / Pending / Processing / Cancelled / Returned"
              data={charts.orderStatusDistribution}
              totalLabel="Orders"
              height={280}
            />
          </div>

          {/* ── 3. Secondary Charts Grid: Orders Velocity & Sales vs Returns ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {/* Chart 3: Orders Received Over Time */}
            <div className="group relative flex flex-col justify-between rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] p-5 sm:p-6 shadow-xs transition-all duration-200 hover:shadow-md">
              <div className="flex flex-col items-center justify-center text-center mb-4 sm:mb-5">
                <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] flex items-center justify-center gap-2">
                  <BarChart3 className="w-4.5 h-4.5 text-[var(--color-primary)] shrink-0" aria-hidden="true" />
                  <span>Orders Over Time</span>
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 text-center">
                  Volume of orders received per month
                </p>
              </div>

              <div className="w-full flex-1 flex items-center justify-center" style={{ height: 260 }}>
                {charts.ordersReceived && charts.ordersReceived.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={charts.ordersReceived}
                      margin={{ top: 12, right: 16, left: -16, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={isDark ? 'var(--color-border)' : '#D8EBE4'}
                      />
                      <XAxis
                        dataKey="label"
                        stroke={isDark ? 'var(--color-text-secondary)' : '#667B72'}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        dy={6}
                      />
                      <YAxis
                        stroke={isDark ? 'var(--color-text-secondary)' : '#667B72'}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CountTooltip />} />
                      <Bar
                        dataKey="amount"
                        name="Orders"
                        fill="#0F8F6B"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={44}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-xs text-slate-400 gap-2">
                    <ShoppingBag className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <span>No order activity in this period</span>
                  </div>
                )}
              </div>
            </div>

            {/* Chart 4: Sales vs Returns Comparison */}
            <div className="group relative flex flex-col justify-between rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] p-5 sm:p-6 shadow-xs transition-all duration-200 hover:shadow-md">
              <div className="flex flex-col items-center justify-center text-center mb-4 sm:mb-5">
                <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] flex items-center justify-center gap-2">
                  <Scale className="w-4.5 h-4.5 text-[var(--color-primary)] shrink-0" aria-hidden="true" />
                  <span>Sales vs Returns</span>
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 text-center">
                  Monthly gross sales compared against return amounts
                </p>
              </div>

              <div className="w-full flex-1 flex items-center justify-center" style={{ height: 260 }}>
                {charts.salesVsReturns && charts.salesVsReturns.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={charts.salesVsReturns}
                      margin={{ top: 12, right: 16, left: -16, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={isDark ? 'var(--color-border)' : '#D8EBE4'}
                      />
                      <XAxis
                        dataKey="label"
                        stroke={isDark ? 'var(--color-text-secondary)' : '#667B72'}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        dy={6}
                      />
                      <YAxis
                        stroke={isDark ? 'var(--color-text-secondary)' : '#667B72'}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `₹${v}`}
                      />
                      <Tooltip content={<ComparisonTooltip />} />
                      <Bar
                        dataKey="salesAmount"
                        name="Gross Sales"
                        fill="#0F8F6B"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                      />
                      <Bar
                        dataKey="returnAmount"
                        name="Returns"
                        fill="#DC5555"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-xs text-slate-400 gap-2">
                    <Scale className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <span>No sales vs return data for this timeframe</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── 4. Bottom Detail Sections: Top Products & Recent Orders ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {/* Top Performing Products */}
            <TopProductsList
              title="Top Performing Products"
              subtitle="Best-selling items in your store by units and revenue"
              products={charts.topProducts}
              role="seller"
            />

            {/* Recent Orders Received */}
            <RecentOrdersTable
              title="Recent Store Orders"
              subtitle="Latest orders received for your store products"
              orders={recentOrders}
              role="seller"
              viewAllLink={ROUTES.SELLER_ORDERS}
            />
          </div>
        </div>
      )}
    </div>
  )
}

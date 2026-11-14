import React, { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Store,
  Package,
  ShoppingBag,
  PackageCheck,
  Clock,
  RotateCcw,
  DollarSign,
  AlertCircle,
  Loader2,
  RefreshCw,
  TrendingUp,
  CreditCard,
  Building2,
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
import RecentReturnsTable from '@/components/analytics/RecentReturnsTable'
import TopProductsList from '@/components/analytics/TopProductsList'
import {
  getAdminOverview,
  getAdminCharts,
  getAdminRecentActivity,
} from '@/services/analyticsService'
import { ROUTES } from '@/constants/routes'

export default function AdminAnalyticsDashboard() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [range, setRange] = useState('all')
  const [customStart, setCustomStart] = useState(null)
  const [customEnd, setCustomEnd] = useState(null)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const [overview, setOverview] = useState({
    totalCustomers: 0,
    totalSellers: 0,
    totalProducts: 0,
    totalOrders: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    returnedOrders: 0,
    totalOrderValue: 0,
    refundAmount: 0,
    dateRangeLabel: 'All Time',
  })

  const [charts, setCharts] = useState({
    platformOrderTrends: [],
    monthlyGmv: [],
    orderStatusDistribution: [],
    customerGrowth: [],
    sellerPerformance: [],
    productPerformance: [],
    purchaseVsReturns: [],
    paymentDistribution: [],
  })

  const [activity, setActivity] = useState({
    recentOrders: [],
    newCustomers: [],
    newSellers: [],
    recentReturns: [],
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
        getAdminOverview(params),
        getAdminCharts(params),
        getAdminRecentActivity(),
      ])

      if (ovData) setOverview(ovData)
      if (chData) {
        setCharts({
          platformOrderTrends: chData.platformOrderTrends || [],
          monthlyGmv: chData.monthlyGmv || [],
          orderStatusDistribution: chData.orderStatusDistribution || [],
          customerGrowth: chData.customerGrowth || [],
          sellerPerformance: chData.sellerPerformance || [],
          productPerformance: chData.productPerformance || [],
          purchaseVsReturns: chData.purchaseVsReturns || [],
          paymentDistribution: chData.paymentDistribution || [],
        })
      }
      if (actData) {
        setActivity({
          recentOrders: actData.recentOrders || [],
          newCustomers: actData.newCustomers || [],
          newSellers: actData.newSellers || [],
          recentReturns: actData.recentReturns || [],
        })
      }
    } catch (err) {
      console.error('Failed to load admin analytics:', err)
      setError(err.response?.data?.message || err.message || 'Failed to load platform analytics data.')
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

  // Custom Chart Tooltips
  const CurrencyTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3.5 py-2.5 shadow-xl text-xs text-[var(--color-text-primary)]">
          <p className="font-bold text-[var(--color-text-secondary)] mb-1 border-b border-[var(--color-border)] pb-1">
            {label}
          </p>
          {payload.map((entry, idx) => (
            <div key={`cur-entry-${idx}`} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || '#0F8F6B' }} />
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

  const GrowthTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3.5 py-2.5 shadow-xl text-xs text-[var(--color-text-primary)]">
          <p className="font-bold text-[var(--color-text-secondary)] mb-1 border-b border-[var(--color-border)] pb-1">
            {label}
          </p>
          <div className="flex items-center justify-between gap-4 pt-0.5">
            <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
              New Users:
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

  return (
    <div className="flex flex-col gap-6 sm:gap-7 pb-6 max-w-[1440px] mx-auto w-full">
      {/* ── Page Header & Quick Controls (Matches Customer Analytics) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-1 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)] flex items-center gap-2.5">
            <span>Admin Platform Analytics</span>
            {refreshing && <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
            Platform-wide commerce intelligence, revenue tracking, customer growth, and merchant performance.
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
            {/* Metric 1: Platform GMV / Total Revenue */}
            <CustomerMetricCard
              title="Platform GMV"
              value={formatCurrency(overview.totalOrderValue)}
              icon={DollarSign}
              color="emerald"
            />

            {/* Metric 2: Total Orders */}
            <CustomerMetricCard
              title="Total Orders"
              value={overview.totalOrders.toLocaleString()}
              icon={ShoppingBag}
              color="blue"
            />

            {/* Metric 3: Total Customers */}
            <CustomerMetricCard
              title="Total Customers"
              value={overview.totalCustomers.toLocaleString()}
              icon={Users}
              color="purple"
            />

            {/* Metric 4: Total Sellers */}
            <CustomerMetricCard
              title="Active Sellers"
              value={overview.totalSellers.toLocaleString()}
              icon={Store}
              color="amber"
            />

            {/* Metric 5: Active Catalog */}
            <CustomerMetricCard
              title="Active Catalog"
              value={overview.totalProducts.toLocaleString()}
              icon={Package}
              color="violet"
            />

            {/* Metric 6: Delivered Orders */}
            <CustomerMetricCard
              title="Delivered Orders"
              value={overview.deliveredOrders.toLocaleString()}
              icon={PackageCheck}
              color="emerald"
            />

            {/* Metric 7: Pending Orders */}
            <CustomerMetricCard
              title="Pending Orders"
              value={overview.pendingOrders.toLocaleString()}
              icon={Clock}
              color="amber"
            />

            {/* Metric 8: Refund Volume */}
            <CustomerMetricCard
              title="Refund Volume"
              value={formatCurrency(overview.refundAmount)}
              icon={RotateCcw}
              color="rose"
            />
          </div>

          {/* ── 2. Primary Charts Section (Balanced 2-Column Grid) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {/* Chart 1: Platform GMV Over Time */}
            <div className="group relative flex flex-col justify-between rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] p-5 sm:p-6 shadow-xs transition-all duration-200 hover:shadow-md">
              <div className="flex flex-col items-center justify-center text-center mb-4 sm:mb-5">
                <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] flex items-center justify-center gap-2">
                  <TrendingUp className="w-4.5 h-4.5 text-[var(--color-primary)] shrink-0" aria-hidden="true" />
                  <span>Platform Revenue Over Time</span>
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 text-center">
                  Monthly Gross Merchandise Value (GMV) across all sellers
                </p>
              </div>

              <div className="w-full flex-1 flex items-center justify-center" style={{ height: 280 }}>
                {charts.monthlyGmv && charts.monthlyGmv.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={charts.monthlyGmv}
                      margin={{ top: 12, right: 16, left: -16, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="adminGmvGradient" x1="0" y1="0" x2="0" y2="1">
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
                        dataKey="gmv"
                        name="Platform GMV"
                        stroke="#0F8F6B"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#adminGmvGradient)"
                        activeDot={{ r: 5, fill: '#0F8F6B', stroke: isDark ? 'var(--color-surface)' : '#ffffff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-xs text-slate-400 gap-2">
                    <DollarSign className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <span>No platform GMV recorded for this timeframe</span>
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Order Status Distribution (Exact CustomerStatusDonut) */}
            <CustomerStatusDonut
              title="Order Status Distribution"
              subtitle="Platform-wide order lifecycle states"
              data={charts.orderStatusDistribution}
              totalLabel="Orders"
              height={280}
            />
          </div>

          {/* ── 3. Secondary Charts Grid: Customer Growth & Payment Distribution ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {/* Chart 3: Customer Growth Cohort */}
            <div className="group relative flex flex-col justify-between rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] p-5 sm:p-6 shadow-xs transition-all duration-200 hover:shadow-md">
              <div className="flex flex-col items-center justify-center text-center mb-4 sm:mb-5">
                <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] flex items-center justify-center gap-2">
                  <Users className="w-4.5 h-4.5 text-[var(--color-primary)] shrink-0" aria-hidden="true" />
                  <span>Customer Growth</span>
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 text-center">
                  Monthly new registered customer accounts
                </p>
              </div>

              <div className="w-full flex-1 flex items-center justify-center" style={{ height: 260 }}>
                {charts.customerGrowth && charts.customerGrowth.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={charts.customerGrowth}
                      margin={{ top: 12, right: 16, left: -16, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="adminUserGradient" x1="0" y1="0" x2="0" y2="1">
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
                        allowDecimals={false}
                      />
                      <Tooltip content={<GrowthTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="newUsers"
                        name="New Customers"
                        stroke="#0F8F6B"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#adminUserGradient)"
                        activeDot={{ r: 5, fill: '#0F8F6B', stroke: isDark ? 'var(--color-surface)' : '#ffffff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-xs text-slate-400 gap-2">
                    <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <span>No customer registration activity recorded</span>
                  </div>
                )}
              </div>
            </div>

            {/* Chart 4: Payment Method Distribution */}
            <CustomerStatusDonut
              title="Payment Method Breakdown"
              subtitle="Razorpay Online vs Cash on Delivery"
              data={charts.paymentDistribution}
              totalLabel="Payments"
              height={260}
            />
          </div>

          {/* ── 4. Tertiary Charts Grid: Merchant Performance & Purchases vs Returns ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {/* Chart 5: Top Performing Sellers */}
            <div className="group relative flex flex-col justify-between rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] p-5 sm:p-6 shadow-xs transition-all duration-200 hover:shadow-md">
              <div className="flex flex-col items-center justify-center text-center mb-4 sm:mb-5">
                <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] flex items-center justify-center gap-2">
                  <Building2 className="w-4.5 h-4.5 text-[var(--color-primary)] shrink-0" aria-hidden="true" />
                  <span>Top Performing Sellers</span>
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 text-center">
                  Order fulfillment volume by approved merchant
                </p>
              </div>

              <div className="w-full flex-1 flex items-center justify-center" style={{ height: 260 }}>
                {charts.sellerPerformance && charts.sellerPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={charts.sellerPerformance}
                      margin={{ top: 12, right: 16, left: -16, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={isDark ? 'var(--color-border)' : '#D8EBE4'}
                      />
                      <XAxis
                        dataKey="sellerName"
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
                      <Tooltip content={<GrowthTooltip />} />
                      <Bar
                        dataKey="orderCount"
                        name="Orders Fulfilled"
                        fill="#0F8F6B"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={44}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-xs text-slate-400 gap-2">
                    <Store className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <span>No seller activity in this period</span>
                  </div>
                )}
              </div>
            </div>

            {/* Chart 6: Platform Purchases vs Returns */}
            <div className="group relative flex flex-col justify-between rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] p-5 sm:p-6 shadow-xs transition-all duration-200 hover:shadow-md">
              <div className="flex flex-col items-center justify-center text-center mb-4 sm:mb-5">
                <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] flex items-center justify-center gap-2">
                  <Scale className="w-4.5 h-4.5 text-[var(--color-primary)] shrink-0" aria-hidden="true" />
                  <span>Purchases vs Returns</span>
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 text-center">
                  Total purchase amounts compared against return values
                </p>
              </div>

              <div className="w-full flex-1 flex items-center justify-center" style={{ height: 260 }}>
                {charts.purchaseVsReturns && charts.purchaseVsReturns.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={charts.purchaseVsReturns}
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
                      <Tooltip content={<CurrencyTooltip />} />
                      <Bar
                        dataKey="purchaseAmount"
                        name="Purchases"
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
                    <span>No purchase vs return data available</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── 5. Bottom Detail Sections: Top Products & Recent Orders & Returns ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {/* Top Platform Products */}
            <TopProductsList
              title="Top Platform Products"
              subtitle="Marketplace-wide bestsellers by units sold"
              products={charts.productPerformance}
              role="admin"
            />

            {/* Recent Platform Orders */}
            <RecentOrdersTable
              title="Recent Platform Orders"
              subtitle="Latest marketplace-wide order transactions"
              orders={activity.recentOrders}
              role="admin"
              viewAllLink={ROUTES.ADMIN_ORDERS}
            />
          </div>

          {/* ── 6. Recent Platform Returns & Disputes ── */}
          <div>
            <RecentReturnsTable
              title="Recent Platform Returns"
              subtitle="Latest return requests and refund resolutions"
              returns={activity.recentReturns}
              viewAllLink={ROUTES.ADMIN_REPORTS}
            />
          </div>
        </div>
      )}
    </div>
  )
}

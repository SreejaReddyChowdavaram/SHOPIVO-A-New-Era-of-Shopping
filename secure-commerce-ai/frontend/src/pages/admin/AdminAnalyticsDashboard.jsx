import React, { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Store,
  Package,
  ShoppingBag,
  PackageCheck,
  Clock,
  XCircle,
  RotateCcw,
  DollarSign,
  AlertCircle,
  Loader2,
  RefreshCw,
  UserCheck,
} from 'lucide-react'
import AnalyticsDateFilter from '@/components/analytics/AnalyticsDateFilter'
import AnalyticsSummaryCard from '@/components/analytics/AnalyticsSummaryCard'
import AnalyticsSecondaryStat from '@/components/analytics/AnalyticsSecondaryStat'
import AnalyticsLineChart from '@/components/analytics/AnalyticsLineChart'
import AnalyticsDonutChart from '@/components/analytics/AnalyticsDonutChart'
import AnalyticsBarChart from '@/components/analytics/AnalyticsBarChart'
import RecentOrdersTable from '@/components/analytics/RecentOrdersTable'
import RecentReturnsTable from '@/components/analytics/RecentReturnsTable'
import {
  getAdminOverview,
  getAdminCharts,
  getAdminRecentActivity,
} from '@/services/analyticsService'
import { ROUTES } from '@/constants/routes'

export default function AdminAnalyticsDashboard() {
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

  const [recentActivity, setRecentActivity] = useState({
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
      if (chData) setCharts(chData)
      if (actData) setRecentActivity(actData)
    } catch (err) {
      console.error('Failed to load admin platform analytics:', err)
      setError(err.response?.data?.message || err.message || 'Failed to aggregate platform analytics.')
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
            <span>Admin Analytics</span>
            {refreshing && <Loader2 className="w-4 h-4 animate-spin text-[#04DB7E]" />}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Global marketplace GMV, customer &amp; merchant cohorts, order fulfillment lifecycle, and catalog velocity.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-[#DFE9E2] dark:border-[#242424] bg-white dark:bg-[#101010] text-slate-700 dark:text-slate-200 hover:bg-[#F5F8F5] dark:hover:bg-[#1C1C1C] transition-colors shadow-xs cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#04DB7E]' : ''}`} />
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
          <Loader2 className="w-8 h-8 animate-spin text-[#04DB7E]" />
          <p className="text-xs font-medium text-slate-500">Aggregating platform intelligence across multi-tenant database...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 sm:gap-7">
          {/* ── 1. Top Section: 4 Primary Summary Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
            <AnalyticsSummaryCard
              title="Platform GMV"
              value={formatCurrency(overview.totalOrderValue)}
              subLabel="Total Platform Spend"
              subValue={overview.dateRangeLabel}
              icon={DollarSign}
              gradientColor="blue"
            />

            <AnalyticsSummaryCard
              title="Total Orders"
              value={overview.totalOrders.toLocaleString()}
              subLabel="Delivered Fulfillments"
              subValue={`${overview.deliveredOrders} Delivered`}
              icon={ShoppingBag}
              gradientColor="emerald"
            />

            <AnalyticsSummaryCard
              title="Registered Customers"
              value={overview.totalCustomers.toLocaleString()}
              subLabel="Active Merchants"
              subValue={`${overview.totalSellers} Onboarded`}
              icon={Users}
              gradientColor="amber"
            />

            <AnalyticsSummaryCard
              title="Catalog Listings"
              value={overview.totalProducts.toLocaleString()}
              subLabel="Total Refunded"
              subValue={formatCurrency(overview.refundAmount)}
              icon={Package}
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
              subText="Successfully delivered"
            />

            <AnalyticsSecondaryStat
              title="Pending"
              value={overview.pendingOrders.toLocaleString()}
              icon={Clock}
              color="amber"
              subText="Active in transit"
            />

            <AnalyticsSecondaryStat
              title="Cancelled"
              value={overview.cancelledOrders.toLocaleString()}
              icon={XCircle}
              color="rose"
              subText="Order cancellations"
            />

            <AnalyticsSecondaryStat
              title="Returns"
              value={overview.returnedOrders.toLocaleString()}
              icon={RotateCcw}
              color="pink"
              subText="Customer return requests"
            />

            <AnalyticsSecondaryStat
              title="Sellers"
              value={overview.totalSellers.toLocaleString()}
              icon={Store}
              color="blue"
              subText="Registered vendors"
            />

            <AnalyticsSecondaryStat
              title="Refunds"
              value={formatCurrency(overview.refundAmount)}
              icon={DollarSign}
              color="slate"
              subText="Processed returns"
            />
          </div>

          {/* ── 3. Middle Section: Charts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Chart 1: Monthly GMV vs Net Revenue */}
            <div className="lg:col-span-2">
              <AnalyticsLineChart
                title="Gross Merchandise Value (GMV) vs Net Revenue"
                subtitle="Monthly platform transaction value with refund deductions"
                data={charts.monthlyGmv}
                series={[
                  { key: 'gmv', name: 'Gross Merchandise Value (₹)', color: '#04DB7E' },
                  { key: 'netRevenue', name: 'Net Revenue (₹)', color: '#00C77A' }
                ]}
                isCurrency={true}
                height={320}
                type="area"
              />
            </div>

            {/* Chart 2: Order Status Distribution */}
            <div>
              <AnalyticsDonutChart
                title="Platform Order Status"
                subtitle="Global fulfillment pipeline breakdown"
                data={charts.orderStatusDistribution}
                totalLabel="Orders"
                height={320}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 3: Order Trends */}
            <AnalyticsLineChart
              title="Platform Order Trends"
              subtitle="Completed deliveries vs cancelled orders"
              data={charts.platformOrderTrends}
              series={[
                { key: 'totalOrders', name: 'Total Placed', color: '#04DB7E' },
                { key: 'completedOrders', name: 'Delivered', color: '#00C77A' },
                { key: 'cancelledOrders', name: 'Cancelled', color: '#ef4444' },
              ]}
              height={320}
              type="line"
            />

            {/* Chart 4: Customer Growth */}
            <AnalyticsLineChart
              title="User Cohort Growth"
              subtitle="New customer accounts and verified seller onboarding"
              data={charts.customerGrowth}
              series={[
                { key: 'newCustomers', name: 'New Customers', color: '#04DB7E' },
                { key: 'newSellers', name: 'New Sellers', color: '#f59e0b' },
              ]}
              height={320}
              type="area"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 5: Seller Performance */}
            <AnalyticsBarChart
              title="Top Performing Sellers"
              subtitle="Ranked by total gross merchandise sales (₹)"
              data={charts.sellerPerformance}
              series={[
                { key: 'grossSales', name: 'Gross Sales (₹)', color: '#04DB7E' }
              ]}
              layout="vertical"
              xKey="sellerName"
              isCurrency={true}
              height={320}
            />

            {/* Chart 6: Product Performance */}
            <AnalyticsBarChart
              title="Platform Top Products"
              subtitle="Ranked by total unit volume sold"
              data={charts.productPerformance}
              series={[
                { key: 'unitsSold', name: 'Units Sold', color: '#00C77A' }
              ]}
              layout="vertical"
              xKey="productName"
              height={320}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <AnalyticsBarChart
                title="Purchases vs. Return Requests"
                subtitle="Orders placed compared against return and refund frequency"
                data={charts.purchaseVsReturns}
                series={[
                  { key: 'ordersPlaced', name: 'Orders Placed', color: '#04DB7E' },
                  { key: 'ordersReturned', name: 'Orders Returned', color: '#f87171' },
                ]}
                xKey="month"
                height={320}
              />
            </div>

            <div>
              <AnalyticsDonutChart
                title="Payment Method Breakdown"
                subtitle="Distribution across payment rails"
                data={charts.paymentDistribution}
                totalLabel="Transactions"
                height={320}
              />
            </div>
          </div>

          {/* ── 4. Bottom Section: Recent Activity & Onboarding ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <RecentOrdersTable
              title="Recent Platform Orders"
              subtitle="Latest orders across all merchants"
              orders={recentActivity.recentOrders}
              role="admin"
              viewAllLink={ROUTES.ADMIN_ORDERS}
            />

            <RecentReturnsTable
              title="Recent Return Requests"
              subtitle="Customer return requests awaiting resolution"
              returns={recentActivity.recentReturns}
              role="admin"
              viewAllLink={ROUTES.ADMIN_RETURNS || ROUTES.ADMIN_ORDERS}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* New Customers List */}
            <div className="rounded-2xl bg-white dark:bg-[#101010] border border-[#DFE9E2] dark:border-[#242424] p-5.5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Newly Registered Customers
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Most recent user sign-ups
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-[#087847] dark:text-[#04DB7E] bg-[#E5FFF2] dark:bg-[#09291B] border border-[#04DB7E]/40 dark:border-[#04DB7E]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Customers</span>
                </span>
              </div>
              <div className="divide-y divide-[#DFE9E2] dark:divide-[#242424] text-xs">
                {recentActivity.newCustomers && recentActivity.newCustomers.length > 0 ? (
                  recentActivity.newCustomers.map((cust) => (
                    <div key={`cust-${cust.id}`} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {cust.name || 'Anonymous Customer'}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          {cust.email}
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                        {cust.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-8 text-center text-slate-400 text-xs">
                    No recent customer registrations
                  </p>
                )}
              </div>
            </div>

            {/* New Sellers List */}
            <div className="rounded-2xl bg-white dark:bg-[#101010] border border-[#DFE9E2] dark:border-[#242424] p-5.5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Newly Onboarded Sellers
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Most recent merchant registrations
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Store className="w-3.5 h-3.5" />
                  <span>Vendors</span>
                </span>
              </div>
              <div className="divide-y divide-[#DFE9E2] dark:divide-[#242424] text-xs">
                {recentActivity.newSellers && recentActivity.newSellers.length > 0 ? (
                  recentActivity.newSellers.map((seller) => (
                    <div key={`seller-${seller.id}`} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {seller.name || 'Merchant'}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          {seller.email}
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#E5FFF2] text-[#087847] dark:bg-[#09291B] dark:text-[#04DB7E] border border-[#04DB7E]/40 dark:border-[#04DB7E]/30">
                        {seller.enabled ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-8 text-center text-slate-400 text-xs">
                    No recent seller registrations
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

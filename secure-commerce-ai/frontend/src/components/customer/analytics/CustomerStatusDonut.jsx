import React from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts'
import { PieChart as PieIcon, CheckCircle2 } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

const STATUS_COLORS = {
  Delivered: '#10b981',
  Pending: '#f59e0b',
  Confirmed: '#3b82f6',
  Processing: '#6366f1',
  Shipped: '#0ea5e9',
  Cancelled: '#ef4444',
  Returned: '#ec4899',
}

export default function CustomerStatusDonut({
  title = 'Order Status Distribution',
  subtitle = 'Delivered / Pending / Shipped / Cancelled / Returned',
  data = [],
  height = 280,
  innerRadius = 62,
  outerRadius = 88,
  totalLabel = 'Orders',
  className = '',
}) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const totalCount = data.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0)

  // Non-zero segments for rendering the pie arcs
  const activeSegments = data.filter((item) => Number(item.count) > 0)
  // Legend items: display only categories with actual activity (count > 0)
  const visibleLegendItems = activeSegments.length > 0 ? activeSegments : []

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      const itemColor = item.color || STATUS_COLORS[item.status] || '#10b981'

      return (
        <div className="bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-[#1e293b] rounded-xl px-3.5 py-2.5 shadow-xl text-xs text-slate-900 dark:text-white">
          <div className="flex items-center gap-2 mb-1.5 border-b border-slate-100 dark:border-[#1e293b] pb-1">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: itemColor }} />
            <span className="font-bold text-slate-900 dark:text-white">{item.status || item.name}</span>
          </div>
          <div className="flex items-center justify-between gap-5 text-slate-600 dark:text-slate-300">
            <span>Orders:</span>
            <span className="font-extrabold text-slate-900 dark:text-white">{Number(item.count).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-5 text-slate-600 dark:text-slate-300">
            <span>Share:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{item.percentage || 0}%</span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-[#101726] border-2 border-emerald-500/70 dark:border-emerald-500/60 hover:border-emerald-500 dark:hover:border-emerald-400 p-5 sm:p-6 shadow-xs transition-all duration-200 hover:shadow-md ${className}`}
    >
      {/* Centered Header */}
      <div className="flex flex-col items-center justify-center text-center mb-3 sm:mb-4">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
          <PieIcon className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
          <span>{title}</span>
        </h3>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
            {subtitle}
          </p>
        )}
      </div>

      {/* Donut Canvas with Center KPI */}
      <div className="relative my-auto w-full flex items-center justify-center bg-transparent" style={{ height: height - 80 }}>
        {data && data.length > 0 && totalCount > 0 && activeSegments.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none' }} />
                <Pie
                  data={activeSegments}
                  cx="50%"
                  cy="50%"
                  innerRadius={innerRadius}
                  outerRadius={outerRadius}
                  paddingAngle={3}
                  dataKey="count"
                  stroke={isDark ? '#101726' : '#ffffff'}
                  strokeWidth={2}
                >
                  {activeSegments.map((entry, index) => {
                    const color = entry.color || STATUS_COLORS[entry.status] || '#10b981'
                    return <Cell key={`donut-cell-${index}`} fill={color} />
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Central Metric Indicator */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                {totalCount.toLocaleString()}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mt-1">
                {totalLabel}
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-xs text-slate-400 gap-2">
            <CheckCircle2 className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            <span>No order status activity in this timeframe</span>
          </div>
        )}
      </div>

      {/* Status Legend Strip: Neat, balanced arrangement below donut */}
      {visibleLegendItems && visibleLegendItems.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-3 border-t border-slate-100 dark:border-[#1e293b] w-full">
          {visibleLegendItems.map((item, idx) => {
            const color = item.color || STATUS_COLORS[item.status] || '#10b981'
            const count = Number(item.count || 0)
            return (
              <div
                key={`legend-${idx}`}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-[#0b1120]/60 border border-slate-200/50 dark:border-slate-800/60 text-xs"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  {item.status || item.name}:
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {count.toLocaleString()}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                  ({item.percentage || 0}%)
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

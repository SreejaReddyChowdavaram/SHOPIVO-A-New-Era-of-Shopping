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
  Delivered: '#0F8F6B',
  Pending: '#D99A35',
  Confirmed: '#0F8F6B',
  Processing: '#0B7A5B',
  Shipped: '#0B7A5B',
  Cancelled: '#DC5555',
  Returned: '#A7BDB4',
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
      const itemColor = item.color || STATUS_COLORS[item.status] || '#0F8F6B'

      return (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3.5 py-2.5 shadow-xl text-xs text-[var(--color-text-primary)]">
          <div className="flex items-center gap-2 mb-1.5 border-b border-[var(--color-border)] pb-1">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: itemColor }} />
            <span className="font-bold text-[var(--color-text-primary)]">{item.status || item.name}</span>
          </div>
          <div className="flex items-center justify-between gap-5 text-[var(--color-text-secondary)]">
            <span>Orders:</span>
            <span className="font-extrabold text-[var(--color-text-primary)]">{Number(item.count).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-5 text-[var(--color-text-secondary)]">
            <span>Share:</span>
            <span className="font-semibold text-[var(--color-primary)]">{item.percentage || 0}%</span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] p-5 sm:p-6 shadow-xs transition-all duration-200 hover:shadow-md ${className}`}
    >
      {/* Centered Header */}
      <div className="flex flex-col items-center justify-center text-center mb-3 sm:mb-4">
        <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] flex items-center justify-center gap-2">
          <PieIcon className="w-4.5 h-4.5 text-[var(--color-primary)] shrink-0" aria-hidden="true" />
          <span>{title}</span>
        </h3>
        {subtitle && (
          <p className="text-xs text-[var(--color-text-secondary)] mt-1 text-center">
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
                  stroke={isDark ? 'var(--color-surface)' : '#ffffff'}
                  strokeWidth={2}
                >
                  {activeSegments.map((entry, index) => {
                    const color = entry.color || STATUS_COLORS[entry.status] || '#0F8F6B'
                    return <Cell key={`donut-cell-${index}`} fill={color} />
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Central Metric Indicator */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight leading-none">
                {totalCount.toLocaleString()}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-text-muted)] mt-1">
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
        <div className="flex flex-wrap items-center justify-center gap-2 pt-3 border-t border-[var(--color-border)] w-full">
          {visibleLegendItems.map((item, idx) => {
            const color = item.color || STATUS_COLORS[item.status] || '#0F8F6B'
            const count = Number(item.count || 0)
            return (
              <div
                key={`legend-${idx}`}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-xs"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                <span className="text-[var(--color-text-secondary)] font-medium">
                  {item.status || item.name}:
                </span>
                <span className="font-bold text-[var(--color-text-primary)]">
                  {count.toLocaleString()}
                </span>
                <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">
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

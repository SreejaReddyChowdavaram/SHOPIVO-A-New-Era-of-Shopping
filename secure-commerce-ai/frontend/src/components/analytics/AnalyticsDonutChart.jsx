import React from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts'
import { PieChart as PieIcon } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

const FALLBACK_COLORS = {
  Delivered: '#10b981',
  Pending: '#f59e0b',
  Confirmed: '#3b82f6',
  Processing: '#6366f1',
  Shipped: '#06b6d4',
  Cancelled: '#ef4444',
  Returned: '#ec4899',
}

export default function AnalyticsDonutChart({
  title,
  subtitle,
  data = [],
  height = 320,
  innerRadius = 60,
  outerRadius = 88,
  totalLabel = 'Orders',
  className = '',
}) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const totalCount = data.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0)

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      const itemColor = item.color || FALLBACK_COLORS[item.status] || '#3b82f6'

      return (
        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#25334A] rounded-xl px-3.5 py-2.5 shadow-xl text-xs text-slate-900 dark:text-white">
          <div className="flex items-center gap-2 mb-1.5 border-b border-slate-100 dark:border-[#25334A] pb-1">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: itemColor }} />
            <span className="font-bold text-slate-900 dark:text-white">{item.status || item.method || item.name}</span>
          </div>
          <div className="flex items-center justify-between gap-5 text-slate-600 dark:text-slate-300">
            <span>Orders:</span>
            <span className="font-extrabold text-slate-900 dark:text-white">{Number(item.count).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-5 text-slate-600 dark:text-slate-300">
            <span>Share:</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">{item.percentage || item.share || 0}%</span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className={`rounded-2xl bg-white dark:bg-[#111C30] border border-slate-200/90 dark:border-[#25334A] p-5 sm:p-6 shadow-xs flex flex-col justify-between ${className}`}>
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            {title}
          </h4>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
            {totalCount.toLocaleString()} {totalLabel}
          </span>
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Donut Canvas with Center KPI */}
      <div className="relative my-2 w-full flex items-center justify-center bg-transparent" style={{ height: height - 100 }}>
        {data && data.length > 0 && totalCount > 0 ? (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart style={{ backgroundColor: 'transparent' }}>
                <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none' }} />
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={innerRadius}
                  outerRadius={outerRadius}
                  paddingAngle={3}
                  dataKey="count"
                  stroke={isDark ? '#111C30' : '#FFFFFF'}
                  strokeWidth={2}
                >
                  {data.map((entry, index) => {
                    const color = entry.color || FALLBACK_COLORS[entry.status] || '#3b82f6'
                    return <Cell key={`cell-${index}`} fill={color} />
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
            <PieIcon className="w-6 h-6 text-slate-400/60" />
            <span>No order status data available</span>
          </div>
        )}
      </div>

      {/* Refined Bottom Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-100 dark:border-[#25334A]/80">
        {data.map((item, idx) => {
          const color = item.color || FALLBACK_COLORS[item.status] || '#3b82f6'
          return (
            <div key={`legend-${idx}`} className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {Number(item.count).toLocaleString()}{' '}
                  <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
                    ({item.percentage || 0}%)
                  </span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {item.status || item.method || item.name}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

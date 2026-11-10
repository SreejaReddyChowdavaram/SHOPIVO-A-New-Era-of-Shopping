import React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { TrendingUp, ShoppingBag } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

export default function CustomerTrendChart({
  title = 'Purchase Activity Trend',
  subtitle = 'Monthly orders placed over time',
  data = [],
  height = 280,
  className = '',
}) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const entry = payload[0]
      return (
        <div className="bg-white dark:bg-[#101010] border border-[#DFE9E2] dark:border-[#242424] rounded-xl px-3.5 py-2.5 shadow-xl text-xs text-slate-900 dark:text-white">
          <p className="font-bold text-slate-600 dark:text-slate-300 mb-1 border-b border-[#DFE9E2] dark:border-[#242424] pb-1">
            {label}
          </p>
          <div className="flex items-center justify-between gap-4 pt-0.5">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-[#04DB7E] dark:bg-[#04DB7E]" />
              Orders Placed:
            </span>
            <span className="font-extrabold text-[#087847] dark:text-[#04DB7E]">
              {Number(entry.value).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-[#101010] border border-[#DFE9E2] dark:border-[#242424] hover:border-[#04DB7E]/60 p-5 sm:p-6 shadow-xs transition-all duration-200 hover:shadow-md ${className}`}
    >
      {/* Centered Chart Header */}
      <div className="flex flex-col items-center justify-center text-center mb-4 sm:mb-5">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
          <TrendingUp className="w-4.5 h-4.5 text-[#087847] dark:text-[#04DB7E] shrink-0" aria-hidden="true" />
          <span>{title}</span>
        </h3>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
            {subtitle}
          </p>
        )}
      </div>

      {/* Centered Chart Body */}
      <div className="w-full flex-1 flex items-center justify-center" style={{ height }}>
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 12, right: 16, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="customerTrendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#04DB7E" stopOpacity={isDark ? 0.45 : 0.25} />
                  <stop offset="95%" stopColor="#04DB7E" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={isDark ? '#242424' : '#EBF2ED'}
              />

              <XAxis
                dataKey="label"
                stroke={isDark ? '#808080' : '#8C9992'}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={6}
              />

              <YAxis
                stroke={isDark ? '#808080' : '#8C9992'}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="orderCount"
                name="Orders Placed"
                stroke="#04DB7E"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#customerTrendGradient)"
                activeDot={{ r: 5, fill: '#04DB7E', stroke: isDark ? '#101010' : '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-xs text-slate-400 gap-2">
            <ShoppingBag className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            <span>No order activity recorded for this period</span>
          </div>
        )}
      </div>
    </div>
  )
}

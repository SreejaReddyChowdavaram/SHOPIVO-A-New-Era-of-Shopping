import React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Activity } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

export default function AnalyticsLineChart({
  title,
  subtitle,
  data = [],
  series = [
    { key: 'value', name: 'Value', color: '#3b82f6' }
  ],
  isCurrency = false,
  height = 320,
  type = 'area', // 'area' | 'line'
  className = '',
}) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const formatYAxis = (val) => {
    if (isCurrency) {
      if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`
      if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`
      if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`
      return `₹${val}`
    }
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`
    return val
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#25334A] rounded-xl px-3.5 py-2.5 shadow-xl text-xs text-slate-900 dark:text-white">
          <p className="font-bold text-slate-600 dark:text-slate-300 mb-1.5 border-b border-slate-100 dark:border-[#25334A] pb-1">
            {label}
          </p>
          <div className="space-y-1 pt-0.5">
            {payload.map((entry, idx) => (
              <div key={`tt-${idx}`} className="flex items-center justify-between gap-5">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                  {entry.name}:
                </span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {isCurrency || (entry.dataKey && (
                    entry.dataKey.toLowerCase().includes('amount') ||
                    entry.dataKey.toLowerCase().includes('sales') ||
                    entry.dataKey.toLowerCase().includes('spent') ||
                    entry.dataKey.toLowerCase().includes('gmv') ||
                    entry.dataKey.toLowerCase().includes('revenue')
                  ))
                    ? `₹${Number(entry.value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : Number(entry.value).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className={`rounded-2xl bg-white dark:bg-[#111C30] border border-slate-200/90 dark:border-[#25334A] p-5 sm:p-6 shadow-xs flex flex-col justify-between ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            {title}
          </h4>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full bg-transparent" style={{ height }}>
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {type === 'area' ? (
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                style={{ backgroundColor: 'transparent' }}
              >
                <defs>
                  {series.map((s, idx) => (
                    <linearGradient key={`grad-${idx}`} id={`color-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={s.color} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={s.color} stopOpacity={0.0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  horizontal={true}
                  stroke={isDark ? '#25334A' : '#E2E8F0'}
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  stroke="none"
                  tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={formatYAxis}
                  tickLine={false}
                  axisLine={false}
                  stroke="none"
                  tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: isDark ? '#3B82F6' : '#2563eb', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                  wrapperStyle={{ outline: 'none' }}
                />
                {series.length > 1 && (
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 11, paddingBottom: 10 }} />
                )}
                {series.map((s) => (
                  <Area
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.name}
                    stroke={s.color}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill={`url(#color-${s.key})`}
                    dot={{ r: 3.5, fill: s.color, strokeWidth: 1.5, stroke: isDark ? '#111C30' : '#FFFFFF' }}
                    activeDot={{ r: 5.5, strokeWidth: 2, stroke: isDark ? '#111C30' : '#FFFFFF' }}
                  />
                ))}
              </AreaChart>
            ) : (
              <LineChart
                data={data}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                style={{ backgroundColor: 'transparent' }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  horizontal={true}
                  stroke={isDark ? '#25334A' : '#E2E8F0'}
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  stroke="none"
                  tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={formatYAxis}
                  tickLine={false}
                  axisLine={false}
                  stroke="none"
                  tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: isDark ? '#3B82F6' : '#2563eb', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                  wrapperStyle={{ outline: 'none' }}
                />
                {series.length > 1 && (
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 11, paddingBottom: 10 }} />
                )}
                {series.map((s) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.name}
                    stroke={s.color}
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: s.color, strokeWidth: 1.5, stroke: isDark ? '#111C30' : '#FFFFFF' }}
                    activeDot={{ r: 5.5, strokeWidth: 2, stroke: isDark ? '#111C30' : '#FFFFFF' }}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-xs text-slate-400 gap-2">
            <Activity className="w-6 h-6 text-slate-400/60" />
            <span>No activity data available for this timeframe</span>
          </div>
        )}
      </div>
    </div>
  )
}

import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { BarChart3 } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

export default function AnalyticsBarChart({
  title,
  subtitle,
  data = [],
  series = [
    { key: 'value', name: 'Value', color: '#0F8F6B' }
  ],
  isCurrency = false,
  height = 320,
  layout = 'horizontal', // 'horizontal' (vertical bars) | 'vertical' (horizontal bars)
  xKey = 'month',
  className = '',
}) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const formatValue = (val) => {
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
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3.5 py-2.5 shadow-xl text-xs text-[var(--color-text-primary)]">
          <p className="font-bold text-[var(--color-text-secondary)] mb-1.5 border-b border-[var(--color-border)] pb-1">
            {label}
          </p>
          <div className="space-y-1 pt-0.5">
            {payload.map((entry, idx) => {
              const isMoney = isCurrency || (entry.dataKey && (
                entry.dataKey.toLowerCase().includes('amount') ||
                entry.dataKey.toLowerCase().includes('sales') ||
                entry.dataKey.toLowerCase().includes('spent') ||
                entry.dataKey.toLowerCase().includes('gross') ||
                entry.dataKey.toLowerCase().includes('value') ||
                entry.dataKey.toLowerCase().includes('refund')
              ))

              return (
                <div key={`tt-${idx}`} className="flex items-center justify-between gap-5">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    {entry.name}:
                  </span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {isMoney
                      ? `₹${Number(entry.value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : Number(entry.value).toLocaleString('en-IN')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )
    }
    return null
  }

  const isHorizontalLayout = layout === 'vertical' // in recharts layout="vertical" produces horizontal bars

  return (
    <div className={`rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 sm:p-6 shadow-xs flex flex-col justify-between ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div>
          <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
            {title}
          </h4>
          {subtitle && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full bg-transparent" style={{ height }}>
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout={isHorizontalLayout ? 'vertical' : 'horizontal'}
              margin={{ top: 10, right: 15, left: isHorizontalLayout ? 35 : -10, bottom: 0 }}
              style={{ backgroundColor: 'transparent' }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={isHorizontalLayout}
                horizontal={!isHorizontalLayout}
                stroke={isDark ? 'var(--color-border)' : '#D8EBE4'}
              />
              {isHorizontalLayout ? (
                <>
                  <XAxis
                    type="number"
                    tickFormatter={formatValue}
                    tickLine={false}
                    axisLine={false}
                    stroke="none"
                    tick={{ fill: isDark ? 'var(--color-text-secondary)' : '#667B72', fontSize: 11 }}
                  />
                  <YAxis
                    dataKey={xKey}
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    stroke="none"
                    tick={{ fill: isDark ? 'var(--color-text-secondary)' : '#667B72', fontSize: 11 }}
                  />
                </>
              ) : (
                <>
                  <XAxis
                    dataKey={xKey}
                    tickLine={false}
                    axisLine={false}
                    stroke="none"
                    tick={{ fill: isDark ? 'var(--color-text-secondary)' : '#667B72', fontSize: 11 }}
                  />
                  <YAxis
                    tickFormatter={formatValue}
                    tickLine={false}
                    axisLine={false}
                    stroke="none"
                    tick={{ fill: isDark ? 'var(--color-text-secondary)' : '#667B72', fontSize: 11 }}
                  />
                </>
              )}
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)', radius: 4 }}
                wrapperStyle={{ outline: 'none' }}
              />
              {series.length > 1 && (
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, paddingBottom: 10 }}
                />
              )}
              {series.map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.name}
                  fill={s.color}
                  radius={isHorizontalLayout ? [0, 5, 5, 0] : [5, 5, 0, 0]}
                  barSize={isHorizontalLayout ? 16 : series.length > 1 ? 16 : 28}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-xs text-slate-400 gap-2">
            <BarChart3 className="w-6 h-6 text-slate-400/60" />
            <span>No spending metrics available for this period</span>
          </div>
        )}
      </div>
    </div>
  )
}

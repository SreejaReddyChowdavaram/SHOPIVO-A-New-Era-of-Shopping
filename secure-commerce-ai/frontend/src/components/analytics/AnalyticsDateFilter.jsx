import React, { useState } from 'react'
import { Calendar, Check, SlidersHorizontal } from 'lucide-react'

const PRESET_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' },
]

export default function AnalyticsDateFilter({ currentRange, onRangeChange, currentLabel }) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleSelect = (val) => {
    onRangeChange(val)
  }

  const handleCustomApply = (e) => {
    e.preventDefault()
    if (!startDate || !endDate) return
    onRangeChange('custom', startDate, endDate)
  }

  return (
    <div className="bg-white dark:bg-[#111C30] border border-slate-200/90 dark:border-[#25334A] rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Timeframe Title & Active Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Date Filter
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                {currentLabel || 'All Time'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Select a timeframe to aggregate orders, spending, and metrics
            </p>
          </div>
        </div>

        {/* Right: Segmented Filter Buttons */}
        <div className="flex items-center flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100/90 dark:bg-[#0B1120] border border-slate-200/80 dark:border-[#25334A]">
          {PRESET_OPTIONS.map((opt) => {
            const isActive = currentRange === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                type="button"
                className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-150 cursor-pointer font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs shadow-blue-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800/70'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {currentRange === 'custom' && (
        <form
          onSubmit={handleCustomApply}
          className="mt-4 pt-4 border-t border-slate-100 dark:border-[#25334A]/80 flex flex-wrap items-center gap-3 animate-fadeIn"
        >
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
            <span>Select Range:</span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Range</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

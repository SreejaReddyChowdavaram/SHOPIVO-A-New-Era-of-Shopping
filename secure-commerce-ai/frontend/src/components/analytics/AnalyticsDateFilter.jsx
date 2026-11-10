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
    <div className="bg-white dark:bg-[#101010] border border-[#DFE9E2] dark:border-[#242424] rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Timeframe Title & Active Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E5FFF2] dark:bg-[#09291B] text-[#087847] dark:text-[#04DB7E] flex items-center justify-center border border-[#04DB7E]/30 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Date Filter
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E5FFF2] dark:bg-[#09291B] text-[#087847] dark:text-[#04DB7E] border border-[#04DB7E]/40 dark:border-[#04DB7E]/30">
                {currentLabel || 'All Time'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Select a timeframe to aggregate orders, spending, and metrics
            </p>
          </div>
        </div>

        {/* Right: Segmented Filter Buttons */}
        <div className="flex items-center flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100/90 dark:bg-[#080808] border border-[#DFE9E2] dark:border-[#242424]">
          {PRESET_OPTIONS.map((opt) => {
            const isActive = currentRange === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                type="button"
                className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-150 cursor-pointer font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-[#04DB7E] text-[#050505] font-bold shadow-xs shadow-[#04DB7E]/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#1C1C1C]'
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
          className="mt-4 pt-4 border-t border-[#DFE9E2] dark:border-[#242424] flex flex-wrap items-center gap-3 animate-fadeIn"
        >
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#04DB7E]" />
            <span>Select Range:</span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-[#DFE9E2] dark:border-[#242424] bg-slate-50 dark:bg-[#171717] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#04DB7E]"
              required
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-[#DFE9E2] dark:border-[#242424] bg-slate-50 dark:bg-[#171717] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#04DB7E]"
              required
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#04DB7E] text-[#050505] hover:bg-[#00C77A] transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
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

import React, { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown, Check, SlidersHorizontal } from 'lucide-react'

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

export default function CustomerDateFilter({ currentRange, onRangeChange, currentLabel }) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCustomInputs, setShowCustomInputs] = useState(currentRange === 'custom')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const dropdownRef = useRef(null)

  // Sync custom input visibility when currentRange changes
  useEffect(() => {
    if (currentRange === 'custom') {
      setShowCustomInputs(true)
    }
  }, [currentRange])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleSelectPreset = (val) => {
    if (val === 'custom') {
      setShowCustomInputs(true)
      return
    }
    setShowCustomInputs(false)
    onRangeChange(val)
    setIsOpen(false)
  }

  const handleCustomApply = (e) => {
    e.preventDefault()
    if (!startDate || !endDate) return
    onRangeChange('custom', startDate, endDate)
    setIsOpen(false)
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button: [Calendar Icon] [Period: All Time ▼] */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-[#DFE9E2] dark:border-[#242424] bg-white dark:bg-[#101010] text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-[#1C1C1C] transition-colors shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#04DB7E]/30"
      >
        <Calendar className="w-4 h-4 text-[#087847] dark:text-[#04DB7E] shrink-0" />
        <span className="text-slate-500 dark:text-slate-400 font-normal hidden min-[400px]:inline">
          Period:
        </span>
        <span className="font-bold text-slate-900 dark:text-white max-w-[140px] truncate">
          {currentLabel || 'All Time'}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#087847] dark:text-[#04DB7E]' : ''
          }`}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-64 sm:w-72 rounded-2xl bg-white dark:bg-[#101010] border border-[#DFE9E2] dark:border-[#242424] shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-2.5 py-1.5 mb-1 border-b border-slate-100 dark:border-[#242424]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Select Timeframe
            </span>
          </div>

          <div className="space-y-0.5 max-h-[280px] overflow-y-auto">
            {PRESET_OPTIONS.map((opt) => {
              const isActive = currentRange === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="menuitem"
                  onClick={() => handleSelectPreset(opt.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#E5FFF2] dark:bg-[#09291B] text-[#087847] dark:text-[#04DB7E] font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-[#F0FDF4] dark:hover:bg-[#1C1C1C]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isActive && <Check className="w-4 h-4 text-[#087847] dark:text-[#04DB7E] shrink-0" />}
                </button>
              )
            })}
          </div>

          {/* Expandable Custom Date Range Inputs */}
          {showCustomInputs && (
            <form
              onSubmit={handleCustomApply}
              className="mt-2 pt-2 border-t border-[#DFE9E2] dark:border-[#242424] px-1 space-y-2 animate-fadeIn"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <SlidersHorizontal className="w-3 h-3 text-[#04DB7E]" />
                <span>Custom Range</span>
              </div>

              <div className="space-y-1.5">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#DFE9E2] dark:border-[#242424] bg-slate-50 dark:bg-[#171717] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#04DB7E]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#DFE9E2] dark:border-[#242424] bg-slate-50 dark:bg-[#171717] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#04DB7E]"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-1.5 text-xs font-semibold rounded-lg bg-[#04DB7E] text-[#050505] hover:bg-[#00C77A] transition-colors shadow-xs cursor-pointer"
              >
                Apply Range
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

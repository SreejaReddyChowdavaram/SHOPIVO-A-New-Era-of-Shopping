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
        className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
      >
        <Calendar className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
        <span className="text-[var(--color-text-secondary)] font-normal hidden min-[400px]:inline">
          Period:
        </span>
        <span className="font-bold text-[var(--color-text-primary)] max-w-[140px] truncate">
          {currentLabel || 'All Time'}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[var(--color-text-muted)] transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[var(--color-primary)]' : ''
          }`}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-64 sm:w-72 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-2.5 py-1.5 mb-1 border-b border-[var(--color-border)]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
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
                      ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-bold'
                      : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isActive && <Check className="w-4 h-4 text-[var(--color-primary)] shrink-0" />}
                </button>
              )
            })}
          </div>

          {/* Expandable Custom Date Range Inputs */}
          {showCustomInputs && (
            <form
              onSubmit={handleCustomApply}
              className="mt-2 pt-2 border-t border-[var(--color-border)] px-1 space-y-2 animate-fadeIn"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-text-primary)]">
                <SlidersHorizontal className="w-3 h-3 text-[var(--color-primary)]" />
                <span>Custom Range</span>
              </div>

              <div className="space-y-1.5">
                <div>
                  <label className="block text-[10px] text-[var(--color-text-muted)] mb-0.5">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[var(--color-text-muted)] mb-0.5">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors shadow-xs cursor-pointer"
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

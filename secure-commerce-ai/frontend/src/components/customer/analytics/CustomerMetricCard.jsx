import React from 'react'

const COLOR_MAP = {
  blue: {
    iconColor: 'text-[var(--color-primary)]',
  },
  emerald: {
    iconColor: 'text-[var(--color-primary)]',
  },
  green: {
    iconColor: 'text-[var(--color-primary)]',
  },
  amber: {
    iconColor: 'text-[#D99A35]',
  },
  rose: {
    iconColor: 'text-[#DC5555]',
  },
  red: {
    iconColor: 'text-[#DC5555]',
  },
  purple: {
    iconColor: 'text-[var(--color-primary)]',
  },
  violet: {
    iconColor: 'text-[var(--color-primary)]',
  },
}

export default function CustomerMetricCard({
  title,
  value,
  icon: Icon,
  color = 'blue',
  className = '',
}) {
  const scheme = COLOR_MAP[color] || COLOR_MAP.blue

  return (
    <div
      className={`group relative flex flex-col items-center justify-center text-center rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] p-5 sm:p-6 min-h-[144px] h-full box-border min-w-0 w-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${className}`}
    >
      {/* 1. Top Row: Accent Icon + Metric Label (Horizontal, Centered) */}
      <div className="flex items-center justify-center gap-2 sm:gap-2.5 w-full mb-3 sm:mb-3.5">
        {Icon && (
          <Icon
            className={`w-[18px] h-[18px] sm:w-5 sm:h-5 shrink-0 ${scheme.iconColor} transition-transform duration-200 group-hover:scale-110`}
            aria-hidden="true"
          />
        )}
        <span className="text-[13px] sm:text-[14px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] select-none">
          {title}
        </span>
      </div>

      {/* 2. Middle: Large Numerical Value (Centered Horizontally & Vertically) */}
      <div className="text-[28px] sm:text-[30px] lg:text-[32px] font-bold tracking-tight text-[var(--color-text-primary)] leading-tight text-center max-w-full break-words select-all">
        {value}
      </div>
    </div>
  )
}

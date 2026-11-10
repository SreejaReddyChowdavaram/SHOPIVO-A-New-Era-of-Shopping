import React from 'react'

const COLOR_MAP = {
  blue: {
    iconColor: 'text-[#087847] dark:text-[#04DB7E]',
  },
  emerald: {
    iconColor: 'text-[#04DB7E] dark:text-[#04DB7E]',
  },
  green: {
    iconColor: 'text-[#04DB7E] dark:text-[#04DB7E]',
  },
  amber: {
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  rose: {
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  red: {
    iconColor: 'text-red-600 dark:text-red-400',
  },
  purple: {
    iconColor: 'text-[#00C77A] dark:text-[#00C77A]',
  },
  violet: {
    iconColor: 'text-[#087847] dark:text-[#04DB7E]',
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
      className={`group relative flex flex-col items-center justify-center text-center rounded-2xl bg-white dark:bg-[#101010] border border-[#DFE9E2] dark:border-[#242424] hover:border-[#04DB7E]/60 p-5 sm:p-6 min-h-[144px] h-full box-border min-w-0 w-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${className}`}
    >
      {/* 1. Top Row: Accent Icon + Metric Label (Horizontal, Centered) */}
      <div className="flex items-center justify-center gap-2 sm:gap-2.5 w-full mb-3 sm:mb-3.5">
        {Icon && (
          <Icon
            className={`w-[18px] h-[18px] sm:w-5 sm:h-5 shrink-0 ${scheme.iconColor} transition-transform duration-200 group-hover:scale-110`}
            aria-hidden="true"
          />
        )}
        <span className="text-[13px] sm:text-[14px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
          {title}
        </span>
      </div>

      {/* 2. Middle: Large Numerical Value (Centered Horizontally & Vertically) */}
      <div className="text-[28px] sm:text-[30px] lg:text-[32px] font-bold tracking-tight text-slate-900 dark:text-white leading-tight text-center max-w-full break-words select-all">
        {value}
      </div>
    </div>
  )
}

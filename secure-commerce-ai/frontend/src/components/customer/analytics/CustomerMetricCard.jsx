import React from 'react'

const COLOR_MAP = {
  blue: {
    border: 'border-blue-500/70 dark:border-blue-500/60 hover:border-blue-500 dark:hover:border-blue-400',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  emerald: {
    border: 'border-emerald-500/70 dark:border-emerald-500/60 hover:border-emerald-500 dark:hover:border-emerald-400',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  green: {
    border: 'border-emerald-500/70 dark:border-emerald-500/60 hover:border-emerald-500 dark:hover:border-emerald-400',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  amber: {
    border: 'border-amber-500/70 dark:border-amber-500/60 hover:border-amber-500 dark:hover:border-amber-400',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  rose: {
    border: 'border-rose-500/70 dark:border-rose-500/60 hover:border-rose-500 dark:hover:border-rose-400',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  red: {
    border: 'border-red-500/70 dark:border-red-500/60 hover:border-red-500 dark:hover:border-red-400',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  purple: {
    border: 'border-purple-500/70 dark:border-purple-500/60 hover:border-purple-500 dark:hover:border-purple-400',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  violet: {
    border: 'border-violet-500/70 dark:border-violet-500/60 hover:border-violet-500 dark:hover:border-violet-400',
    iconColor: 'text-violet-600 dark:text-violet-400',
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
      className={`group relative flex flex-col items-center justify-center text-center rounded-2xl bg-white dark:bg-[#101726] border-2 ${scheme.border} p-5 sm:p-6 min-h-[144px] h-full box-border min-w-0 w-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${className}`}
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

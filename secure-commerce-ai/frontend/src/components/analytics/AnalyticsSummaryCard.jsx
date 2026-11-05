import React from 'react'

const ACCENT_STYLES = {
  blue: {
    iconBg: 'bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20',
    topBar: 'bg-blue-500',
  },
  emerald: {
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    topBar: 'bg-emerald-500',
  },
  amber: {
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    topBar: 'bg-amber-500',
  },
  rose: {
    iconBg: 'bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20',
    topBar: 'bg-rose-500',
  },
  indigo: {
    iconBg: 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
    topBar: 'bg-indigo-500',
  },
  cyan: {
    iconBg: 'bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20',
    topBar: 'bg-cyan-500',
  },
}

export default function AnalyticsSummaryCard({
  title,
  value,
  subLabel,
  subValue,
  icon: Icon,
  _variant = 'surface',
  gradientColor = 'blue',
  badge,
  badgeType = 'positive',
  className = '',
}) {
  const accent = ACCENT_STYLES[gradientColor] || ACCENT_STYLES.blue

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white dark:bg-[#111C30] border border-slate-200/90 dark:border-[#25334A] p-5 h-[150px] shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600/80 transition-all duration-200 ${className}`}
    >
      {/* Top Subtle Color Accent Bar */}
      <div className={`absolute top-0 left-0 right-0 h-[2.5px] ${accent.topBar} opacity-85 group-hover:opacity-100 transition-opacity`} />

      {/* Card Header: Label & Icon */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
          {title}
        </span>
        {Icon && (
          <div className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-transform duration-200 group-hover:scale-105 ${accent.iconBg}`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
        )}
      </div>

      {/* Main Metric Value */}
      <div className="my-auto flex items-baseline justify-between gap-2">
        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none truncate">
          {value}
        </h3>
        {badge && (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 border ${
              badgeType === 'positive'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60'
                : badgeType === 'negative'
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80'
            }`}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Card Footer: Sublabel & Subvalue */}
      {(subLabel || subValue) && (
        <div className="pt-2.5 border-t border-slate-100 dark:border-[#25334A]/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <span className="truncate">{subLabel}</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200 shrink-0">
            {subValue}
          </span>
        </div>
      )}
    </div>
  )
}

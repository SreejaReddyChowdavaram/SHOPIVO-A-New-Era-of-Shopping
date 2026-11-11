import React from 'react'

const ACCENT_STYLES = {
  blue: {
    iconBg: 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)] border border-[var(--color-border)]',
    topBar: 'bg-[var(--color-primary)]',
  },
  emerald: {
    iconBg: 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)] border border-[var(--color-border)]',
    topBar: 'bg-[var(--color-primary)]',
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
    iconBg: 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)] border border-[var(--color-border)]',
    topBar: 'bg-[var(--color-primary)]',
  },
  cyan: {
    iconBg: 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)] border border-[var(--color-border)]',
    topBar: 'bg-[var(--color-primary)]',
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
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 h-[150px] shadow-xs hover:shadow-md hover:border-[var(--color-primary)] transition-all duration-200 ${className}`}
    >
      {/* Top Subtle Color Accent Bar */}
      <div className={`absolute top-0 left-0 right-0 h-[2.5px] ${accent.topBar} opacity-85 group-hover:opacity-100 transition-opacity`} />

      {/* Card Header: Label & Icon */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] truncate">
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
        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-none truncate">
          {value}
        </h3>
        {badge && (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 border ${
              badgeType === 'positive'
                ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)] border-[var(--color-border)]'
                : badgeType === 'negative'
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60'
                : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)]'
            }`}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Card Footer: Sublabel & Subvalue */}
      {(subLabel || subValue) && (
        <div className="pt-2.5 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-secondary)] gap-2">
          <span className="truncate">{subLabel}</span>
          <span className="font-semibold text-[var(--color-text-primary)] shrink-0">
            {subValue}
          </span>
        </div>
      )}
    </div>
  )
}

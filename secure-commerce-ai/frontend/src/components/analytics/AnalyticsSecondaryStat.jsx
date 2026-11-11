import React from 'react'

const COLOR_MAP = {
  emerald: 'text-[var(--color-primary)] bg-[var(--color-primary-subtle)] border-[var(--color-border)]',
  rose: 'text-[#DC5555] bg-[#DC5555]/10 border-[#DC5555]/20',
  blue: 'text-[var(--color-primary)] bg-[var(--color-primary-subtle)] border-[var(--color-border)]',
  amber: 'text-[#D99A35] bg-[#D99A35]/10 border-[#D99A35]/20',
  pink: 'text-[var(--color-primary)] bg-[var(--color-primary-subtle)] border-[var(--color-border)]',
  slate: 'text-[var(--color-text-secondary)] bg-[var(--color-bg)] border-[var(--color-border)]',
}

export default function AnalyticsSecondaryStat({
  title,
  value,
  icon: Icon,
  color = 'blue',
  subText,
}) {
  const colorStyle = COLOR_MAP[color] || COLOR_MAP.blue

  return (
    <div className="flex items-center justify-between p-4 h-[88px] rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs hover:border-[var(--color-primary)] transition-all duration-150">
      <div className="min-w-0 pr-2 flex flex-col justify-between h-full">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] truncate">
          {title}
        </p>
        <p className="text-xl font-extrabold text-[var(--color-text-primary)] leading-none truncate">
          {value}
        </p>
        {subText && (
          <p className="text-[10px] text-[var(--color-text-muted)] truncate">
            {subText}
          </p>
        )}
      </div>

      {Icon && (
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${colorStyle}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      )}
    </div>
  )
}

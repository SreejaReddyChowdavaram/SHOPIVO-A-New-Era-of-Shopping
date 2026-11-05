import React from 'react'

const COLOR_MAP = {
  emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  rose: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
  blue: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
  amber: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
  pink: 'text-pink-600 dark:text-pink-400 bg-pink-500/10 border-pink-500/20',
  slate: 'text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20',
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
    <div className="flex items-center justify-between p-4 h-[88px] rounded-2xl bg-white dark:bg-[#111C30] border border-slate-200/80 dark:border-[#25334A] shadow-xs hover:border-slate-300 dark:hover:border-slate-600/70 transition-all duration-150">
      <div className="min-w-0 pr-2 flex flex-col justify-between h-full">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
          {title}
        </p>
        <p className="text-xl font-extrabold text-slate-900 dark:text-white leading-none truncate">
          {value}
        </p>
        {subText && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
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

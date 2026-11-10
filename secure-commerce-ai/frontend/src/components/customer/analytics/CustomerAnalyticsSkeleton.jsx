import React from 'react'

export default function CustomerAnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-6 sm:gap-7 animate-pulse">
      {/* 8 Skeleton KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {[...Array(8)].map((_, i) => (
          <div
            key={`kpi-skel-${i}`}
            className="rounded-2xl bg-white dark:bg-[#101010] border border-[#DFE9E2] dark:border-[#242424] p-5 min-h-[154px] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-7 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg my-2" />
            <div className="pt-2 border-t border-[#DFE9E2] dark:border-[#242424] flex items-center justify-between">
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Skeleton Charts Grid (Balanced 2-Column) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        <div className="rounded-2xl bg-white dark:bg-[#101010] border border-[#DFE9E2] dark:border-[#242424] p-6 h-[380px] flex flex-col justify-between">
          <div className="h-4 w-44 bg-slate-200 dark:bg-slate-800 rounded-md mx-auto" />
          <div className="h-[280px] w-full bg-slate-100 dark:bg-slate-800/40 rounded-xl" />
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#101010] border border-[#DFE9E2] dark:border-[#242424] p-6 h-[380px] flex flex-col justify-between">
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded-md mx-auto" />
          <div className="h-[280px] w-full bg-slate-100 dark:bg-slate-800/40 rounded-xl" />
        </div>
      </div>

      {/* Skeleton Table */}
      <div className="rounded-2xl bg-white dark:bg-[#101010] border border-[#DFE9E2] dark:border-[#242424] p-6 h-[260px] flex flex-col justify-between">
        <div className="h-4 w-52 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="space-y-3 pt-4">
          <div className="h-10 w-full bg-slate-100 dark:bg-slate-800/40 rounded-lg" />
          <div className="h-10 w-full bg-slate-100 dark:bg-slate-800/40 rounded-lg" />
          <div className="h-10 w-full bg-slate-100 dark:bg-slate-800/40 rounded-lg" />
        </div>
      </div>
    </div>
  )
}


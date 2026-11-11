import React from 'react'
import { Package, TrendingUp } from 'lucide-react'

export default function TopProductsList({
  title = 'Top Selling Products',
  subtitle = 'Catalog revenue drivers by units sold',
  products = [],
  role = 'seller', // 'seller' | 'admin'
  className = '',
}) {
  return (
    <div className={`rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5.5 shadow-xs flex flex-col justify-between ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
            {title}
          </h4>
          {subtitle && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-primary)] bg-[var(--color-primary-subtle)] border border-[var(--color-border)] px-2 py-0.5 rounded-full">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>By Volume</span>
        </span>
      </div>

      {/* Product List */}
      <div className="space-y-2.5">
        {products && products.length > 0 ? (
          products.map((item, idx) => (
            <div
              key={`prod-${item.productId || idx}`}
              className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center font-extrabold text-xs shrink-0">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-[var(--color-text-primary)] truncate max-w-[200px]">
                    {item.productName}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    {role === 'admin' && item.sellerName
                      ? `Seller: ${item.sellerName} • `
                      : ''}
                    {item.currentStock != null ? `Stock: ${item.currentStock} units` : ''}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 pl-3">
                <p className="font-bold text-xs text-[var(--color-text-primary)]">
                  {Number(item.unitsSold || 0).toLocaleString()}{' '}
                  <span className="font-normal text-[10px] text-slate-400">sold</span>
                </p>
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  ₹{Number(item.grossSales || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="py-10 flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
            <Package className="w-6 h-6 text-slate-400/60" />
            <span>No top products data recorded for this period</span>
          </div>
        )}
      </div>
    </div>
  )
}

import React from 'react'
import { Link } from 'react-router-dom'
import { Package, ExternalLink, ArrowRight } from 'lucide-react'

const STATUS_CONFIG = {
  DELIVERED: {
    label: 'Delivered',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/80',
  },
  PENDING: {
    label: 'Pending',
    badge: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/80',
  },
  CONFIRMED: {
    label: 'Confirmed',
    badge: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/80',
  },
  PROCESSING: {
    label: 'Processing',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/80',
  },
  SHIPPED: {
    label: 'Shipped',
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200/80 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800/80',
  },
  CANCELLED: {
    label: 'Cancelled',
    badge: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/80',
  },
  RETURNED: {
    label: 'Returned',
    badge: 'bg-pink-50 text-pink-700 border-pink-200/80 dark:bg-pink-950/40 dark:text-pink-400 dark:border-pink-800/80',
  },
}

export default function CustomerRecentPurchases({
  title = 'Recently Purchased Products',
  subtitle = 'Your latest order items and fulfillment status',
  orders = [],
  viewAllLink,
  className = '',
}) {
  const formatDate = (isoString) => {
    if (!isoString) return '-'
    const d = new Date(isoString)
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatPrice = (val) => {
    return `₹${Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  return (
    <div
      className={`rounded-2xl bg-white dark:bg-[#101726] border border-slate-200/90 dark:border-[#1e293b] p-5 sm:p-6 shadow-xs flex flex-col justify-between ${className}`}
    >
      {/* Table Header Row */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{title}</span>
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <span>View All Orders</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {orders && orders.length > 0 ? (
        <>
          {/* ── Desktop & Tablet View (>= 768px): Structured Table ── */}
          <div className="hidden md:block overflow-x-auto -mx-1">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#1e293b] text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 pl-3">Order ID</th>
                  <th className="pb-3">Product</th>
                  <th className="pb-3 text-center">Qty</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1e293b]/70 text-xs">
                {orders.map((item, idx) => {
                  const rawStatus = item.orderStatus || item.status || 'PENDING'
                  const statusInfo = STATUS_CONFIG[rawStatus.toUpperCase()] || {
                    label: rawStatus,
                    badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                  }
                  const orderId = item.orderId || item.id
                  const productName = item.productName || item.productNameSnapshot || 'Product'
                  const imageUrl = item.imageUrl || item.productImageUrl
                  const amount = item.lineTotal || item.amount || item.totalAmount || item.price || 0
                  const qty = item.quantity || 1
                  const dateVal = item.orderDate || item.createdAt

                  return (
                    <tr
                      key={`desktop-order-${orderId}-${idx}`}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Order ID */}
                      <td className="py-3.5 pl-3 font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        #{orderId}
                      </td>

                      {/* Product details */}
                      <td className="py-3.5">
                        <div className="flex items-center gap-3 max-w-sm">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={productName}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {productName}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                              Item #{item.productId || '-'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 text-center text-slate-600 dark:text-slate-400 font-medium">
                        {qty}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatPrice(amount)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusInfo.badge}`}>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 pr-3 text-right text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        {formatDate(dateVal)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile View (< 768px): Responsive Purchase Cards ── */}
          <div className="block md:hidden space-y-3">
            {orders.map((item, idx) => {
              const rawStatus = item.orderStatus || item.status || 'PENDING'
              const statusInfo = STATUS_CONFIG[rawStatus.toUpperCase()] || {
                label: rawStatus,
                badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
              }
              const orderId = item.orderId || item.id
              const productName = item.productName || item.productNameSnapshot || 'Product'
              const imageUrl = item.imageUrl || item.productImageUrl
              const amount = item.lineTotal || item.amount || item.totalAmount || item.price || 0
              const qty = item.quantity || 1
              const dateVal = item.orderDate || item.createdAt

              return (
                <div
                  key={`mobile-order-${orderId}-${idx}`}
                  className="p-3.5 rounded-xl border border-slate-200/80 dark:border-[#1e293b] bg-slate-50/60 dark:bg-[#0b1120] flex flex-col gap-2.5 shadow-xs"
                >
                  {/* Top: Order ID & Status Badge */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-blue-600 dark:text-blue-400">
                      Order #{orderId}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusInfo.badge}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Middle: Product Thumbnail & Name */}
                  <div className="flex items-center gap-3">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={productName}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                        {productName}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Qty: {qty}
                      </p>
                    </div>
                  </div>

                  {/* Bottom: Amount & Date */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-[#1e293b] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mr-1.5">
                        Amount:
                      </span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {formatPrice(amount)}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {formatDate(dateVal)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div className="py-12 flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
          <Package className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          <span>No recent purchases recorded for this timeframe</span>
        </div>
      )}
    </div>
  )
}


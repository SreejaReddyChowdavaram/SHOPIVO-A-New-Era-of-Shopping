import React from 'react'
import { Link } from 'react-router-dom'
import { Package, ExternalLink } from 'lucide-react'

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

export default function RecentOrdersTable({
  title = 'Recently Purchased Products',
  subtitle = 'Your latest order items',
  orders = [],
  role = 'customer', // 'customer' | 'seller' | 'admin'
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

  return (
    <div className={`rounded-2xl bg-white dark:bg-[#111C30] border border-slate-200/90 dark:border-[#25334A] p-5 sm:p-6 shadow-xs flex flex-col justify-between ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            {title}
          </h4>
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
            <span>View All</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto -mx-1">
        {orders && orders.length > 0 ? (
          <table className="w-full text-left border-collapse min-w-[580px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#25334A]/80 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="pb-3 pl-2">Order</th>
                {role === 'customer' && <th className="pb-3">Product</th>}
                {(role === 'seller' || role === 'admin') && <th className="pb-3">Customer</th>}
                {role === 'seller' && <th className="pb-3">Item Details</th>}
                <th className="pb-3">Quantity</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 pr-2 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#25334A]/60 text-xs">
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
                    key={`order-row-${orderId}-${idx}`}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Order ID */}
                    <td className="py-3.5 pl-2 font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      #{orderId}
                    </td>

                    {/* Customer view: Product image + title */}
                    {role === 'customer' && (
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
                    )}

                    {/* Seller/Admin view: Customer Name */}
                    {(role === 'seller' || role === 'admin') && (
                      <td className="py-3.5 font-medium text-slate-800 dark:text-slate-200">
                        {item.customerName || 'Customer'}
                      </td>
                    )}

                    {/* Seller view: Item details */}
                    {role === 'seller' && (
                      <td className="py-3.5">
                        <div className="flex items-center gap-2.5 max-w-xs">
                          {imageUrl && (
                            <img
                              src={imageUrl}
                              alt={productName}
                              className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          )}
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {productName}
                          </p>
                        </div>
                      </td>
                    )}

                    {/* Quantity */}
                    <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">
                      {qty}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      ₹{Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusInfo.badge}`}>
                        {statusInfo.label}
                      </span>
                    </td>

                    {/* Order Date */}
                    <td className="py-3.5 pr-2 text-right text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {formatDate(dateVal)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
            <Package className="w-7 h-7 text-slate-400/60" />
            <span>No recent purchases recorded for this timeframe</span>
          </div>
        )}
      </div>
    </div>
  )
}

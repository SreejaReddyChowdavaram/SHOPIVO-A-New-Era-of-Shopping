import React from 'react'
import { Link } from 'react-router-dom'
import { RotateCcw, ExternalLink } from 'lucide-react'

const getReturnStatusBadge = (status) => {
  const s = (status || '').toUpperCase()
  switch (s) {
    case 'COMPLETED':
    case 'APPROVED':
    case 'SUCCESS':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/80'
    case 'PENDING':
    case 'REQUESTED':
    case 'UNDER_REVIEW':
      return 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/80'
    case 'REJECTED':
    case 'FAILED':
      return 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/80'
    case 'RETURNED':
      return 'bg-pink-50 text-pink-700 border-pink-200/80 dark:bg-pink-950/40 dark:text-pink-400 dark:border-pink-800/80'
    case 'REFUNDED':
      return 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/80'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/80'
  }
}

export default function RecentReturnsTable({
  title = 'Return & Refund History',
  subtitle = 'Status of your return requests',
  returns = [],
  role = 'customer',
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
    <div className={`rounded-2xl bg-white dark:bg-[#111C30] border border-slate-200/90 dark:border-[#25334A] p-5.5 shadow-xs flex flex-col justify-between ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
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
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <span>View All</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto -mx-1">
        {returns && returns.length > 0 ? (
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#25334A]/80 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="pb-3 pl-2">Return ID</th>
                <th className="pb-3">Order ID</th>
                {role === 'admin' && <th className="pb-3">Customer</th>}
                <th className="pb-3">Product</th>
                <th className="pb-3">Reason</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Refund Amount</th>
                <th className="pb-3 pr-2 text-right">Requested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#25334A]/60 text-xs">
              {returns.map((item, idx) => {
                const retId = item.returnId || item.id || idx + 1
                const orderId = item.orderId || '-'
                const refundVal = Number(item.refundAmount || 0)

                return (
                  <tr
                    key={`return-row-${retId}-${idx}`}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Return ID */}
                    <td className="py-3.5 pl-2 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      #{retId}
                    </td>

                    {/* Order ID */}
                    <td className="py-3.5 font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      #{orderId}
                    </td>

                    {/* Admin view: Customer */}
                    {role === 'admin' && (
                      <td className="py-3.5 font-medium text-slate-800 dark:text-slate-200">
                        {item.customerName || 'Customer'}
                      </td>
                    )}

                    {/* Product */}
                    <td className="py-3.5 font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                      {item.productName || 'Product'}
                    </td>

                    {/* Reason */}
                    <td className="py-3.5 text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                      {item.reason || '-'}
                    </td>

                    {/* Return Status Badge */}
                    <td className="py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getReturnStatusBadge(item.returnStatus)}`}>
                        {item.returnStatus || 'PENDING'}
                      </span>
                    </td>

                    {/* Refund Amount */}
                    <td className="py-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {refundVal > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          ₹{refundVal.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Requested Date */}
                    <td className="py-3.5 pr-2 text-right text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {formatDate(item.requestedAt)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="py-10 flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
            <RotateCcw className="w-6 h-6 text-slate-400/60" />
            <span>No return requests recorded for this period</span>
          </div>
        )}
      </div>
    </div>
  )
}

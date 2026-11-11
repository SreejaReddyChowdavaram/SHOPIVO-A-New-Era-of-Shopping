/**
 * Orders.jsx — Admin Platform-wide Order Oversight & Operations
 * Route: /admin/orders
 * Layout: AdminLayout
 *
 * Provides complete operational visibility over platform orders:
 *  - Real-time search across Order ID, customer name, customer email
 *  - Order status filter tabs (All, Pending, Confirmed, Processing, Shipped, Delivered, Cancelled)
 *  - Payment status filter (All, Success, Refunded, Failed, Pending)
 *  - Database-paged responsive table with total items, seller count, financial amount
 *  - Direct link to full platform order inspection (/admin/orders/:id)
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  Loader2,
  XCircle,
  Search,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  CreditCard,
  ShoppingBag,
} from 'lucide-react'
import { getAdminOrdersPaged } from '@/services/orderService'
import { ROUTES } from '@/constants/routes'

const STATUS_TABS = [
  { id: 'ALL', label: 'All Orders' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'CONFIRMED', label: 'Confirmed' },
  { id: 'PROCESSING', label: 'Processing' },
  { id: 'SHIPPED', label: 'Shipped' },
  { id: 'DELIVERED', label: 'Delivered' },
  { id: 'CANCELLED', label: 'Cancelled' },
]

const PAYMENT_FILTERS = [
  { id: '', label: 'All Payments' },
  { id: 'SUCCESS', label: 'Paid (Success)' },
  { id: 'REFUNDED', label: 'Refunded' },
  { id: 'FAILED', label: 'Payment Failed' },
  { id: 'INITIATED', label: 'Initiated' },
]

const STATUS_BADGE = {
  PENDING:    { label: 'Pending',    color: 'var(--color-warning)', bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.3)' },
  CONFIRMED:  { label: 'Confirmed',  color: 'var(--color-primary)', bg: 'var(--color-primary-subtle)', border: 'var(--color-border)' },
  PROCESSING: { label: 'Processing', color: 'var(--color-primary)', bg: 'var(--color-primary-subtle)', border: 'var(--color-border)' },
  SHIPPED:    { label: 'Shipped',    color: '#0d9488',              bg: 'rgba(13, 148, 136, 0.12)', border: 'rgba(13, 148, 136, 0.3)' },
  DELIVERED:  { label: 'Delivered',  color: 'var(--color-success)', bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.3)' },
  CANCELLED:  { label: 'Cancelled',  color: 'var(--color-danger)',  bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' },
}

const PAYMENT_BADGE = {
  SUCCESS:   { label: 'Paid',       color: 'var(--color-success)', bg: 'rgba(34, 197, 94, 0.1)' },
  REFUNDED:  { label: 'Refunded',   color: '#B3B3B3',              bg: 'rgba(179, 179, 179, 0.15)' },
  FAILED:    { label: 'Failed',     color: 'var(--color-danger)',  bg: 'rgba(239, 68, 68, 0.1)' },
  INITIATED: { label: 'Initiated',  color: 'var(--color-warning)', bg: 'rgba(234, 179, 8, 0.1)' },
}

const AdminOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters & Pagination
  const [activeStatus, setActiveStatus] = useState('ALL')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)
  const pageSize = 10

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = {
        page,
        size: pageSize,
      }
      if (activeStatus !== 'ALL') {
        params.status = activeStatus
      }
      if (paymentStatus) {
        params.paymentStatus = paymentStatus
      }
      if (search.trim()) {
        params.search = search.trim()
      }

      const pagedData = await getAdminOrdersPaged(params)
      setOrders(pagedData.content || [])
      setTotalPages(pagedData.totalPages || 1)
      setTotalOrders(pagedData.totalElements || 0)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load platform orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [activeStatus, paymentStatus, page])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(0)
    fetchOrders()
  }

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0)

  const formatDate = (isoString) => {
    if (!isoString) return '—'
    return new Date(isoString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>

      {/* ── Page Header ── */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
          Platform Order Oversight
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Complete operational visibility over customer purchases, mixed-seller line items, payments, and fulfillment.
        </p>
      </div>

      {/* ── Filter Bar: Status Tabs ── */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.25rem',
      }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveStatus(tab.id); setPage(0); }}
            style={{
              border: '1px solid',
              borderColor: activeStatus === tab.id ? 'var(--color-primary)' : 'var(--color-border)',
              backgroundColor: activeStatus === tab.id ? 'var(--color-primary)' : 'var(--color-surface)',
              color: activeStatus === tab.id ? '#ffffff' : 'var(--color-text-secondary)',
              fontWeight: activeStatus === tab.id ? '600' : '500',
              fontSize: '0.8125rem',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Search & Secondary Filters ── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 320px', maxWidth: '480px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-disabled)' }} />
            <input
              type="text"
              placeholder="Search by Order ID, customer name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                fontSize: '0.875rem',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ fontSize: '0.8125rem', padding: '0.5rem 0.85rem' }}>
            Search
          </button>
          {search && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setSearch(''); setPage(0); }}
              style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }}
            >
              Clear
            </button>
          )}
        </form>

        {/* Payment Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={15} color="var(--color-text-secondary)" />
          <select
            value={paymentStatus}
            onChange={(e) => { setPaymentStatus(e.target.value); setPage(0); }}
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '0.8125rem',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
            }}
          >
            {PAYMENT_FILTERS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: 'var(--color-danger)',
        }}>
          <AlertCircle size={20} className="shrink-0" />
          <span style={{ fontSize: '0.875rem', flex: 1 }}>{error}</span>
          <button onClick={fetchOrders} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
            Retry
          </button>
        </div>
      )}

      {/* ── Orders Table ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--color-text-disabled)' }}>
            <Loader2 size={32} className="spin" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ fontSize: '0.875rem' }}>Loading platform orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--color-text-disabled)' }}>
            <ShoppingBag size={48} strokeWidth={1.5} style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
              No Orders Found
            </h3>
            <p style={{ fontSize: '0.875rem', marginTop: '0.35rem' }}>
              {search || activeStatus !== 'ALL' || paymentStatus
                ? 'No orders match the current filter criteria.'
                : 'No customer orders have been placed on the platform yet.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{
                  backgroundColor: 'var(--color-bg)',
                  borderBottom: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Order</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Customer</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Items & Sellers</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Total</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Payment</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Fulfillment</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const sCfg = STATUS_BADGE[order.status] || { label: order.status, color: 'var(--color-text-secondary)', bg: 'var(--color-surface)' }
                  const pCfg = order.paymentStatus ? PAYMENT_BADGE[order.paymentStatus] : null

                  return (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Order ID */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>
                          #{order.id}
                        </span>
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '1rem 1rem' }}>
                        <p style={{ fontWeight: '600', color: 'var(--color-text-primary)', margin: 0 }}>
                          {order.customerName}
                        </p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>
                          {order.customerEmail}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '1rem 1rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
                        {formatDate(order.createdAt)}
                      </td>

                      {/* Items & Sellers */}
                      <td style={{ padding: '1rem 1rem' }}>
                        <span style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>
                          {order.totalItems} {order.totalItems === 1 ? 'item' : 'items'}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>
                          {order.sellerCount} {order.sellerCount === 1 ? 'seller' : 'sellers'}
                        </span>
                      </td>

                      {/* Total */}
                      <td style={{ padding: '1rem 1rem', fontWeight: '700', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                        {formatCurrency(order.totalAmount)}
                      </td>

                      {/* Payment */}
                      <td style={{ padding: '1rem 1rem' }}>
                        {pCfg ? (
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '9999px',
                            backgroundColor: pCfg.bg,
                            color: pCfg.color,
                            display: 'inline-block',
                          }}>
                            {pCfg.label}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>
                            {order.paymentMethod || 'COD / Pending'}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem 1rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          backgroundColor: sCfg.bg,
                          color: sCfg.color,
                          border: `1px solid ${sCfg.border}`,
                          display: 'inline-block',
                        }}>
                          {sCfg.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="btn btn-secondary"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.35rem 0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            textDecoration: 'none',
                          }}
                        >
                          <Eye size={13} /> View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && orders.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.25rem',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg)',
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
          }}>
            <span>
              Showing Page {page + 1} of {totalPages} ({totalOrders} total orders)
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                disabled={page <= 0}
                onClick={() => setPage(page - 1)}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                className="btn btn-secondary"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

export default AdminOrders

/**
 * Orders.jsx — Seller order management page
 * Displays orders containing the seller's products with status filtering.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package,
  Clock,
  ChevronRight,
  Loader2,
  AlertCircle,
  Filter,
  CheckCircle2,
  Truck,
  XCircle,
  ShoppingBag,
  User,
  ArrowRight,
  Search,
  X,
  ArrowUpDown,
} from 'lucide-react'
import { getSellerOrders, updateStatus } from '@/services/orderService'

const STATUS_TABS = ['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

const STATUS_BADGE = {
  PENDING:    { label: 'Pending',    color: 'var(--color-warning)', bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.3)' },
  CONFIRMED:  { label: 'Confirmed',  color: '#087847',              bg: '#E5FFF2',                  border: '#DFE9E2' },
  PROCESSING: { label: 'Processing', color: '#00C77A',              bg: 'rgba(0, 199, 122, 0.12)', border: 'rgba(0, 199, 122, 0.3)' },
  SHIPPED:    { label: 'Shipped',    color: '#0d9488',              bg: 'rgba(13, 148, 136, 0.12)', border: 'rgba(13, 148, 136, 0.3)' },
  DELIVERED:  { label: 'Delivered',  color: 'var(--color-success)', bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.3)' },
  CANCELLED:  { label: 'Cancelled',  color: 'var(--color-danger)',  bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' },
}

const SellerOrders = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')
  const [updatingId, setUpdatingId] = useState(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const data = await getSellerOrders()
      setOrders(data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load seller orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const handleQuickAdvance = async (e, order) => {
    e.stopPropagation()
    let nextStatus = null
    if (order.status === 'PENDING') nextStatus = 'CONFIRMED'
    else if (order.status === 'CONFIRMED') nextStatus = 'PROCESSING'
    else if (order.status === 'PROCESSING') nextStatus = 'SHIPPED'
    else if (order.status === 'SHIPPED') nextStatus = 'DELIVERED'

    if (!nextStatus) return

    try {
      setUpdatingId(order.id)
      await updateStatus(order.id, nextStatus)
      await fetchOrders()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status')
    } finally {
      setUpdatingId(null)
    }
  }

  // Calculate seller subtotal for an order based on items
  const getSellerSubtotal = (order) => {
    return order.items.reduce((sum, item) => sum + (item.subtotal || item.unitPrice * item.quantity), 0)
  }

  const getSellerItemCount = (order) => {
    return order.items.reduce((sum, item) => sum + item.quantity, 0)
  }

  const filteredOrders = orders
    .filter(order => {
      if (activeTab !== 'ALL' && order.status !== activeTab) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      const matchId = String(order.id).includes(q)
      const matchCustomer = (order.customerName || '').toLowerCase().includes(q) ||
                            (order.customerEmail || '').toLowerCase().includes(q)
      const matchProduct = order.items?.some(item =>
        (item.productName || '').toLowerCase().includes(q)
      )
      const matchCity = (order.shippingAddress?.city || '').toLowerCase().includes(q)
      return matchId || matchCustomer || matchProduct || matchCity
    })
    .sort((a, b) => {
      if (sortBy === 'date-asc') return new Date(a.createdAt) - new Date(b.createdAt)
      if (sortBy === 'amount-desc') return getSellerSubtotal(b) - getSellerSubtotal(a)
      if (sortBy === 'amount-asc') return getSellerSubtotal(a) - getSellerSubtotal(b)
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

  return (
    <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
          Customer Orders
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Manage and fulfill orders containing your products.
        </p>
      </div>

      {/* Search & Sort Controls */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginBottom: '1.25rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flex: 1,
          minWidth: '240px',
          maxWidth: '480px',
          position: 'relative'
        }}>
          <Search size={16} color="var(--color-text-secondary)" style={{ position: 'absolute', left: '0.85rem' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, Customer, or Product..."
            style={{
              width: '100%',
              padding: '0.55rem 2.25rem 0.55rem 2.5rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              fontSize: '0.85rem'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '0.75rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowUpDown size={14} color="var(--color-text-secondary)" />
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Sort:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              fontSize: '0.8125rem',
              cursor: 'pointer'
            }}
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.75rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid var(--color-border)'
      }}>
        {STATUS_TABS.map(tab => {
          const count = tab === 'ALL'
            ? orders.length
            : orders.filter(o => o.status === tab).length
          const isActive = activeTab === tab

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid',
                borderColor: isActive ? 'var(--color-primary)' : 'var(--color-border)',
                background: isActive ? 'rgba(4, 219, 126, 0.15)' : 'var(--color-surface)',
                color: isActive ? 'var(--color-nav-active-text, var(--color-primary))' : 'var(--color-text-secondary)',
                fontSize: '0.8125rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.charAt(0) + tab.slice(1).toLowerCase()}</span>
              <span style={{
                fontSize: '0.75rem',
                padding: '0.1rem 0.45rem',
                borderRadius: 'var(--radius-full)',
                background: isActive ? 'var(--color-primary)' : 'var(--color-surface-raised)',
                color: isActive ? '#fff' : 'var(--color-text-disabled)'
              }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh', flexDirection: 'column', gap: '1rem', color: 'var(--color-text-secondary)' }}>
          <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
          <span>Loading orders...</span>
        </div>
      ) : error ? (
        <div className="card" style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.5rem' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Package size={48} style={{ margin: '0 auto 1rem', color: 'var(--color-text-disabled)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>No orders found</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            {activeTab === 'ALL'
              ? 'No customer orders have been placed for your products yet.'
              : `No orders currently match the status "${activeTab}".`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredOrders.map(order => {
            const badge = STATUS_BADGE[order.status] || STATUS_BADGE.PENDING
            const subtotal = getSellerSubtotal(order)
            const itemCount = getSellerItemCount(order)
            const isUpdating = updatingId === order.id

            let nextActionLabel = null
            if (order.status === 'PENDING') nextActionLabel = 'Confirm Order'
            else if (order.status === 'CONFIRMED') nextActionLabel = 'Mark Processing'
            else if (order.status === 'PROCESSING') nextActionLabel = 'Mark Shipped'
            else if (order.status === 'SHIPPED') nextActionLabel = 'Mark Delivered'

            return (
              <div
                key={order.id}
                onClick={() => navigate(`/seller/orders/${order.id}`)}
                className="card"
                style={{
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid var(--color-border)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {/* Header row */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid var(--color-border)',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Package size={18} color="var(--color-primary-light)" />
                      <span style={{ fontWeight: '700', fontSize: '1rem' }}>Order #{order.id}</span>
                    </div>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                      {formatDate(order.createdAt)}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                      <User size={14} />
                      <span>{order.customerName || order.customerEmail || 'Customer'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{
                      color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`,
                      padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                      {badge.label}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                        {formatPrice(subtotal)}
                      </span>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items Row & Quick Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '1.5rem', alignItems: 'center' }}>
                  {/* Items scroll */}
                  <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          background: 'var(--color-surface-raised)',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          flexShrink: 0
                        }}
                      >
                        <img
                          src={item.imageUrl || `https://placehold.co/44x44/1a1d2e/818cf8?text=P`}
                          alt={item.productName}
                          style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                          onError={e => { e.target.src = `https://placehold.co/44x44/1a1d2e/818cf8?text=P` }}
                        />
                        <div>
                          <p style={{ fontSize: '0.8125rem', fontWeight: '600', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.productName}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    {nextActionLabel && (
                      <button
                        className="btn btn-primary"
                        disabled={isUpdating}
                        onClick={(e) => handleQuickAdvance(e, order)}
                        style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem' }}
                      >
                        {isUpdating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : nextActionLabel}
                      </button>
                    )}
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem' }}
                      onClick={(e) => { e.stopPropagation(); navigate(`/seller/orders/${order.id}`) }}
                    >
                      Details <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SellerOrders

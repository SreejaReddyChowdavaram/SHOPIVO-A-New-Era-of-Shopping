/**
 * Orders.jsx — Customer Order History Page (Light Marketplace Style)
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, ChevronRight, Loader2, AlertCircle, ShoppingBag } from 'lucide-react'
import { getMyOrders } from '@/services/orderService'
import { ROUTES } from '@/constants/routes'

const STATUS_BADGE = {
  PENDING:    { label: 'Pending',    color: '#e65100', bg: '#fff3e0', border: '#ffe0b2' },
  CONFIRMED:  { label: 'Confirmed',  color: '#0288d1', bg: '#e1f5fe', border: '#b3e5fc' },
  PROCESSING: { label: 'Processing', color: '#2874f0', bg: '#e8f0fe', border: '#bbdefb' },
  SHIPPED:    { label: 'Shipped',    color: '#0288d1', bg: '#e1f5fe', border: '#b3e5fc' },
  DELIVERED:  { label: 'Delivered',  color: '#388e3c', bg: '#e8f5e9', border: '#c8e6c9' },
  CANCELLED:  { label: 'Cancelled',  color: '#d32f2f', bg: '#ffebee', border: '#ffcdd2' },
}

const CustomerOrders = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getMyOrders()
      .then(setOrders)
      .catch((err) => setError(err.response?.data?.message || err.message || 'Failed to load your orders'))
      .finally(() => setLoading(false))
  }, [])

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh', flexDirection: 'column', gap: '0.75rem', color: 'var(--color-text-secondary)' }}>
        <Loader2 size={32} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--color-primary)' }} />
        <span>Loading orders...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card fade-in" style={{ color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-subtle)', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: 'var(--radius-xs)' }}>
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    )
  }

  const isEmpty = orders.length === 0

  return (
    <div className="fade-in">
      {/* Header */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
          My Orders ({isEmpty ? 0 : orders.length})
        </h1>
      </div>

      {isEmpty ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '4rem 1.5rem',
          }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--color-text-muted)' }}>
            <ShoppingBag size={28} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--color-text-primary)' }}>No orders placed yet</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            Check out our catalog to place your first order.
          </p>
          <Link to={ROUTES.CUSTOMER_PRODUCTS} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map((order) => {
            const badge = STATUS_BADGE[order.status] || STATUS_BADGE.PENDING
            return (
              <div
                key={order.id}
                onClick={() => navigate(`/customer/orders/${order.id}`)}
                className="card card-interactive"
                style={{
                  padding: '1.25rem 1.5rem',
                }}
              >
                {/* Top Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', paddingBottom: '0.85rem', borderBottom: '1px solid var(--color-border-subtle)', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Package size={17} color="var(--color-primary)" />
                      <span style={{ fontWeight: '800', fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>Order #{order.id}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      Placed on {formatDate(order.createdAt)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <span
                      style={{
                        color: badge.color,
                        backgroundColor: badge.bg,
                        border: `1px solid ${badge.border}`,
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '0.7rem',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {badge.label}
                    </span>
                    <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Items Preview */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.35rem' }}>
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          backgroundColor: 'var(--color-bg)',
                          padding: '0.45rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border-subtle)',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={item.imageUrl || `https://placehold.co/40x40/ffffff/2874f0?text=P`}
                          alt={item.productName}
                          style={{ width: '40px', height: '40px', objectFit: 'contain', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-xs)', padding: '0.1rem', border: '1px solid var(--color-border-subtle)' }}
                          onError={(e) => { e.target.src = `https://placehold.co/40x40/ffffff/2874f0?text=P` }}
                        />
                        <div>
                          <p style={{ fontSize: '0.8125rem', fontWeight: '600', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-text-primary)', margin: 0 }}>
                            {item.productName}
                          </p>
                          <p style={{ fontSize: '0.725rem', color: 'var(--color-text-secondary)', margin: '0.1rem 0 0' }}>
                            Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.45rem 0.85rem' }}
                    onClick={(e) => { e.stopPropagation(); navigate(`/customer/orders/${order.id}`) }}
                  >
                    Details <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CustomerOrders

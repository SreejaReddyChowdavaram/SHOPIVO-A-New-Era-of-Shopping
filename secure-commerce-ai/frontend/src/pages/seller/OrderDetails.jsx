/**
 * OrderDetails.jsx — Seller Order Details & Fulfillment Page
 * Allows sellers to inspect customer shipping details and advance order lifecycle status.
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  Loader2,
  Phone,
  User,
  ShieldCheck,
  Send,
  Boxes
} from 'lucide-react'
import { getOrderById, updateStatus } from '@/services/orderService'

const STEPS = [
  { key: 'PENDING',    label: 'Order Placed',  icon: Clock },
  { key: 'CONFIRMED',  label: 'Confirmed',     icon: CheckCircle2 },
  { key: 'PROCESSING', label: 'Processing',    icon: Boxes },
  { key: 'SHIPPED',    label: 'Shipped',       icon: Truck },
  { key: 'DELIVERED',  label: 'Delivered',     icon: ShieldCheck },
]

const STATUS_BADGE = {
  PENDING:    { label: 'Pending',    color: 'var(--color-warning)', bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.3)' },
  CONFIRMED:  { label: 'Confirmed',  color: 'var(--color-primary)', bg: 'var(--color-primary-subtle)', border: 'var(--color-border)' },
  PROCESSING: { label: 'Processing', color: 'var(--color-primary)', bg: 'var(--color-primary-subtle)', border: 'var(--color-border)' },
  SHIPPED:    { label: 'Shipped',    color: '#0d9488',              bg: 'rgba(13, 148, 136, 0.12)', border: 'rgba(13, 148, 136, 0.3)' },
  DELIVERED:  { label: 'Delivered',  color: 'var(--color-success)', bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.3)' },
  CANCELLED:  { label: 'Cancelled',  color: 'var(--color-danger)',  bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' },
}

const SellerOrderDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState(null)

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const data = await getOrderById(id)
      setOrder(data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
  }, [id])

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const handleStatusUpdate = async (nextStatus) => {
    try {
      setUpdating(true)
      const updated = await updateStatus(order.id, nextStatus)
      setOrder(updated)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', flexDirection: 'column', gap: '1rem', color: 'var(--color-text-secondary)' }}>
        <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
        <span>Loading order details...</span>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button
          onClick={() => navigate('/seller/orders')}
          className="btn btn-secondary"
          style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={16} /> Back to Orders
        </button>
        <div className="card" style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.5rem' }}>
          <AlertCircle size={20} />
          <span>{error || 'Order not found'}</span>
        </div>
      </div>
    )
  }

  const isCancelled = order.status === 'CANCELLED'
  const isDelivered = order.status === 'DELIVERED'
  const currentStepIdx = STEPS.findIndex(s => s.key === order.status)
  const badge = STATUS_BADGE[order.status] || STATUS_BADGE.PENDING

  // Calculate seller subtotal
  const sellerSubtotal = order.items.reduce((sum, item) => sum + (item.subtotal || item.unitPrice * item.quantity), 0)

  // Next valid transitions for seller
  let nextAction = null
  if (order.status === 'PENDING') {
    nextAction = { target: 'CONFIRMED', label: 'Confirm Order', hint: 'Acknowledge order receipt and verify items' }
  } else if (order.status === 'CONFIRMED') {
    nextAction = { target: 'PROCESSING', label: 'Mark as Processing', hint: 'Begin packaging and preparing items' }
  } else if (order.status === 'PROCESSING') {
    nextAction = { target: 'SHIPPED', label: 'Mark as Shipped', hint: 'Hand package over to courier partner' }
  } else if (order.status === 'SHIPPED') {
    nextAction = { target: 'DELIVERED', label: 'Mark as Delivered', hint: 'Confirm package was received by customer' }
  }

  return (
    <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Back button */}
      <button
        onClick={() => navigate('/seller/orders')}
        className="btn btn-secondary"
        style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <ArrowLeft size={16} /> Back to Orders
      </button>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
              Order #{order.id}
            </h1>
            <span style={{
              color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`,
              padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              {badge.label}
            </span>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'block' }}>
            Seller Subtotal
          </span>
          <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-primary-light)' }}>
            {formatPrice(sellerSubtotal)}
          </span>
        </div>
      </div>

      {/* Lifecycle Stepper / Cancelled Banner */}
      {isCancelled ? (
        <div className="card" style={{
          marginBottom: '2rem',
          background: 'rgba(239, 68, 68, 0.08)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1.25rem 1.5rem'
        }}>
          <AlertCircle size={28} color="var(--color-danger)" />
          <div>
            <h3 style={{ fontWeight: '700', color: 'var(--color-danger)', marginBottom: '0.25rem' }}>
              Order Cancelled
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              This order was cancelled. Reserved inventory was automatically returned to stock.
            </p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: '2rem', padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--color-text-primary)' }}>
            Fulfillment Progress
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            {/* Background Line */}
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '5%',
              right: '5%',
              height: '3px',
              background: 'var(--color-border)',
              zIndex: 0
            }} />
            {/* Active Progress Line */}
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '5%',
              width: `${Math.max(0, (currentStepIdx / (STEPS.length - 1)) * 90)}%`,
              height: '3px',
              background: 'var(--color-primary)',
              zIndex: 1,
              transition: 'width 0.4s ease'
            }} />

            {STEPS.map((step, idx) => {
              const Icon = step.icon
              const isDone = idx <= currentStepIdx
              const isCurrent = idx === currentStepIdx

              return (
                <div
                  key={step.key}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    position: 'relative',
                    zIndex: 2,
                    flex: 1,
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: isDone ? 'var(--color-primary)' : 'var(--color-surface-raised)',
                    border: `2px solid ${isDone ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDone ? 'var(--color-primary-contrast, #050505)' : 'var(--color-text-disabled)',
                    boxShadow: isCurrent ? '0 0 12px rgba(4, 219, 126, 0.4)' : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    <Icon size={18} />
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: isCurrent ? '700' : '500',
                    color: isCurrent ? 'var(--color-primary)' : isDone ? 'var(--color-text-primary)' : 'var(--color-text-disabled)'
                  }}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Fulfillment Actions Card (if not terminal) */}
      {!isCancelled && !isDelivered && nextAction && (
        <div className="card" style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          background: 'linear-gradient(135deg, rgba(4, 219, 126, 0.1) 0%, rgba(0, 199, 122, 0.08) 100%)',
          borderColor: 'rgba(4, 219, 126, 0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
                Next Fulfillment Action
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                {nextAction.hint}
              </p>
            </div>
            <button
              className="btn btn-primary"
              disabled={updating}
              onClick={() => handleStatusUpdate(nextAction.target)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                fontWeight: '700'
              }}
            >
              {updating ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <>
                  <span>{nextAction.label}</span>
                  <Send size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Grid: Items & Shipping details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Line Items Card */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={20} color="var(--color-primary-light)" />
            Your Items in this Order ({order.items.length})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {order.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  paddingBottom: idx !== order.items.length - 1 ? '1rem' : 0,
                  borderBottom: idx !== order.items.length - 1 ? '1px solid var(--color-border)' : 'none'
                }}
              >
                <img
                  src={item.imageUrl || `https://placehold.co/60x60/1a1d2e/818cf8?text=Product`}
                  alt={item.productName}
                  style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                  onError={e => { e.target.src = `https://placehold.co/60x60/1a1d2e/818cf8?text=Product` }}
                />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    {item.productName}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                    Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
                    {formatPrice(item.subtotal || item.unitPrice * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: '600', color: 'var(--color-text-secondary)' }}>Seller Items Total</span>
            <span style={{ fontWeight: '800', fontSize: '1.125rem', color: 'var(--color-text-primary)' }}>
              {formatPrice(sellerSubtotal)}
            </span>
          </div>
        </div>

        {/* Customer & Shipping Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Customer Info Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} color="var(--color-primary-light)" />
              Customer Information
            </h2>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <p><strong style={{ color: 'var(--color-text-primary)' }}>Name:</strong> {order.customerName || 'N/A'}</p>
              <p><strong style={{ color: 'var(--color-text-primary)' }}>Email:</strong> {order.customerEmail || 'N/A'}</p>
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} color="var(--color-primary-light)" />
              Delivery Address
            </h2>

            {order.shippingAddress ? (
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                <p style={{ fontWeight: '700', color: 'var(--color-text-primary)', fontSize: '0.9375rem', marginBottom: '0.25rem' }}>
                  {order.shippingAddress.fullName}
                </p>
                <p>{order.shippingAddress.line1 || order.shippingAddress.streetAddress}</p>
                {(order.shippingAddress.line2 || order.shippingAddress.streetAddress2) && (
                  <p>{order.shippingAddress.line2 || order.shippingAddress.streetAddress2}</p>
                )}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                {(order.shippingAddress.phone || order.shippingAddress.phoneNumber) && (
                  <p style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem', color: 'var(--color-text-primary)' }}>
                    <Phone size={13} /> {order.shippingAddress.phone || order.shippingAddress.phoneNumber}
                  </p>
                )}
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-disabled)' }}>
                No shipping address details available.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SellerOrderDetails

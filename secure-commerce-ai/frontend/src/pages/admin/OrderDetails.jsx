/**
 * AdminOrderDetails.jsx — Platform Order Operational View
 * Full administrative oversight over customer orders, shipping snapshots,
 * mixed-seller line items, per-seller subtotal breakdown, payment audit trail,
 * and cancellation/refund records.
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Boxes,
  Truck,
  ShieldCheck,
  AlertCircle,
  Loader2,
  MapPin,
  User,
  CreditCard,
  Building2,
  RotateCcw,
  DollarSign,
  AlertTriangle,
  XCircle,
  Mail,
  Phone
} from 'lucide-react'
import {
  getAdminOrderDetails,
  updateAdminOrderStatus,
  cancelAdminOrder
} from '@/services/orderService'

const STEPS = [
  { key: 'PENDING',    label: 'Placed',      icon: Clock },
  { key: 'CONFIRMED',  label: 'Confirmed',   icon: CheckCircle2 },
  { key: 'PROCESSING', label: 'Processing',  icon: Boxes },
  { key: 'SHIPPED',    label: 'Shipped',     icon: Truck },
  { key: 'DELIVERED',  label: 'Delivered',   icon: ShieldCheck },
]

const STATUS_BADGE = {
  PENDING:    { label: 'Pending',    color: 'var(--color-warning)',       bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.3)' },
  CONFIRMED:  { label: 'Confirmed',  color: '#087847',                    bg: '#E5FFF2',                  border: '#DFE9E2' },
  PROCESSING: { label: 'Processing', color: '#00C77A',                    bg: 'rgba(0, 199, 122, 0.12)', border: 'rgba(0, 199, 122, 0.3)' },
  SHIPPED:    { label: 'Shipped',    color: '#0d9488',                    bg: 'rgba(13, 148, 136, 0.12)', border: 'rgba(13, 148, 136, 0.3)' },
  DELIVERED:  { label: 'Delivered',  color: 'var(--color-success)',       bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.3)' },
  CANCELLED:  { label: 'Cancelled',  color: 'var(--color-danger)',        bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' },
}

const ALL_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']

const AdminOrderDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modals & Action States
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchDetails = async () => {
    try {
      setLoading(true)
      const data = await getAdminOrderDetails(id)
      setOrder(data)
      setSelectedStatus(data.status)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load order platform details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetails()
  }, [id])

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price || 0)

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const handleUpdateStatus = async () => {
    if (!selectedStatus || selectedStatus === order.status) {
      setStatusModalOpen(false)
      return
    }
    try {
      setActionLoading(true)
      await updateAdminOrderStatus(order.id, selectedStatus)
      await fetchDetails()
      setStatusModalOpen(false)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a cancellation reason')
      return
    }
    try {
      setActionLoading(true)
      await cancelAdminOrder(order.id, cancelReason)
      await fetchDetails()
      setCancelModalOpen(false)
      setCancelReason('')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', flexDirection: 'column', gap: '1rem', color: 'var(--color-text-secondary)' }}>
        <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
        <span>Loading operational order record...</span>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
        <button
          onClick={() => navigate('/admin/orders')}
          className="btn btn-secondary"
          style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={16} /> Back to Platform Orders
        </button>
        <div className="card" style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.5rem' }}>
          <AlertCircle size={20} />
          <span>{error || 'Order record not found'}</span>
        </div>
      </div>
    )
  }

  const isCancelled = order.status === 'CANCELLED'
  const badge = STATUS_BADGE[order.status] || STATUS_BADGE.PENDING
  const currentStepIdx = STEPS.findIndex(s => s.key === order.status)

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Back button & Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          onClick={() => navigate('/admin/orders')}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={16} /> Back to Platform Orders
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {!isCancelled && (
            <>
              <button
                onClick={() => {
                  setSelectedStatus(order.status)
                  setStatusModalOpen(true)
                }}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                Change Status
              </button>
              <button
                onClick={() => setCancelModalOpen(true)}
                className="btn btn-danger"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <XCircle size={16} /> Cancel Order
              </button>
            </>
          )}
        </div>
      </div>

      {/* Header Banner */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
              Platform Order #{order.id}
            </h1>
            <span style={{
              color: badge.color,
              background: badge.bg,
              border: `1px solid ${badge.border}`,
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8125rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {badge.label}
            </span>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            Created: <strong style={{ color: 'var(--color-text-primary)' }}>{formatDate(order.createdAt)}</strong>
            {order.updatedAt && (
              <span style={{ marginLeft: '1.25rem' }}>
                Last Updated: <strong style={{ color: 'var(--color-text-primary)' }}>{formatDate(order.updatedAt)}</strong>
              </span>
            )}
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Platform Order Total
          </span>
          <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-primary-light)' }}>
            {formatPrice(order.totalAmount)}
          </span>
        </div>
      </div>

      {/* Lifecycle Progress / Cancellation Notice */}
      {isCancelled ? (
        <div className="card" style={{
          marginBottom: '2rem',
          background: 'rgba(239, 68, 68, 0.08)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          padding: '1.5rem'
        }}>
          <AlertCircle size={32} color="var(--color-danger)" style={{ flexShrink: 0 }} />
          <div>
            <h3 style={{ fontWeight: '700', color: 'var(--color-danger)', marginBottom: '0.25rem' }}>
              Order Cancelled
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
              Reason: <strong>{order.cancellationReason || 'Administrative platform cancellation'}</strong>
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Cancelled at: {formatDate(order.cancelledAt)}
            </p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: '2rem', padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.75rem', color: 'var(--color-text-primary)' }}>
            Fulfillment Lifecycle Timeline
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '5%',
              right: '5%',
              height: '3px',
              background: 'var(--color-border)',
              zIndex: 0
            }} />
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '5%',
              width: currentStepIdx >= 0 ? `${(currentStepIdx / (STEPS.length - 1)) * 90}%` : '0%',
              height: '3px',
              background: 'var(--color-primary)',
              transition: 'width 0.4s ease',
              zIndex: 1
            }} />

            {STEPS.map((step, idx) => {
              const Icon = step.icon
              const isCompleted = currentStepIdx > idx
              const isCurrent = currentStepIdx === idx
              return (
                <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative', width: '80px', textAlign: 'center' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.5rem',
                    background: isCompleted || isCurrent ? 'var(--color-primary)' : 'var(--color-card)',
                    border: `2px solid ${isCompleted || isCurrent ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    color: isCompleted || isCurrent ? 'var(--color-primary-contrast, #050505)' : 'var(--color-text-muted)',
                    transition: 'all 0.3s ease',
                    boxShadow: isCurrent ? '0 0 12px rgba(4, 219, 126, 0.4)' : 'none'
                  }}>
                    <Icon size={18} />
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: isCurrent ? '700' : '500',
                    color: isCurrent ? 'var(--color-primary-light)' : (isCompleted ? 'var(--color-text-primary)' : 'var(--color-text-muted)')
                  }}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Grid: Customer Info & Shipping Address Snapshot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Customer Information Card */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary-light)' }}>
            <User size={18} />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
              Customer Information
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Full Name</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>{order.customerName || 'Customer'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Email</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-secondary)' }}>
                <Mail size={14} /> {order.customerEmail || 'No email recorded'}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Customer ID</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>#{order.customerId}</span>
            </div>
          </div>
        </div>

        {/* Shipping Snapshot Card */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary-light)' }}>
            <MapPin size={18} />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
              Shipping Address Snapshot
            </h3>
          </div>
          {order.shippingAddress ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>{order.shippingAddress.fullName}</strong>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                {order.shippingAddress.line1}
                {order.shippingAddress.line2 && <><br />{order.shippingAddress.line2}</>}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.postalCode}
                <br />
                {order.shippingAddress.country}
              </p>
              {order.shippingAddress.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  <Phone size={14} /> {order.shippingAddress.phone}
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No snapshot available</p>
          )}
        </div>
      </div>

      {/* Per-Seller Subtotal Breakdown (Mixed-Seller Integrity) */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--color-primary-light)' }}>
          <Building2 size={18} />
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
            Mixed-Seller Platform Breakdown ({order.sellerBreakdown?.length || 0} Participating Sellers)
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {(order.sellerBreakdown || []).map((sb) => (
            <div key={sb.sellerId} style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                    {sb.sellerName || `Seller #${sb.sellerId}`}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{sb.sellerEmail || `Seller ID: #${sb.sellerId}`}</span>
                </div>
                <span style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-primary-light)' }}>
                  {formatPrice(sb.subtotal)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                <span>Line Items: <strong>{sb.itemCount}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Line Items Table with Seller Details */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '1.25rem' }}>
          Order Line Items ({order.items?.length || 0})
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Item / Product</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Seller</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Unit Price</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                        />
                      )}
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>{item.productName}</div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Product ID: #{item.productId}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <div style={{ fontWeight: '500', color: 'var(--color-text-primary)' }}>{item.sellerName}</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.sellerEmail}</span>
                  </td>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>{formatPrice(item.unitPrice)}</td>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'right', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                    {formatPrice(item.lineTotal || item.unitPrice * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
              <span>Items Subtotal:</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>{formatPrice(order.subtotalAmount)}</strong>
            </div>
            {order.discountAmount && order.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)' }}>
                <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}:</span>
                <strong>- {formatPrice(order.discountAmount)}</strong>
              </div>
            )}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '0.75rem',
              borderTop: '2px solid var(--color-border)',
              fontSize: '1.125rem',
              fontWeight: '800'
            }}>
              <span>Final Total:</span>
              <span style={{ color: 'var(--color-primary-light)' }}>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Audit Trail */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--color-primary-light)' }}>
          <CreditCard size={18} />
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
            Payment Audit Trail
          </h3>
        </div>

        {!order.payment ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>No payment transactions recorded.</p>
        ) : (
          <div style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            fontSize: '0.875rem'
          }}>
            <div>
              <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Transaction ID</span>
              <strong style={{ fontFamily: 'monospace', color: 'var(--color-text-primary)' }}>{order.payment.transactionId || `PAY-${order.payment.id}`}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Method / Gateway</span>
              <span style={{ color: 'var(--color-text-primary)' }}>{order.payment.paymentMethod} {order.payment.paymentGateway ? `via ${order.payment.paymentGateway}` : ''}</span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Payment Status</span>
              <span style={{
                display: 'inline-block',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: '700',
                background: order.payment.paymentStatus === 'SUCCESS' || order.payment.paymentStatus === 'COMPLETED' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                color: order.payment.paymentStatus === 'SUCCESS' || order.payment.paymentStatus === 'COMPLETED' ? 'var(--color-success)' : 'var(--color-warning)'
              }}>
                {order.payment.paymentStatus}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Details / Identifiers</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {order.payment.cardLast4 ? `Card ending in ${order.payment.cardLast4}` : (order.payment.upiIdSnapshot ? `UPI: ${order.payment.upiIdSnapshot}` : 'Sandbox Gateway')}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Paid Timestamp</span>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>{formatDate(order.payment.paidAt)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Returns & Refunds Platforms Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Returns */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary-light)' }}>
            <RotateCcw size={18} />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
              Return Requests ({order.returns?.length || 0})
            </h3>
          </div>

          {(!order.returns || order.returns.length === 0) ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>No return requests submitted for this order.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {order.returns.map((ret) => (
                <div key={ret.id} style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  fontSize: '0.8125rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <strong style={{ color: 'var(--color-text-primary)' }}>Item #{ret.orderItemId}</strong>
                    <span style={{
                      fontWeight: '700',
                      color: ret.status === 'APPROVED' ? 'var(--color-success)' : (ret.status === 'REJECTED' ? 'var(--color-danger)' : 'var(--color-warning)')
                    }}>
                      {ret.status}
                    </span>
                  </div>
                  <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 0.25rem 0' }}>Reason: {ret.reason}</p>
                  {ret.refundAmount && (
                    <span style={{ color: 'var(--color-primary-light)', fontWeight: '600' }}>
                      Refund: {formatPrice(ret.refundAmount)}
                    </span>
                  )}
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Requested: {formatDate(ret.requestedAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Refunds */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary-light)' }}>
            <DollarSign size={18} />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
              Refund Audit Records ({order.refunds?.length || 0})
            </h3>
          </div>

          {(!order.refunds || order.refunds.length === 0) ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>No refunds associated with this order.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {order.refunds.map((ref) => (
                <div key={ref.id} style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  fontSize: '0.8125rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <strong style={{ color: 'var(--color-primary-light)' }}>{formatPrice(ref.refundAmount)}</strong>
                    <span style={{
                      fontWeight: '700',
                      color: ref.refundStatus === 'COMPLETED' ? 'var(--color-success)' : 'var(--color-warning)'
                    }}>
                      {ref.refundStatus}
                    </span>
                  </div>
                  {ref.refundTransactionId && (
                    <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 0.25rem 0', fontFamily: 'monospace' }}>
                      TXN: {ref.refundTransactionId}
                    </p>
                  )}
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Processed: {formatDate(ref.processedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Admin Status Change Modal */}
      {statusModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
          overflowY: 'auto'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', maxHeight: 'min(90vh, 90dvh)', overflowY: 'auto', margin: 'auto', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
              Update Order Status
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
              Select new lifecycle fulfillment status for Platform Order #{order.id}.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {ALL_STATUSES.map((st) => (
                <label key={st} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${selectedStatus === st ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: selectedStatus === st ? 'rgba(4, 219, 126, 0.12)' : 'var(--color-bg-secondary)',
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="adminStatus"
                    value={st}
                    checked={selectedStatus === st}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  />
                  <span style={{ fontWeight: selectedStatus === st ? '700' : '500', color: 'var(--color-text-primary)' }}>
                    {st}
                  </span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStatusModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUpdateStatus}
                disabled={actionLoading || selectedStatus === order.status}
              >
                {actionLoading ? 'Updating...' : 'Save Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Cancel Order Modal */}
      {cancelModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
          overflowY: 'auto'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '460px', maxHeight: 'min(90vh, 90dvh)', overflowY: 'auto', margin: 'auto', padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--color-danger)' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
                Cancel Order #{order.id}
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
              Administrative cancellation will cancel this order and record the specified reason in the platform audit log. Reserved items will be released.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                Cancellation Reason *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="E.g., Customer requested via platform support, payment verification discrepancy..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setCancelModalOpen(false)
                  setCancelReason('')
                }}
                disabled={actionLoading}
              >
                Dismiss
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleCancelOrder}
                disabled={actionLoading || !cancelReason.trim()}
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrderDetails

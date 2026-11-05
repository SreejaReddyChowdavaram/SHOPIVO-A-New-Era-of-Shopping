import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import {
  Package, MapPin, ArrowLeft, Loader2, AlertCircle,
  CheckCircle2, XCircle, CreditCard, Clock, RotateCcw,
  Smartphone, Landmark, Banknote, Ban, Info, X, RefreshCw,
  FileDown
} from 'lucide-react'
import { getOrderById, cancelOrder, downloadInvoice } from '@/services/orderService'
import { getPaymentByOrderId } from '@/services/paymentService'
import { checkReturnEligibility, requestReturn } from '@/services/returnService'
import { ROUTES } from '@/constants/routes'

const TIMELINE_STEPS = [
  { key: 'PENDING',    label: 'Order Placed' },
  { key: 'CONFIRMED',  label: 'Confirmed' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'SHIPPED',    label: 'Shipped' },
  { key: 'DELIVERED',  label: 'Delivered' },
]

const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']

const CANCELLATION_REASONS = [
  'Ordered by mistake',
  'Found a better price elsewhere',
  'Delivery time is too long',
  'Need to change shipping address',
  'Item is no longer needed',
  'Other reason',
]

const RETURN_REASONS = [
  'Damaged or defective product',
  'Wrong item received',
  'Product does not match description',
  'Missing parts or accessories',
  'Quality issue',
  'No longer needed',
  'Other reason',
]

const CustomerOrderDetails = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const paymentQuery = searchParams.get('payment')
  const failureReasonQuery = searchParams.get('reason')

  const [order, setOrder] = useState(null)
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cancellation Modal State
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedReason, setSelectedReason] = useState(CANCELLATION_REASONS[0])
  const [customReason, setCustomReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState(null)
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState(null)

  // Return Modal State (Phase C8)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [returnEligibility, setReturnEligibility] = useState(null)
  const [selectedReturnReason, setSelectedReturnReason] = useState(RETURN_REASONS[0])
  const [returnNote, setReturnNote] = useState('')
  const [selectedReturnItemId, setSelectedReturnItemId] = useState('') // '' means whole order
  const [submittingReturn, setSubmittingReturn] = useState(false)
  const [returnError, setReturnError] = useState(null)
  const [returnSuccessMsg, setReturnSuccessMsg] = useState(null)

  // Invoice Download State (Phase C10)
  const [downloadingInvoice, setDownloadingInvoice] = useState(false)
  const [invoiceError, setInvoiceError] = useState(null)

  const fetchOrderData = () => {
    setLoading(true)
    Promise.all([
      getOrderById(id),
      getPaymentByOrderId(id).catch(() => null),
      checkReturnEligibility(id).catch(() => null),
    ])
      .then(([orderData, paymentData, eligibilityData]) => {
        setOrder(orderData)
        setPayment(paymentData)
        setReturnEligibility(eligibilityData)
      })
      .catch((err) => setError(err.response?.data?.message || err.message || 'Could not load order details'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchOrderData()
  }, [id])

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  const renderPaymentMethodIcon = (method) => {
    switch (method) {
      case 'CARD':
        return <CreditCard size={15} color="var(--color-primary)" />
      case 'UPI':
        return <Smartphone size={15} color="var(--color-discount)" />
      case 'NET_BANKING':
        return <Landmark size={15} color="var(--color-deal)" />
      case 'COD':
        return <Banknote size={15} color="var(--color-text-secondary)" />
      default:
        return <CreditCard size={15} color="var(--color-primary)" />
    }
  }

  const renderPaymentBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle2 size={12} /> PAID (SUCCESS)
          </span>
        )
      case 'FAILED':
        return (
          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <AlertCircle size={12} /> PAYMENT FAILED
          </span>
        )
      case 'INITIATED':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={12} /> DUE ON DELIVERY (COD)
          </span>
        )
      case 'REFUNDED':
        return (
          <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <RotateCcw size={12} /> REFUNDED
          </span>
        )
      default:
        return <span className="badge badge-neutral">{status || 'PENDING'}</span>
    }
  }

  const handleConfirmCancel = async () => {
    const finalReason = selectedReason === 'Other reason' && customReason.trim()
      ? customReason.trim()
      : selectedReason

    setCancelling(true)
    setCancelError(null)
    try {
      const updatedOrder = await cancelOrder(order.id, finalReason)
      setOrder(updatedOrder)
      setShowCancelModal(false)
      setCancelSuccessMsg('Your order has been cancelled successfully. Reserved items have been released.')
    } catch (err) {
      setCancelError(err.response?.data?.message || err.message || 'Failed to cancel order.')
    } finally {
      setCancelling(false)
    }
  }

  const handleConfirmReturn = async () => {
    setSubmittingReturn(true)
    setReturnError(null)
    try {
      await requestReturn({
        orderId: order.id,
        orderItemId: selectedReturnItemId ? Number(selectedReturnItemId) : null,
        reason: selectedReturnReason,
        returnNote: returnNote.trim() || undefined,
      })
      setShowReturnModal(false)
      setReturnSuccessMsg('Return requested successfully! You can track refund progress under Returns & Refunds.')
      fetchOrderData()
      setTimeout(() => setReturnSuccessMsg(null), 6000)
    } catch (err) {
      setReturnError(err.response?.data?.message || err.message || 'Failed to submit return request.')
    } finally {
      setSubmittingReturn(false)
    }
  }

  const handleDownloadInvoice = async () => {
    setDownloadingInvoice(true)
    setInvoiceError(null)
    try {
      await downloadInvoice(order.id)
    } catch (err) {
      setInvoiceError(err.response?.data?.message || err.message || 'Failed to generate and download invoice.')
      setTimeout(() => setInvoiceError(null), 5000)
    } finally {
      setDownloadingInvoice(false)
    }
  }

  if (loading) {
    return (
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh', flexDirection: 'column', gap: '0.75rem', color: 'var(--color-text-secondary)' }}>
        <Loader2 size={32} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--color-primary)' }} />
        <span>Loading order &amp; payment details...</span>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div
        className="fade-in"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          maxWidth: '520px',
          margin: '2rem auto',
          transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
        }}
      >
        <AlertCircle size={36} color="var(--color-danger)" style={{ margin: '0 auto 0.75rem' }} />
        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.35rem' }}>Order Not Found</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
          {error || 'We could not find the requested order.'}
        </p>
        <Link to={ROUTES.CUSTOMER_ORDERS} className="btn btn-secondary">
          Back to Orders
        </Link>
      </div>
    )
  }

  const isCancelled = order.status === 'CANCELLED'
  const isCancellable = order.status === 'PENDING' || order.status === 'CONFIRMED'
  const isDelivered = order.status === 'DELIVERED'
  const isReturnEligible = isDelivered && returnEligibility?.eligible
  const currentStatusIndex = STATUS_ORDER.indexOf(order.status)
  const isPaid = payment && (payment.paymentStatus === 'SUCCESS' || payment.paymentStatus === 'REFUNDED')

  // Calculate refund preview for modal
  const selectedItem = order.items.find(i => String(i.id) === String(selectedReturnItemId))
  const calculatedRefundPreview = selectedItem ? selectedItem.lineTotal : order.totalAmount

  return (
    <div className="fade-in" style={{ paddingBottom: '2rem' }}>
      
      {/* Back button & Action Header */}
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <Link to={ROUTES.CUSTOMER_ORDERS} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
          <ArrowLeft size={14} /> Back to My Orders
        </Link>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Download Invoice (Phase C10) */}
          <button
            onClick={handleDownloadInvoice}
            disabled={downloadingInvoice}
            className="btn btn-secondary"
            style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.85rem' }}
          >
            {downloadingInvoice ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Generating Invoice...
              </>
            ) : (
              <>
                <FileDown size={14} color="var(--color-primary)" /> Download Invoice
              </>
            )}
          </button>

          {isCancellable && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="btn btn-danger-outline"
              style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.85rem' }}
            >
              <Ban size={14} /> Cancel Order
            </button>
          )}

          {isReturnEligible && (
            <button
              onClick={() => setShowReturnModal(true)}
              className="btn btn-secondary"
              style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.85rem' }}
            >
              <RotateCcw size={14} color="var(--color-primary)" /> Request Return / Refund
            </button>
          )}
        </div>
      </div>

      {/* Invoice Download Error Toast */}
      {invoiceError && (
        <div
          className="fade-in"
          style={{
            backgroundColor: 'var(--color-danger-subtle)',
            border: '1px solid rgba(211, 47, 47, 0.3)',
            color: 'var(--color-danger)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-xs)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.875rem',
            fontWeight: '600',
          }}
        >
          <AlertCircle size={20} />
          <div>{invoiceError}</div>
        </div>
      )}

      {/* Cancellation Success Toast */}
      {cancelSuccessMsg && (
        <div
          className="fade-in"
          style={{
            backgroundColor: 'var(--color-discount-subtle)',
            border: '1px solid rgba(56, 142, 60, 0.3)',
            color: 'var(--color-discount)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-xs)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.875rem',
            fontWeight: '600',
          }}
        >
          <CheckCircle2 size={20} />
          <div>{cancelSuccessMsg}</div>
        </div>
      )}

      {/* Return Success Toast */}
      {returnSuccessMsg && (
        <div
          className="fade-in"
          style={{
            backgroundColor: 'var(--color-discount-subtle)',
            border: '1px solid rgba(56, 142, 60, 0.3)',
            color: 'var(--color-discount)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-xs)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.875rem',
            fontWeight: '600',
          }}
        >
          <CheckCircle2 size={20} />
          <div>{returnSuccessMsg}</div>
        </div>
      )}

      {/* Return Status Banner if already returned */}
      {returnEligibility?.alreadyReturned && returnEligibility.activeReturn && (
        <div
          className="fade-in"
          style={{
            backgroundColor: 'var(--color-primary-subtle)',
            border: '1px solid rgba(40, 116, 240, 0.3)',
            color: 'var(--color-text-primary)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-xs)',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.65rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <RotateCcw size={20} color="var(--color-primary)" />
            <div>
              <strong style={{ fontSize: '0.875rem' }}>Return #{returnEligibility.activeReturn.id} is {returnEligibility.activeReturn.status}</strong>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                {returnEligibility.activeReturn.status === 'COMPLETED'
                  ? `Refund of ${formatPrice(returnEligibility.activeReturn.refundAmount)} processed successfully`
                  : `Reason: ${returnEligibility.activeReturn.reason} · Refund Amount: ${formatPrice(returnEligibility.activeReturn.refundAmount)}`}
              </div>
            </div>
          </div>
          <Link to={ROUTES.CUSTOMER_RETURNS} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}>
            View in Returns
          </Link>
        </div>
      )}

      {/* Fresh Checkout Alerts */}
      {paymentQuery === 'success' && !cancelSuccessMsg && !returnSuccessMsg && (
        <div
          className="fade-in"
          style={{
            backgroundColor: 'var(--color-discount-subtle)',
            border: '1px solid rgba(56, 142, 60, 0.3)',
            color: 'var(--color-discount)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-xs)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.875rem',
            fontWeight: '600',
          }}
        >
          <CheckCircle2 size={20} />
          <div>
            Order #{order.id} placed &amp; payment processed successfully! We have confirmed your order.
          </div>
        </div>
      )}

      {paymentQuery === 'failed' && (
        <div
          className="fade-in"
          style={{
            backgroundColor: 'var(--color-danger-subtle)',
            border: '1px solid rgba(211, 47, 47, 0.3)',
            color: 'var(--color-danger)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-xs)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.875rem',
            fontWeight: '600',
          }}
        >
          <AlertCircle size={20} />
          <div>
            <strong>Payment Declined in Sandbox:</strong> {failureReasonQuery || 'The simulated card/PSP declined the transaction.'}
          </div>
        </div>
      )}

      {/* Header card with status timeline */}
      <div
        className="card"
        style={{
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
                Order #{order.id}
              </h1>
              <span
                style={{
                  color: isCancelled ? 'var(--color-danger)' : 'var(--color-primary)',
                  backgroundColor: isCancelled ? 'var(--color-danger-subtle)' : 'var(--color-primary-subtle)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {order.status}
              </span>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', margin: 0 }}>
              Placed on {formatDate(order.createdAt)} · Total Items: {order.totalItems}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.725rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '600' }}>
              Total Amount
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
              {formatPrice(order.totalAmount)}
            </div>
          </div>
        </div>

        {/* ── Status Timeline / Cancellation Banner ── */}
        <div style={{ marginTop: '1.5rem' }}>
          {isCancelled ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                backgroundColor: 'var(--color-danger-subtle)',
                padding: '1.15rem 1.35rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--color-danger)' }}>
                <XCircle size={20} style={{ flexShrink: 0 }} />
                <h4 style={{ fontWeight: '700', fontSize: '0.9375rem', margin: 0 }}>Order #{order.id} was Cancelled</h4>
              </div>
              
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', paddingLeft: '1.9rem', lineHeight: '1.5' }}>
                {order.cancellationReason && (
                  <p style={{ margin: '0 0 0.25rem' }}>
                    <strong>Reason:</strong> {order.cancellationReason}
                  </p>
                )}
                {order.cancelledAt && (
                  <p style={{ margin: '0 0 0.25rem', color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
                    Cancelled on: {formatDate(order.cancelledAt)}
                  </p>
                )}
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
                  Product stock has been restored. {isPaid ? 'For paid orders, refunds are managed under the Returns & Refunds policy.' : 'No charges apply.'}
                </p>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${TIMELINE_STEPS.length}, 1fr)`,
                gap: '0.5rem',
                position: 'relative',
              }}
            >
              {TIMELINE_STEPS.map((step, idx) => {
                const isCompleted = currentStatusIndex >= idx
                const isCurrent = currentStatusIndex === idx

                return (
                  <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: isCompleted ? (isCurrent ? 'var(--color-primary)' : 'var(--color-discount)') : 'var(--color-surface)',
                        border: `2px solid ${isCompleted ? 'transparent' : 'var(--color-border)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isCompleted ? '#ffffff' : 'var(--color-text-muted)',
                        fontSize: '0.8125rem',
                        fontWeight: '700',
                        marginBottom: '0.45rem',
                        boxShadow: isCurrent ? 'var(--shadow-sm)' : 'none',
                      }}
                    >
                      {isCompleted && !isCurrent ? <CheckCircle2 size={18} /> : idx + 1}
                    </div>

                    <span style={{ fontSize: '0.75rem', fontWeight: isCurrent ? '700' : '500', color: isCompleted ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Two Columns: Line Items + Shipping Address & Payment */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 360px',
          gap: '1.5rem',
          alignItems: 'start',
        }}
        className="account-layout-grid"
      >
        {/* Ordered Line Items */}
        <div
          className="card"
          style={{
            padding: '1.5rem',
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '1.25rem', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.85rem' }}>
            <Package size={18} color="var(--color-primary)" /> Order Items ({order.items.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {order.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '64px 1fr auto',
                  gap: '1rem',
                  alignItems: 'center',
                  paddingBottom: '1rem',
                  borderBottom: idx !== order.items.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                }}
              >
                <img
                  src={item.imageUrl || `https://placehold.co/64x64/ffffff/2874f0?text=P`}
                  alt={item.productName}
                  style={{ width: '64px', height: '64px', objectFit: 'contain', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '0.2rem', backgroundColor: 'var(--color-surface)' }}
                  onError={(e) => { e.target.src = `https://placehold.co/64x64/ffffff/2874f0?text=P` }}
                />

                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.2rem', color: 'var(--color-text-primary)', lineHeight: 1.35 }}>
                    {item.productName}
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Price: {formatPrice(item.unitPrice)} · Qty: {item.quantity}
                  </p>
                  {order.status === 'DELIVERED' && item.productId && (
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem', fontSize: '0.75rem' }}>
                      <Link
                        to={`/customer/products/${item.productId}#reviews-section`}
                        style={{ color: 'var(--color-primary)', fontWeight: '700', textDecoration: 'none' }}
                      >
                        Rate &amp; Review &rarr;
                      </Link>
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.9375rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                    {formatPrice(item.lineTotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Shipping Address Snapshot & Payment Summary */}
        {/* Right: Shipping Address Snapshot & Payment Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Shipping Address */}
          <div
            className="card"
            style={{
              padding: '1.5rem',
            }}
          >
            <h4 style={{ fontSize: '0.9375rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.65rem' }}>
              <MapPin size={17} color="var(--color-primary)" /> Shipping Address
            </h4>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
              <p style={{ fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
                {order.shippingAddress.fullName}
              </p>
              <p style={{ margin: '0 0 0.2rem' }}>{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}</p>
              <p style={{ margin: '0 0 0.2rem' }}>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}</p>
              <p style={{ margin: '0 0 0.4rem' }}>{order.shippingAddress.country}</p>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                Phone: {order.shippingAddress.phone}
              </p>
            </div>
          </div>

          {/* Payment Details & Breakdown Card */}
          <div
            className="card"
            style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              fontSize: '0.8125rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.75rem', marginBottom: '0.25rem' }}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CreditCard size={16} color="var(--color-primary)" /> Payment Breakdown
              </h4>
              {payment && renderPaymentBadge(payment.paymentStatus)}
            </div>

            {payment && (
              <div style={{ backgroundColor: 'var(--color-bg)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)', marginBottom: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
                  {renderPaymentMethodIcon(payment.paymentMethod)}
                  <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>
                    {payment.paymentMethod === 'CARD' ? `Card (•••• ${payment.cardLast4 || '4242'})` : payment.paymentMethod}
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                  Txn: {payment.transactionId}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>
                  Gateway: {payment.paymentGateway}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
              <span>Items Subtotal</span>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: '600' }}>
                {formatPrice(order.subtotalAmount || order.totalAmount)}
              </span>
            </div>
            {order.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-discount)' }}>
                <span>Coupon Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                <span style={{ fontWeight: '700' }}>-{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
              <span>Shipping Charges</span>
              <span style={{ color: 'var(--color-discount)', fontWeight: '700' }}>FREE</span>
            </div>
            <div style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '800' }}>
              <span>Total Amount</span>
              <span style={{ color: 'var(--color-primary)' }}>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>

        </div>

      </div>

      {/* ── Cancel Order Confirmation Modal ── */}
      {showCancelModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => !cancelling && setShowCancelModal(false)}
        >
          <div
            className="fade-in card"
            style={{
              maxWidth: '480px',
              width: '100%',
              overflow: 'hidden',
              padding: 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--color-border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)' }}>
                <Ban size={20} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, color: 'var(--color-text-primary)' }}>
                  Cancel Order #{order.id}
                </h3>
              </div>
              <button
                disabled={cancelling}
                onClick={() => setShowCancelModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cancelError && (
                <div
                  style={{
                    backgroundColor: 'var(--color-danger-subtle)',
                    color: 'var(--color-danger)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8125rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{cancelError}</span>
                </div>
              )}

              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.45 }}>
                Are you sure you want to cancel this order? Once cancelled, the items will be restored to inventory.
              </p>

              {/* Items Summary in Modal */}
              <div
                style={{
                  backgroundColor: 'var(--color-bg)',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border-subtle)',
                  fontSize: '0.8125rem',
                }}
              >
                <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>
                  Cancelling {order.totalItems} item{order.totalItems > 1 ? 's' : ''} (Total: {formatPrice(order.totalAmount)})
                </span>
              </div>

              {/* Reason Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.45rem' }}>
                  Reason for Cancellation *
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {CANCELLATION_REASONS.map((reason) => (
                    <label
                      key={reason}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        fontSize: '0.8125rem',
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                        padding: '0.45rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: selectedReason === reason ? 'var(--color-primary-subtle)' : 'transparent',
                        transition: 'background-color var(--transition-fast)',
                      }}
                    >
                      <input
                        type="radio"
                        name="cancellationReason"
                        value={reason}
                        checked={selectedReason === reason}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        disabled={cancelling}
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>

                {selectedReason === 'Other reason' && (
                  <div style={{ marginTop: '0.6rem' }}>
                    <textarea
                      placeholder="Please specify your reason..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      disabled={cancelling}
                      rows={2}
                      className="input"
                      style={{ width: '100%', fontSize: '0.8125rem', resize: 'none' }}
                    />
                  </div>
                )}
              </div>

              {/* Payment / Refund Advisory */}
            </div>

            {/* Modal Actions */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--color-border-subtle)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                backgroundColor: 'var(--color-bg)',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                style={{ fontSize: '0.8125rem' }}
              >
                Keep Order
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                {cancelling ? (
                  <>
                    <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Cancelling...
                  </>
                ) : (
                  <>
                    <Ban size={14} /> Confirm Cancellation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Request Return Confirmation Modal (Phase C8) ── */}
      {showReturnModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => !submittingReturn && setShowReturnModal(false)}
        >
          <div
            className="fade-in card"
            style={{
              maxWidth: '480px',
              width: '100%',
              overflow: 'hidden',
              padding: 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--color-border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                <RotateCcw size={20} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, color: 'var(--color-text-primary)' }}>
                  Request Return / Refund
                </h3>
              </div>
              <button
                disabled={submittingReturn}
                onClick={() => setShowReturnModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {returnError && (
                <div
                  style={{
                    backgroundColor: 'var(--color-danger-subtle)',
                    color: 'var(--color-danger)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8125rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{returnError}</span>
                </div>
              )}

              {/* Item Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.45rem' }}>
                  Items to Return *
                </label>
                <select
                  value={selectedReturnItemId}
                  onChange={(e) => setSelectedReturnItemId(e.target.value)}
                  disabled={submittingReturn}
                  className="input"
                  style={{ width: '100%', fontSize: '0.8125rem' }}
                >
                  <option value="">Entire Order ({order.items.length} items — {formatPrice(order.totalAmount)})</option>
                  {order.items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.productName} (Qty: {item.quantity} — {formatPrice(item.lineTotal)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Estimated Refund Snapshot */}
              <div
                style={{
                  backgroundColor: 'var(--color-bg)',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8125rem',
                }}
              >
                <span style={{ color: 'var(--color-text-secondary)' }}>Estimated Refund:</span>
                <span style={{ fontWeight: '800', color: 'var(--color-discount)', fontSize: '0.9375rem' }}>
                  {formatPrice(calculatedRefundPreview)}
                </span>
              </div>

              {/* Reason Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.45rem' }}>
                  Reason for Return *
                </label>
                <select
                  value={selectedReturnReason}
                  onChange={(e) => setSelectedReturnReason(e.target.value)}
                  disabled={submittingReturn}
                  className="input"
                  style={{ width: '100%', fontSize: '0.8125rem' }}
                >
                  {RETURN_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Return Note */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.45rem' }}>
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide any details about the issue..."
                  value={returnNote}
                  onChange={(e) => setReturnNote(e.target.value)}
                  disabled={submittingReturn}
                  className="input"
                  style={{ width: '100%', fontSize: '0.8125rem', resize: 'none' }}
                />
              </div>

              {/* Sandbox Policy Notice */}
            </div>

            {/* Modal Actions */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--color-border-subtle)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                backgroundColor: 'var(--color-bg)',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowReturnModal(false)}
                disabled={submittingReturn}
                style={{ fontSize: '0.8125rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmReturn}
                disabled={submittingReturn}
                style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                {submittingReturn ? (
                  <>
                    <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Submitting...
                  </>
                ) : (
                  <>
                    <RotateCcw size={14} /> Submit Return Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default CustomerOrderDetails



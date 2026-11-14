/**
 * Returns.jsx — Customer Returns & Refunds Tracking Lifecycle
 * Displays seller approval workflow, Razorpay refund status, and settlement timeline.
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Ban,
  Package,
  ArrowRight,
  Loader2,
  Info,
  Store,
  CreditCard,
  Building2,
  HelpCircle,
  XCircle
} from 'lucide-react'
import { getMyReturns, cancelReturn } from '@/services/returnService'
import { ROUTES } from '@/constants/routes'

const CustomerReturns = () => {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  const loadReturns = () => {
    setLoading(true)
    getMyReturns()
      .then((data) => {
        setReturns(data || [])
        setError(null)
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Failed to load return requests')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadReturns()
  }, [])

  const handleCancelReturn = async (returnId) => {
    if (!confirm('Are you sure you want to cancel this refund request?')) return
    setActionLoadingId(returnId)
    setSuccessMsg(null)
    try {
      await cancelReturn(returnId)
      setSuccessMsg('Refund request has been cancelled.')
      loadReturns()
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to cancel refund request')
    } finally {
      setActionLoadingId(null)
    }
  }

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(price || 0)

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Calculate current stage for the refund timeline (1 to 5)
  const getTimelineStage = (ret) => {
    if (ret.status === 'REJECTED' || ret.sellerApprovalStatus === 'SELLER_REJECTED') {
      return -1 // Rejected state
    }
    if (ret.status === 'CANCELLED') {
      return -2 // Cancelled
    }
    if (ret.status === 'COMPLETED' || ret.refund?.refundStatus === 'REFUNDED' || ret.refund?.refundStatus === 'SUCCESS') {
      return 5 // Refund Completed
    }
    if (ret.refund?.refundStatus === 'REFUND_PROCESSING' || ret.status === 'REFUND_INITIATED') {
      return 4 // Refund Initiated with Razorpay
    }
    if (ret.sellerApprovalStatus === 'SELLER_APPROVED' || ret.status === 'APPROVED') {
      return 3 // Seller Approved
    }
    // Default: Waiting for seller
    return 2 // Awaiting Seller Approval
  }

  return (
    <div className="fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RotateCcw size={22} style={{ color: 'var(--color-primary)' }} />
            My Refund &amp; Return Requests ({returns.length})
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0 0' }}>
            Track vendor review milestones, seller approvals, and Razorpay payment reversals.
          </p>
        </div>
        <Link to={ROUTES.CUSTOMER_ORDERS} className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
          Back to Orders
        </Link>
      </div>

      {/* Success / Error Banners */}
      {successMsg && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#059669', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.875rem' }}>
          <CheckCircle2 size={18} /> <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--color-danger)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.875rem' }}>
          <AlertCircle size={18} /> <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--color-text-secondary)' }}>
          <Loader2 size={32} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--color-primary)', margin: '0 auto 0.75rem' }} />
          <span>Loading your refund requests...</span>
        </div>
      ) : returns.length === 0 ? (
        <div className="card" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <RotateCcw size={28} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--color-text-primary)' }}>
            No Active Refund Requests
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', maxWidth: '440px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
            You haven't requested any refunds yet. You can initiate a refund request on any purchased order from your order details page.
          </p>
          <Link to={ROUTES.CUSTOMER_ORDERS} className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '0.6rem 1.5rem' }}>
            Go to My Orders
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {returns.map((ret) => {
            const stage = getTimelineStage(ret)
            const isPending = stage === 2 || ret.status === 'REQUESTED'
            const isRejected = stage === -1
            const isCompleted = stage === 5
            const isLoadingThis = actionLoadingId === ret.id

            return (
              <div key={ret.id} className="card" style={{ padding: '1.5rem' }}>
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.85rem', marginBottom: '1.15rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                        Refund Request #{ret.id}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-primary)', backgroundColor: 'var(--color-bg)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)' }}>
                        {ret.orderReference || `Order #${ret.orderId}`}
                      </span>
                      {ret.sellerName && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Store size={12} /> Seller: <strong>{ret.sellerName}</strong>
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                      Requested on {formatDate(ret.requestedAt)}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                      Refundable Amount
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-primary)' }}>
                      {formatPrice(ret.refundAmount)}
                    </div>
                  </div>
                </div>

                {/* Product & Reason Card */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.25rem', backgroundColor: 'var(--color-bg)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                  {ret.productImageUrl ? (
                    <img
                      src={ret.productImageUrl}
                      alt={ret.productName}
                      style={{ width: '48px', height: '48px', objectFit: 'contain', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff', padding: '0.2rem', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Package size={22} style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                      {ret.productName}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                      <strong>Reason for Refund:</strong> {ret.reason}
                    </div>
                    {ret.returnNote && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem', fontStyle: 'italic' }}>
                        "{ret.returnNote}"
                      </div>
                    )}
                  </div>
                </div>

                {/* ─── 5-STEP VISUAL REFUND TIMELINE ────────────────── */}
                {!isRejected && stage !== -2 && (
                  <div style={{ margin: '1.5rem 0 1.25rem', padding: '1rem 0.5rem', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '1rem', letterSpacing: '0.04em' }}>
                      Refund Status &amp; Gateway Lifecycle
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', position: 'relative' }}>
                      {/* Step 1: Requested */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.4rem' }}>
                          <CheckCircle2 size={16} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>Refund Requested</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Customer Claim</span>
                      </div>

                      {/* Step 2: Awaiting Seller */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: stage >= 2 ? (stage === 2 ? '#f59e0b' : 'var(--color-primary)') : 'var(--color-bg)', border: stage < 2 ? '2px solid var(--color-border)' : 'none', color: stage >= 2 ? '#fff' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.4rem' }}>
                          {stage > 2 ? <CheckCircle2 size={16} /> : <Clock size={15} />}
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: stage === 2 ? '800' : '600', color: stage === 2 ? '#b45309' : 'var(--color-text-primary)' }}>
                          Awaiting Seller
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Vendor Verification</span>
                      </div>

                      {/* Step 3: Seller Approved */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: stage >= 3 ? (stage === 3 ? '#2563eb' : 'var(--color-primary)') : 'var(--color-bg)', border: stage < 3 ? '2px solid var(--color-border)' : 'none', color: stage >= 3 ? '#fff' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.4rem' }}>
                          {stage > 3 ? <CheckCircle2 size={16} /> : <CheckCircle2 size={15} />}
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: stage === 3 ? '800' : '600', color: stage === 3 ? '#1d4ed8' : (stage > 3 ? 'var(--color-text-primary)' : 'var(--color-text-muted)') }}>
                          Seller Approved
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                          {ret.sellerApprovedAt ? 'Verified' : 'Mandatory Gate'}
                        </span>
                      </div>

                      {/* Step 4: Refund Initiated */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: stage >= 4 ? (stage === 4 ? '#7c3aed' : 'var(--color-primary)') : 'var(--color-bg)', border: stage < 4 ? '2px solid var(--color-border)' : 'none', color: stage >= 4 ? '#fff' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.4rem' }}>
                          {stage >= 5 ? <CheckCircle2 size={16} /> : <CreditCard size={14} />}
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: stage === 4 ? '800' : '600', color: stage === 4 ? '#6d28d9' : (stage >= 5 ? 'var(--color-text-primary)' : 'var(--color-text-muted)') }}>
                          Razorpay Initiated
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Gateway Call</span>
                      </div>

                      {/* Step 5: Completed */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: stage === 5 ? '#059669' : 'var(--color-bg)', border: stage !== 5 ? '2px solid var(--color-border)' : 'none', color: stage === 5 ? '#fff' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.4rem' }}>
                          <CheckCircle2 size={16} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: stage === 5 ? '800' : '600', color: stage === 5 ? '#047857' : 'var(--color-text-muted)' }}>
                          Refund Completed
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Settled to Source</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* REJECTED BANNER */}
                {isRejected && (
                  <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', marginBottom: '1.25rem', color: '#b91c1c' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800', fontSize: '0.875rem' }}>
                      <XCircle size={18} /> Refund Request Rejected by Seller
                    </div>
                    <div style={{ fontSize: '0.8125rem', marginTop: '0.35rem', color: 'var(--color-text-primary)' }}>
                      <strong>Seller Explanation:</strong> {ret.sellerRejectionReason || 'Item does not meet seller return policy requirements.'}
                    </div>
                    {ret.sellerRejectedAt && (
                      <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        Rejected on {formatDate(ret.sellerRejectedAt)}
                      </div>
                    )}
                  </div>
                )}

                {/* PENDING EXPLANATION */}
                {isPending && (
                  <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.8125rem', color: '#92400e' }}>
                    <strong>Awaiting Seller Review:</strong> Your request has been queued with seller <strong>{ret.sellerName || 'the assigned vendor'}</strong>. Once approved, the platform will dispatch the refund through Razorpay to your original payment method. No refund has been sent yet.
                  </div>
                )}

                {/* REFUND TRANSACTION DETAILS IF COMPLETED */}
                {isCompleted && ret.refund && (
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', marginBottom: '1rem', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: '800', color: '#047857' }}>
                          ✓ Razorpay Refund Processed Successfully
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                          {ret.refundDestination || 'Sent to original payment source (UPI/Card)'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        <div><strong>Refund ID:</strong> {ret.refund.providerRefundId || ret.refund.refundTransactionId}</div>
                        <div style={{ color: 'var(--color-text-muted)' }}>Status: {ret.refund.refundStatus}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.5rem' }}>
                  <Link to={`/customer/orders/${ret.orderId}`} style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    View Order Details <ArrowRight size={13} />
                  </Link>

                  {isPending && (
                    <button
                      onClick={() => handleCancelReturn(ret.id)}
                      disabled={isLoadingThis}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', color: 'var(--color-danger)' }}
                    >
                      {isLoadingThis ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />} Cancel Request
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CustomerReturns

/**
 * Returns.jsx — Customer Returns History & Sandbox Status Lifecycle (Phase C8)
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
  Zap,
  Info,
  ChevronRight
} from 'lucide-react'
import { getMyReturns, processSandboxApproval, cancelReturn } from '@/services/returnService'
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

  const handleSimulateApproval = async (returnId) => {
    setActionLoadingId(returnId)
    setSuccessMsg(null)
    try {
      await processSandboxApproval(returnId)
      setSuccessMsg('Return request approved & sandbox refund processed successfully!')
      loadReturns()
      setTimeout(() => setSuccessMsg(null), 5000)
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to process return approval')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleCancelReturn = async (returnId) => {
    if (!confirm('Are you sure you want to cancel this return request?')) return
    setActionLoadingId(returnId)
    setSuccessMsg(null)
    try {
      await cancelReturn(returnId)
      setSuccessMsg('Return request has been cancelled.')
      loadReturns()
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to cancel return request')
    } finally {
      setActionLoadingId(null)
    }
  }

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)

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

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'REQUESTED':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={12} /> REQUESTED
          </span>
        )
      case 'APPROVED':
        return (
          <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle2 size={12} /> APPROVED
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle2 size={12} /> RETURN COMPLETED
          </span>
        )
      case 'REJECTED':
        return (
          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <AlertCircle size={12} /> REJECTED
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Ban size={12} /> CANCELLED
          </span>
        )
      default:
        return <span className="badge badge-neutral">{status}</span>
    }
  }

  if (loading) {
    return (
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh', flexDirection: 'column', gap: '0.75rem', color: 'var(--color-text-secondary)' }}>
        <Loader2 size={32} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--color-primary)' }} />
        <span>Loading return requests...</span>
      </div>
    )
  }

  return (
    <div className="fade-in">
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
          <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
            Returns &amp; Replacements ({returns.length})
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0 0' }}>
            Track your return requests and simulated refund lifecycles
          </p>
        </div>
        <Link to={ROUTES.CUSTOMER_ORDERS} className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
          View Orders
        </Link>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div
          className="fade-in"
          style={{
            backgroundColor: 'var(--color-discount-subtle)',
            border: '1px solid rgba(22, 163, 74, 0.3)',
            color: 'var(--color-discount)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.875rem',
            fontWeight: '600',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="card fade-in" style={{ color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-subtle)', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {returns.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '4rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <RotateCcw size={28} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--color-text-primary)' }}>
            No Active Return Requests
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', maxWidth: '440px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
            Delivered items that you wish to return or replace can be initiated directly from your order details page.
          </p>
          <Link to={ROUTES.CUSTOMER_ORDERS} className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '0.6rem 1.5rem' }}>
            Go to My Orders
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {returns.map((ret) => {
            const isRequested = ret.status === 'REQUESTED'
            const isCompleted = ret.status === 'COMPLETED'
            const isLoadingThis = actionLoadingId === ret.id

            return (
              <div
                key={ret.id}
                className="card"
                style={{
                  padding: '1.5rem',
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <RotateCcw size={17} color="var(--color-primary)" />
                    <span style={{ fontWeight: '800', fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
                      Return #{ret.id}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      for <Link to={`/customer/orders/${ret.orderId}`} style={{ fontWeight: '700', color: 'var(--color-primary)', textDecoration: 'none' }}>Order #{ret.orderId}</Link>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    {renderStatusBadge(ret.status)}
                    <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                      {formatPrice(ret.refundAmount)}
                    </span>
                  </div>
                </div>

                {/* Return Content Body */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '1.25rem', alignItems: 'center' }} className="account-layout-grid">
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    {ret.productImageUrl && (
                      <img
                        src={ret.productImageUrl}
                        alt={ret.productName || 'Product'}
                        style={{ width: '56px', height: '56px', objectFit: 'contain', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '0.2rem', backgroundColor: 'var(--color-surface)' }}
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    )}
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: '0 0 0.25rem' }}>
                        {ret.productName || `Order #${ret.orderId}`}
                      </h4>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: '0 0 0.25rem' }}>
                        <strong>Reason:</strong> {ret.reason}
                      </p>
                      {ret.returnNote && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 0.25rem' }}>
                          Note: "{ret.returnNote}"
                        </p>
                      )}
                      <p style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', margin: 0 }}>
                        Requested on {formatDate(ret.requestedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Sandbox Flow */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                    {isRequested && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleSimulateApproval(ret.id)}
                          disabled={isLoadingThis}
                          className="btn btn-deal"
                          style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem' }}
                        >
                          {isLoadingThis ? (
                            <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
                          ) : (
                            <Zap size={13} />
                          )}
                          Simulate Approval &amp; Refund
                        </button>

                        <button
                          onClick={() => handleCancelReturn(ret.id)}
                          disabled={isLoadingThis}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                        >
                          Cancel Request
                        </button>
                      </div>
                    )}

                    {isCompleted && ret.refund && (
                      <div
                        style={{
                          backgroundColor: 'var(--color-discount-subtle)',
                          padding: '0.5rem 0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid rgba(22, 163, 74, 0.25)',
                          fontSize: '0.75rem',
                          color: 'var(--color-discount)',
                          textAlign: 'right',
                        }}
                      >
                        <div style={{ fontWeight: '700' }}>Refund Processed: {formatPrice(ret.refund.refundAmount)}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.675rem' }}>Txn: {ret.refund.refundTransactionId}</div>
                      </div>
                    )}
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

export default CustomerReturns

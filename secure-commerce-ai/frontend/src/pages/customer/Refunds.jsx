/**
 * Refunds.jsx — Customer Refunds History (Phase C8 Sandbox Refunds)
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  CreditCard,
  Smartphone,
  Landmark,
  Banknote,
  Loader2,
  ExternalLink,
  Info
} from 'lucide-react'
import { getMyRefunds } from '@/services/returnService'
import { ROUTES } from '@/constants/routes'

const CustomerRefunds = () => {
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    getMyRefunds()
      .then((data) => {
        setRefunds(data || [])
        setError(null)
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Failed to load refund transactions')
      })
      .finally(() => setLoading(false))
  }, [])

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

  const renderPaymentIcon = (method) => {
    switch (method) {
      case 'CARD':
        return <CreditCard size={16} color="var(--color-primary)" />
      case 'UPI':
        return <Smartphone size={16} color="var(--color-discount)" />
      case 'NET_BANKING':
        return <Landmark size={16} color="var(--color-deal)" />
      case 'COD':
        return <Banknote size={16} color="var(--color-text-secondary)" />
      default:
        return <CreditCard size={16} color="var(--color-primary)" />
    }
  }

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle2 size={12} /> REFUND PROCESSED
          </span>
        )
      case 'PENDING':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={12} /> PROCESSING
          </span>
        )
      case 'FAILED':
        return (
          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <AlertCircle size={12} /> FAILED
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
        <span>Loading refund history...</span>
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
            Refunds History ({refunds.length})
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0 0' }}>
            Authoritative audit trail of processed return refunds
          </p>
        </div>

        <Link to={ROUTES.CUSTOMER_RETURNS} className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
          View Returns
        </Link>
      </div>

      {error && (
        <div className="card fade-in" style={{ color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-subtle)', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {refunds.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '4rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--color-discount-subtle)', color: 'var(--color-discount)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <RefreshCw size={28} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--color-text-primary)' }}>
            No Refund Transactions
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', maxWidth: '440px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
            When an eligible return request is approved, your refund will be processed and recorded here automatically.
          </p>
          <Link to={ROUTES.CUSTOMER_ORDERS} className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '0.6rem 1.5rem' }}>
            View Delivered Orders
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {refunds.map((ref) => (
            <div
              key={ref.id}
              className="card"
              style={{
                padding: '1.5rem',
              }}
            >
              {/* Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.85rem', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {renderPaymentIcon(ref.paymentMethod)}
                  <span style={{ fontWeight: '800', fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
                    Refund #{ref.id}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    for <Link to={`/customer/orders/${ref.orderId}`} style={{ fontWeight: '700', color: 'var(--color-primary)', textDecoration: 'none' }}>Order #{ref.orderId}</Link> (Return #{ref.returnId})
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  {renderStatusBadge(ref.refundStatus)}
                  <span style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--color-discount)' }}>
                    +{formatPrice(ref.refundAmount)}
                  </span>
                </div>
              </div>

              {/* Transaction details row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                <div>
                  Method: <strong style={{ color: 'var(--color-text-primary)' }}>{ref.paymentMethod}</strong> · Processed on {formatDate(ref.processedAt || ref.createdAt)}
                </div>
                <div style={{ fontFamily: 'monospace', backgroundColor: 'var(--color-bg)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border-subtle)' }}>
                  Ref: {ref.refundTransactionId}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CustomerRefunds

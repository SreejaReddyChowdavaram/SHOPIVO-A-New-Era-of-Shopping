/**
 * Payments.jsx — Customer Payment History & Razorpay Gateway Logs.
 *
 * Displays transparent transaction details:
 * - Provider: RAZORPAY / OFFLINE (COD) / HISTORICAL_DEMO
 * - Gateway Instrument Method (card, upi, netbanking)
 * - Provider Payment ID / Order ID
 * - Signature Verification status (Audit flag, never raw signatures)
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Smartphone,
  Landmark,
  Banknote,
  Loader2,
  ExternalLink,
  ShieldAlert,
  Info
} from 'lucide-react'
import { getMyPayments } from '@/services/paymentService'
import { ROUTES } from '@/constants/routes'

const CustomerPayments = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    getMyPayments()
      .then((data) => {
        setPayments(data || [])
        setError(null)
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Failed to load payment transaction history')
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

  const renderPaymentIcon = (method, provider) => {
    if (provider === 'OFFLINE' || method === 'COD') {
      return <Banknote size={16} color="var(--color-text-secondary)" />
    }
    const cleanMethod = (method || '').toUpperCase()
    if (cleanMethod.includes('UPI')) {
      return <Smartphone size={16} color="var(--color-discount)" />
    }
    if (cleanMethod.includes('BANK')) {
      return <Landmark size={16} color="var(--color-deal)" />
    }
    return <CreditCard size={16} color="var(--color-primary)" />
  }

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle2 size={12} /> SUCCESS
          </span>
        )
      case 'FAILED':
        return (
          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <AlertCircle size={12} /> FAILED
          </span>
        )
      case 'INITIATED':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={12} /> INITIATED
          </span>
        )
      case 'REFUND_REQUESTED':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={12} /> REFUND REQUESTED
          </span>
        )
      case 'REFUND_PROCESSING':
        return (
          <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }}>
            <RotateCcw size={12} /> REFUND PROCESSING
          </span>
        )
      case 'REFUNDED':
        return (
          <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <RotateCcw size={12} /> REFUNDED
          </span>
        )
      default:
        return <span className="badge badge-neutral">{status}</span>
    }
  }

  return (
    <div className="fade-in" style={{ paddingBottom: '2rem' }}>
      
      {/* Header */}
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
            Payment History &amp; Transactions
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0 0 0' }}>
            Real-time ledger of your Razorpay online payments and Cash on Delivery orders.
          </p>
        </div>

        <span className="badge badge-neutral" style={{ fontSize: '0.725rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <ShieldCheck size={14} color="var(--color-primary)" /> Razorpay Secured
        </span>
      </div>

      {/* Error alert */}
      {error && (
        <div
          className="fade-in"
          style={{
            backgroundColor: 'var(--color-danger-subtle)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: 'var(--color-danger)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem',
            fontSize: '0.8125rem',
            fontWeight: '600',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Transaction Table / Cards */}
      <div
        className="card"
        style={{
          overflow: 'hidden',
          padding: 0,
        }}
      >
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={18} color="var(--color-primary)" /> Transaction Logs ({payments.length})
          </h2>
        </div>

        {loading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <Loader2 size={28} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--color-primary)' }} />
            <span>Loading payment records...</span>
          </div>
        ) : payments.length === 0 ? (
          <div style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--color-text-muted)' }}>
              <CreditCard size={28} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
              No Payment Transactions Yet
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
              When you complete checkout for orders, your payment transactions will be recorded here.
            </p>
            <Link to={ROUTES.CUSTOMER_PRODUCTS} className="btn btn-primary" style={{ fontSize: '0.8125rem', padding: '0.55rem 1.25rem' }}>
              Browse Products
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--color-border-subtle)', textAlign: 'left', color: 'var(--color-text-secondary)' }}>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Date &amp; Time</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Provider &amp; Txn ID</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Order</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Method</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Amount</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Status &amp; Verification</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background-color var(--transition-fast)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                      {formatDate(p.createdAt)}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '0.15rem 0.4rem', borderRadius: 'var(--radius-sm)', backgroundColor: p.provider === 'RAZORPAY' ? 'rgba(37,99,235,0.1)' : 'var(--color-surface)', color: p.provider === 'RAZORPAY' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                          {p.provider || 'RAZORPAY'}
                        </span>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-primary)' }}>
                        {p.providerPaymentId || p.transactionId}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <Link
                        to={`/customer/orders/${p.orderId}`}
                        style={{ color: 'var(--color-primary)', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
                      >
                        Order #{p.orderId} <ExternalLink size={12} />
                      </Link>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        {renderPaymentIcon(p.paymentMethod, p.provider)}
                        <span style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>
                          {p.gatewayMethod ? p.gatewayMethod.toUpperCase() : (p.paymentMethod === 'CARD' ? `Card (•••• ${p.cardLast4 || '4242'})` : p.paymentMethod)}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: '800', color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                      {formatPrice(p.amount)}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {renderStatusBadge(p.paymentStatus)}
                        {p.providerSignatureVerified && (
                          <span style={{ fontSize: '0.6875rem', fontWeight: '700', color: '#16a34a', backgroundColor: 'rgba(22,163,74,0.1)', padding: '0.15rem 0.4rem', borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <CheckCircle2 size={10} /> Verified
                          </span>
                        )}
                      </div>
                      {p.refundProviderId && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                          Refund: {p.refundProviderId}
                        </div>
                      )}
                      {p.failureReason && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-danger)', marginTop: '0.25rem', maxWidth: '200px' }}>
                          {p.failureReason}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}

export default CustomerPayments

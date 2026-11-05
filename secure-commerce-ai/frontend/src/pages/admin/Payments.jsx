/**
 * Payments.jsx — Platform Payments & Financial Transactions Oversight
 * Route: /admin/payments
 * Layout: AdminLayout
 *
 * Dedicated admin console for monitoring payment transactions,
 * gateway settlements (Razorpay / COD), HMAC signature audits, and refund status.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Search,
  RotateCcw,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
  Calendar,
  ShieldCheck,
  Smartphone,
  Landmark,
  Banknote,
  X,
  Check,
  ShieldAlert,
} from 'lucide-react'
import { getAdminPayments } from '@/services/paymentService'

const PAYMENT_STATUS_FILTERS = [
  { id: '', label: 'All Transactions' },
  { id: 'SUCCESS', label: 'Success / Paid' },
  { id: 'INITIATED', label: 'Initiated' },
  { id: 'REFUND_REQUESTED', label: 'Refund Requested' },
  { id: 'REFUND_PROCESSING', label: 'Refund Processing' },
  { id: 'REFUNDED', label: 'Refunded' },
  { id: 'FAILED', label: 'Failed' },
]

const Payments = () => {
  const navigate = useNavigate()

  const [payments, setPayments] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Selected payment for audit modal
  const [inspectingPayment, setInspectingPayment] = useState(null)

  const fetchPayments = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAdminPayments({ page, size: 20 })
      setPayments(data?.content || [])
      setTotalPages(data?.totalPages || 1)
      setTotalElements(data?.totalElements || 0)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to retrieve payment records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [page])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setSearchQuery(searchInput.trim())
  }

  const handleResetSearch = () => {
    setSearchInput('')
    setSearchQuery('')
    setSelectedStatus('')
  }

  const formatCurrency = (amount) => {
    const num = Number(amount) || 0
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num)
  }

  const formatDate = (isoString) => {
    if (!isoString) return '—'
    return new Date(isoString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Filtered payments (client-side filter on current page)
  const filteredPayments = payments.filter((p) => {
    if (selectedStatus && p.paymentStatus !== selectedStatus) {
      return false
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchesOrder = p.orderId && String(p.orderId).includes(q)
      const matchesTxn = p.transactionId && p.transactionId.toLowerCase().includes(q)
      const matchesProviderOrder = p.providerOrderId && p.providerOrderId.toLowerCase().includes(q)
      const matchesProviderPay = p.providerPaymentId && p.providerPaymentId.toLowerCase().includes(q)
      const matchesRefund = p.refundProviderId && p.refundProviderId.toLowerCase().includes(q)
      if (!matchesOrder && !matchesTxn && !matchesProviderOrder && !matchesProviderPay && !matchesRefund) {
        return false
      }
    }
    return true
  })

  // Metrics calculation
  const totalVolume = payments
    .filter((p) => p.paymentStatus === 'SUCCESS' || p.paymentStatus === 'REFUNDED')
    .reduce((acc, p) => acc + (Number(p.amount) || 0), 0)

  const successCount = payments.filter((p) => p.paymentStatus === 'SUCCESS').length
  const refundCount = payments.filter((p) => p.paymentStatus === 'REFUNDED' || p.paymentStatus === 'REFUND_PROCESSING').length
  const failedCount = payments.filter((p) => p.paymentStatus === 'FAILED').length

  const renderPaymentIcon = (paymentMethod, gatewayMethod) => {
    if (paymentMethod === 'COD') {
      return <Banknote size={16} color="var(--color-text-secondary)" />
    }
    const gw = (gatewayMethod || '').toLowerCase()
    if (gw.includes('upi')) {
      return <Smartphone size={16} color="var(--color-discount)" />
    }
    if (gw.includes('bank') || gw.includes('netbanking')) {
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
      case 'INITIATED':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={12} /> INITIATED
          </span>
        )
      case 'REFUND_REQUESTED':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={12} /> REFUND REQ
          </span>
        )
      case 'REFUND_PROCESSING':
        return (
          <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'rgba(14, 165, 233, 0.15)', color: '#0284c7' }}>
            <RotateCcw size={12} /> PROCESSING
          </span>
        )
      case 'REFUNDED':
        return (
          <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <RotateCcw size={12} /> REFUNDED
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

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CreditCard size={24} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
              Payments &amp; Transactions Audit
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.925rem' }}>
            Authoritative ledger of online gateway settlements, Razorpay HMAC verification, and gateway refunds.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={fetchPayments}
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Error Alert ── */}
      {error && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.9rem',
          }}
        >
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Metric Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
              PROCESSED VOLUME
            </span>
            <DollarSign size={18} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#10b981' }}>
            {formatCurrency(totalVolume)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>Successful transactions on page</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
              TOTAL TRANSACTIONS
            </span>
            <CreditCard size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
            {totalElements}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>All-time payment records</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
              CAPTURED SUCCESS
            </span>
            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
            {successCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>Fully settled payments</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
              REFUNDS / CHARGEBACKS
            </span>
            <RotateCcw size={18} style={{ color: '#0ea5e9' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0ea5e9' }}>
            {refundCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>Processed or pending refunds</span>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {PAYMENT_STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedStatus(f.id)}
              className={`btn ${selectedStatus === f.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                fontSize: '0.8125rem',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', minWidth: '280px', flex: 1, maxWidth: '450px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.875rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-disabled)',
              }}
            />
            <input
              type="text"
              className="input"
              placeholder="Search Order #, pay_id, or refund_id..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '100%', fontSize: '0.875rem' }}
            />
          </div>
          <button type="submit" className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.875rem' }}>
            Search
          </button>
          {(searchQuery || selectedStatus) && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResetSearch}
              style={{ padding: '0.45rem 0.65rem', fontSize: '0.8125rem' }}
              title="Clear filters"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* ── Payments Transactions Table ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-raised)',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <th style={{ padding: '1rem 1.25rem' }}>Order / Txn</th>
                <th style={{ padding: '1rem 1.25rem' }}>Provider &amp; Method</th>
                <th style={{ padding: '1rem 1.25rem' }}>Provider IDs</th>
                <th style={{ padding: '1rem 1.25rem' }}>Amount</th>
                <th style={{ padding: '1rem 1.25rem' }}>Status</th>
                <th style={{ padding: '1rem 1.25rem' }}>HMAC Sig</th>
                <th style={{ padding: '1rem 1.25rem' }}>Refund Ref</th>
                <th style={{ padding: '1rem 1.25rem' }}>Timestamp</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Audit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-disabled)' }}>
                    <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>Loading payment audit records...</p>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    <CreditCard size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.35 }} />
                    <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-text-primary)' }}>
                      No payment transactions match criteria
                    </p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--color-text-disabled)' }}>
                      {searchQuery || selectedStatus ? 'Try adjusting your search query or status filter.' : 'No transactions recorded yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Order / Transaction */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: '700', color: 'var(--color-primary)', fontSize: '0.875rem' }}>
                          ORD-#{String(p.orderId || '—').padStart(6, '0')}
                        </div>
                        <span style={{ fontSize: '0.725rem', color: 'var(--color-text-disabled)', fontFamily: 'monospace' }}>
                          ID: #{p.id}
                        </span>
                      </td>

                      {/* Provider & Method */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {renderPaymentIcon(p.paymentMethod, p.gatewayMethod)}
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>
                              {p.provider || 'RAZORPAY'}
                            </div>
                            <span style={{ fontSize: '0.725rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                              {p.gatewayMethod || (p.paymentMethod === 'COD' ? 'CASH' : 'ONLINE')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Provider IDs */}
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.775rem', fontFamily: 'monospace' }}>
                        <div style={{ color: 'var(--color-text-primary)' }}>
                          {p.providerPaymentId ? p.providerPaymentId : '—'}
                        </div>
                        {p.providerOrderId && (
                          <div style={{ color: 'var(--color-text-disabled)', fontSize: '0.725rem' }}>
                            {p.providerOrderId}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '1rem 1.25rem', fontWeight: '700', fontSize: '0.925rem', color: 'var(--color-text-primary)' }}>
                        {formatCurrency(p.amount)}
                      </td>

                      {/* Payment Status */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        {renderStatusBadge(p.paymentStatus)}
                      </td>

                      {/* HMAC Signature Verified */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        {p.providerSignatureVerified ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.725rem',
                              fontWeight: '700',
                              color: '#10b981',
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              padding: '0.2rem 0.5rem',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            <Check size={12} /> Verified
                          </span>
                        ) : p.paymentMethod === 'COD' ? (
                          <span style={{ fontSize: '0.725rem', color: 'var(--color-text-disabled)' }}>N/A (COD)</span>
                        ) : (
                          <span style={{ fontSize: '0.725rem', color: 'var(--color-text-disabled)' }}>Pending</span>
                        )}
                      </td>

                      {/* Refund Reference */}
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.775rem' }}>
                        {p.refundProviderId ? (
                          <span
                            style={{
                              display: 'inline-block',
                              fontFamily: 'monospace',
                              fontSize: '0.725rem',
                              color: 'var(--color-primary)',
                              backgroundColor: 'var(--color-primary-subtle)',
                              padding: '0.2rem 0.4rem',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            {p.refundProviderId}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-disabled)' }}>—</span>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        {formatDate(p.createdAt)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setInspectingPayment(p)}
                          title="View Payment Audit Details"
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <span>Details</span>
                          <ExternalLink size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div
            style={{
              padding: '1rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-raised)',
            }}
          >
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              Showing Page {page + 1} of {totalPages} ({totalElements} total records)
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                disabled={page === 0}
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8125rem' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="btn btn-secondary"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((prev) => prev + 1)}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8125rem' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Transaction Inspection Modal ── */}
      {inspectingPayment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '560px',
              width: '100%',
              padding: '1.75rem',
              borderRadius: 'var(--radius-lg)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={22} color="var(--color-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>
                  Transaction Audit Record #{inspectingPayment.id}
                </h3>
              </div>
              <button
                onClick={() => setInspectingPayment(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Shopivo Order ID:</span>
                <span style={{ fontWeight: '700' }}>ORD-#{String(inspectingPayment.orderId).padStart(6, '0')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Payment Status:</span>
                <span>{renderStatusBadge(inspectingPayment.paymentStatus)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Settled Amount:</span>
                <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>{formatCurrency(inspectingPayment.amount)} INR</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Payment Provider:</span>
                <span style={{ fontWeight: '600' }}>{inspectingPayment.provider || 'RAZORPAY'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Gateway Instrument:</span>
                <span style={{ fontWeight: '600', textTransform: 'uppercase' }}>{inspectingPayment.gatewayMethod || inspectingPayment.paymentMethod}</span>
              </div>
              {inspectingPayment.upiIdSnapshot && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>UPI VPA / App:</span>
                  <span style={{ fontFamily: 'monospace' }}>{inspectingPayment.upiIdSnapshot}</span>
                </div>
              )}
              {inspectingPayment.cardLast4 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Card Last 4:</span>
                  <span style={{ fontFamily: 'monospace' }}>•••• {inspectingPayment.cardLast4}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Provider Order ID:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{inspectingPayment.providerOrderId || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Provider Payment ID:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{inspectingPayment.providerPaymentId || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>HMAC Verification:</span>
                <span>{inspectingPayment.providerSignatureVerified ? '✅ Cryptographically Verified' : 'N/A'}</span>
              </div>
              {inspectingPayment.refundProviderId && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Refund Provider ID:</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--color-primary)' }}>{inspectingPayment.refundProviderId}</span>
                </div>
              )}
              {inspectingPayment.failureReason && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-danger)' }}>Failure Reason:</span>
                  <span style={{ color: 'var(--color-danger)' }}>{inspectingPayment.failureReason}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Created At:</span>
                <span>{formatDate(inspectingPayment.createdAt)}</span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setInspectingPayment(null)}>
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Payments

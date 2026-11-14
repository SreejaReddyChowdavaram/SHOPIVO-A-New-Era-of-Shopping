import React, { useState, useEffect } from 'react'
import {
  RotateCcw, Search, Filter, CheckCircle2, XCircle, Clock,
  AlertCircle, Eye, ShieldCheck, DollarSign, Store,
  Package, Calendar, User, ArrowUpRight, Loader2, RefreshCw
} from 'lucide-react'
import { getAdminRefunds } from '@/services/returnService'

const STATUS_FILTERS = [
  { label: 'All Platform Refunds', value: 'ALL' },
  { label: 'Pending Seller Approval', value: 'PENDING_SELLER_APPROVAL' },
  { label: 'Seller Approved', value: 'SELLER_APPROVED' },
  { label: 'Seller Rejected', value: 'SELLER_REJECTED' },
  { label: 'Refunded (Completed)', value: 'COMPLETED' },
]

export const AdminRefunds = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    totalRefundRequests: 0,
    pendingSellerApproval: 0,
    approvedRefunds: 0,
    rejectedRefunds: 0,
    successfullyRefunded: 0,
    requests: []
  })
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [error, setError] = useState(null)

  const loadRefunds = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getAdminRefunds({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
      })
      setData(res || {
        totalRefundRequests: 0,
        pendingSellerApproval: 0,
        approvedRefunds: 0,
        rejectedRefunds: 0,
        successfullyRefunded: 0,
        requests: []
      })
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load platform refunds')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRefunds()
  }, [statusFilter])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    loadRefunds()
  }

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(price || 0)

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (req) => {
    const s = req.sellerApprovalStatus || req.status
    if (req.status === 'COMPLETED' || req.status === 'REFUNDED') {
      return (
        <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
          <CheckCircle2 size={12} /> Successfully Refunded
        </span>
      )
    }
    if (s === 'SELLER_APPROVED' || req.status === 'APPROVED') {
      return (
        <span className="badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.3)', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
          <CheckCircle2 size={12} /> Seller Approved
        </span>
      )
    }
    if (s === 'SELLER_REJECTED' || req.status === 'REJECTED') {
      return (
        <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
          <XCircle size={12} /> Rejected by Seller
        </span>
      )
    }
    return (
      <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
        <Clock size={12} /> Pending Seller Approval
      </span>
    )
  }

  return (
    <div className="fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <RotateCcw size={24} style={{ color: 'var(--color-primary)' }} />
            Platform Refund Monitoring & Audit
          </h1>
          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Supervise all multi-vendor return requests, seller approval states, and authoritative Razorpay refund settlements.
          </p>
        </div>
        <button
          onClick={loadRefunds}
          disabled={loading}
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--color-danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem' }}>
          <AlertCircle size={16} /> <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div className="card" style={{ padding: '1.1rem 1.25rem', borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
            Total Platform Claims
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
            {data.totalRefundRequests}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
            Across all vendors
          </div>
        </div>

        <div className="card" style={{ padding: '1.1rem 1.25rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#b45309', marginBottom: '0.25rem' }}>
            Awaiting Seller Approval
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#b45309' }}>
            {data.pendingSellerApproval}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
            Pending vendor review
          </div>
        </div>

        <div className="card" style={{ padding: '1.1rem 1.25rem', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#1d4ed8', marginBottom: '0.25rem' }}>
            Seller Approved
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#1d4ed8' }}>
            {data.approvedRefunds}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
            Authorized for refund
          </div>
        </div>

        <div className="card" style={{ padding: '1.1rem 1.25rem', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#b91c1c', marginBottom: '0.25rem' }}>
            Seller Rejected
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#b91c1c' }}>
            {data.rejectedRefunds}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
            Declined claims
          </div>
        </div>

        <div className="card" style={{ padding: '1.1rem 1.25rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#047857', marginBottom: '0.25rem' }}>
            Completed Refunds
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#047857' }}>
            {data.successfullyRefunded}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
            Settled via gateway
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                style={{
                  padding: '0.35rem 0.8rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8125rem',
                  fontWeight: statusFilter === f.value ? '700' : '500',
                  border: statusFilter === f.value ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: statusFilter === f.value ? 'var(--color-primary-subtle, rgba(15, 143, 107, 0.1))' : 'var(--color-bg)',
                  color: statusFilter === f.value ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="Search Order, Customer, Reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input"
                style={{ paddingLeft: '2rem', fontSize: '0.8125rem', width: '240px' }}
              />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ fontSize: '0.8125rem', padding: '0.4rem 0.8rem' }}>
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Requests Table */}
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--color-text-secondary)' }}>
            <Loader2 size={30} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--color-primary)', margin: '0 auto 0.75rem' }} />
            <span>Loading platform refund records...</span>
          </div>
        ) : data.requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--color-text-secondary)' }}>
            <RotateCcw size={36} style={{ color: 'var(--color-text-muted)', margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
              No refund requests found
            </h3>
            <p style={{ fontSize: '0.8125rem', margin: 0 }}>
              {statusFilter !== 'ALL' || searchQuery ? 'No records match your selected filter.' : 'No refund requests have been submitted across the platform.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-raised, var(--color-bg))', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Order / Ref</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Customer</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Seller</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Product</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Refund Amount</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Requested Date</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Approval Status</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.requests.map((req) => (
                  <tr
                    key={req.id}
                    style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised, rgba(0,0,0,0.02))'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>
                        #{req.id}
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                        {req.orderReference || `Order #${req.orderId}`}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>
                        {req.customerName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {req.customerEmail || `ID: ${req.customerId}`}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Store size={13} style={{ color: 'var(--color-text-muted)' }} />
                        <span>{req.sellerName || 'Platform Vendor'}</span>
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>
                        Seller #{req.sellerId || '—'}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', maxWidth: '200px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {req.productName}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>
                        Qty: {req.quantity || 1}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: '800', color: 'var(--color-primary)', fontSize: '0.9375rem' }}>
                        {formatPrice(req.refundAmount)}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-secondary)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {formatDate(req.requestedAt)}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      {getStatusBadge(req)}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Eye size={13} /> Audit Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── AUDIT DETAILS MODAL ──────────────────────────────── */}
      {selectedRequest && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card fade-in" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} style={{ color: 'var(--color-primary)' }} />
                Platform Refund Audit #{selectedRequest.id}
              </h2>
              <button onClick={() => setSelectedRequest(null)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8125rem' }}>
                ✕
              </button>
            </div>

            {/* Core Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem', marginBottom: '1.25rem', backgroundColor: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Order Reference</span>
                <div style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--color-primary)' }}>{selectedRequest.orderReference}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Assigned Seller</span>
                <div style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>{selectedRequest.sellerName || 'Platform'}</div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>Seller ID #{selectedRequest.sellerId}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Customer</span>
                <div style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>{selectedRequest.customerName}</div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>{selectedRequest.customerEmail}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Refund Amount</span>
                <div style={{ fontWeight: '800', color: 'var(--color-primary)', fontSize: '1.1rem' }}>{formatPrice(selectedRequest.refundAmount)}</div>
              </div>
            </div>

            {/* Seller Approval Status Box */}
            <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                Seller Approval Audit Trail
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                <span><strong>Status:</strong> {selectedRequest.sellerApprovalStatus || 'PENDING_SELLER_APPROVAL'}</span>
                <span>
                  {selectedRequest.sellerApprovedAt && (
                    <span style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle2 size={12} /> Approved {formatDate(selectedRequest.sellerApprovedAt)}
                    </span>
                  )}
                  {selectedRequest.sellerRejectedAt && (
                    <span style={{ color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <XCircle size={12} /> Rejected {formatDate(selectedRequest.sellerRejectedAt)}
                    </span>
                  )}
                </span>
              </div>
              {selectedRequest.sellerRejectionReason && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: 'var(--radius-sm)', color: 'var(--color-danger)', fontSize: '0.775rem' }}>
                  <strong>Rejection Reason:</strong> {selectedRequest.sellerRejectionReason}
                </div>
              )}
            </div>

            {/* Gateway Settlement Record */}
            <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', backgroundColor: 'rgba(15, 143, 107, 0.06)', border: '1px solid rgba(15, 143, 107, 0.2)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Razorpay Platform Settlement Record
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                {selectedRequest.refundDestination || 'Refunds are processed through Razorpay to the original payment method used during checkout.'}
              </div>
              {selectedRequest.refund ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(15, 143, 107, 0.25)' }}>
                  <div><strong>Razorpay Refund ID:</strong> {selectedRequest.refund.providerRefundId || 'rfnd_simulated'}</div>
                  <div><strong>Internal Txn:</strong> {selectedRequest.refund.refundTransactionId}</div>
                  <div><strong>Settlement Status:</strong> {selectedRequest.refund.refundStatus}</div>
                  <div><strong>Payment Mode:</strong> {selectedRequest.gatewayMode || 'TEST'}</div>
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: '#b45309', fontStyle: 'italic' }}>
                  No gateway refund transaction has been dispatched yet (pending seller approval).
                </div>
              )}
            </div>

            {/* Close */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedRequest(null)} className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminRefunds


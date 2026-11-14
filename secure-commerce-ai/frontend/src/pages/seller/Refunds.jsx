import React, { useState, useEffect } from 'react'
import {
  RotateCcw, Search, Filter, CheckCircle2, XCircle, Clock,
  AlertCircle, ChevronRight, Eye, ShieldCheck, DollarSign,
  Package, Calendar, User, ArrowUpRight, Loader2, RefreshCw
} from 'lucide-react'
import { getSellerRefunds, approveSellerRefund, rejectSellerRefund } from '@/services/returnService'

const STATUS_FILTERS = [
  { label: 'All Requests', value: 'ALL' },
  { label: 'Pending Approval', value: 'PENDING_SELLER_APPROVAL' },
  { label: 'Approved', value: 'SELLER_APPROVED' },
  { label: 'Rejected', value: 'SELLER_REJECTED' },
  { label: 'Refunded', value: 'COMPLETED' },
]

export const SellerRefunds = () => {
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

  // Action dialogs
  const [approveTarget, setApproveTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [actionSuccess, setActionSuccess] = useState(null)

  const loadRefunds = async () => {
    setLoading(true)
    setActionError(null)
    try {
      const res = await getSellerRefunds({
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
      setActionError(err.response?.data?.message || err.message || 'Failed to load refund requests')
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

  const handleApproveConfirm = async () => {
    if (!approveTarget) return
    setActionLoading(true)
    setActionError(null)
    try {
      await approveSellerRefund(approveTarget.id)
      setActionSuccess(`Refund request #${approveTarget.id} approved! Gateway refund initiated.`)
      setApproveTarget(null)
      loadRefunds()
      setTimeout(() => setActionSuccess(null), 5000)
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Failed to approve refund')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return
    if (!rejectReason.trim()) {
      setActionError('Please provide a specific rejection reason.')
      return
    }
    setActionLoading(true)
    setActionError(null)
    try {
      await rejectSellerRefund(rejectTarget.id, rejectReason.trim())
      setActionSuccess(`Refund request #${rejectTarget.id} rejected. Customer has been notified.`)
      setRejectTarget(null)
      setRejectReason('')
      loadRefunds()
      setTimeout(() => setActionSuccess(null), 5000)
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Failed to reject refund')
    } finally {
      setActionLoading(false)
    }
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
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <RotateCcw size={24} style={{ color: 'var(--color-primary)' }} />
            Seller Refund Requests
          </h1>
          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Review customer refund and return claims for your products. Seller approval is required before platform refund dispatch.
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

      {/* Success / Error Banners */}
      {actionSuccess && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#059669', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem' }}>
          <CheckCircle2 size={16} /> <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--color-danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem' }}>
          <AlertCircle size={16} /> <span>{actionError}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div className="card" style={{ padding: '1.1rem 1.25rem', borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
            Total Refund Requests
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
            {data.totalRefundRequests}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
            All orders under your account
          </div>
        </div>

        <div className="card" style={{ padding: '1.1rem 1.25rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#b45309', marginBottom: '0.25rem' }}>
            Pending Seller Approval
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#b45309' }}>
            {data.pendingSellerApproval}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
            Awaiting your decision
          </div>
        </div>

        <div className="card" style={{ padding: '1.1rem 1.25rem', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#1d4ed8', marginBottom: '0.25rem' }}>
            Approved Refunds
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#1d4ed8' }}>
            {data.approvedRefunds}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
            Approved by seller
          </div>
        </div>

        <div className="card" style={{ padding: '1.1rem 1.25rem', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#b91c1c', marginBottom: '0.25rem' }}>
            Rejected Refunds
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#b91c1c' }}>
            {data.rejectedRefunds}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
            Declined with reason
          </div>
        </div>

        <div className="card" style={{ padding: '1.1rem 1.25rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#047857', marginBottom: '0.25rem' }}>
            Successfully Refunded
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#047857' }}>
            {data.successfullyRefunded}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
            Completed to customer source
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Status Pills */}
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

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="Search Order ID, Customer, Reason..."
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
            <span>Loading refund requests...</span>
          </div>
        ) : data.requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--color-text-secondary)' }}>
            <RotateCcw size={36} style={{ color: 'var(--color-text-muted)', margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
              No refund requests found
            </h3>
            <p style={{ fontSize: '0.8125rem', margin: 0 }}>
              {statusFilter !== 'ALL' || searchQuery ? 'No records match your selected filter.' : 'You do not have any pending or past refund requests.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-raised, var(--color-bg))', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Order / ID</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Customer</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Product</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Refund Amount</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Reason</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Requested Date</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.requests.map((req) => {
                  const isPending = req.sellerApprovalStatus === 'PENDING_SELLER_APPROVAL' || req.status === 'REQUESTED'
                  return (
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
                          {req.customerEmail || `Customer #${req.customerId}`}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', maxWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          {req.productImageUrl ? (
                            <img
                              src={req.productImageUrl}
                              alt={req.productName}
                              style={{ width: '34px', height: '34px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--color-border)', flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{ width: '34px', height: '34px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Package size={16} style={{ color: 'var(--color-text-muted)' }} />
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {req.productName}
                            </div>
                            <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>
                              Qty: {req.quantity || 1}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: '800', color: 'var(--color-primary)', fontSize: '0.9375rem' }}>
                          {formatPrice(req.refundAmount)}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', maxWidth: '200px' }}>
                        <div style={{ color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {req.reason}
                        </div>
                        {req.returnNote && (
                          <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            "{req.returnNote}"
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-secondary)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {formatDate(req.requestedAt)}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        {getStatusBadge(req)}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="btn btn-secondary"
                            title="View Details"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          >
                            <Eye size={13} /> Details
                          </button>

                          {isPending && (
                            <>
                              <button
                                onClick={() => setApproveTarget(req)}
                                className="btn btn-primary"
                                title="Approve Refund"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', backgroundColor: '#059669' }}
                              >
                                <CheckCircle2 size={13} /> Approve
                              </button>

                              <button
                                onClick={() => { setRejectTarget(req); setRejectReason('') }}
                                className="btn btn-secondary"
                                title="Reject Refund"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                              >
                                <XCircle size={13} /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── DETAILS MODAL ────────────────────────────────────── */}
      {selectedRequest && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card fade-in" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RotateCcw size={18} style={{ color: 'var(--color-primary)' }} />
                Refund Request #{selectedRequest.id}
              </h2>
              <button onClick={() => setSelectedRequest(null)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8125rem' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem', marginBottom: '1.25rem', backgroundColor: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Order Reference</span>
                <div style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--color-primary)' }}>{selectedRequest.orderReference}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Customer</span>
                <div style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>{selectedRequest.customerName}</div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>{selectedRequest.customerEmail}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Product</span>
                <div style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>{selectedRequest.productName}</div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>Qty: {selectedRequest.quantity || 1}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Refund Amount</span>
                <div style={{ fontWeight: '800', color: 'var(--color-primary)', fontSize: '1.1rem' }}>{formatPrice(selectedRequest.refundAmount)}</div>
              </div>
            </div>

            {/* Refund Reason */}
            <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Customer Refund Reason
              </div>
              <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                {selectedRequest.reason}
              </div>
              {selectedRequest.returnNote && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.35rem', fontStyle: 'italic' }}>
                  "{selectedRequest.returnNote}"
                </div>
              )}
            </div>

            {/* Rejection reason if rejected */}
            {selectedRequest.sellerRejectionReason && (
              <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Seller Rejection Reason
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                  {selectedRequest.sellerRejectionReason}
                </div>
                <div style={{ fontSize: '0.725rem', marginTop: '0.25rem', opacity: 0.8 }}>
                  Rejected on: {formatDate(selectedRequest.sellerRejectedAt)}
                </div>
              </div>
            )}

            {/* Gateway & Destination Info */}
            <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', backgroundColor: 'rgba(15, 143, 107, 0.06)', border: '1px solid rgba(15, 143, 107, 0.2)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Razorpay Settlement Destination
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                {selectedRequest.refundDestination || 'Refunds are processed through Razorpay to the original payment method used during checkout.'}
              </p>
              {selectedRequest.refund && (
                <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px dashed rgba(15, 143, 107, 0.2)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span><strong>Refund ID:</strong> {selectedRequest.refund.providerRefundId || selectedRequest.refund.refundTransactionId}</span>
                  <span><strong>Status:</strong> {selectedRequest.refund.refundStatus}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button onClick={() => setSelectedRequest(null)} className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
                Close
              </button>
              {(selectedRequest.sellerApprovalStatus === 'PENDING_SELLER_APPROVAL' || selectedRequest.status === 'REQUESTED') && (
                <>
                  <button
                    onClick={() => { const target = selectedRequest; setSelectedRequest(null); setApproveTarget(target) }}
                    className="btn btn-primary"
                    style={{ fontSize: '0.8125rem', backgroundColor: '#059669' }}
                  >
                    Approve Refund
                  </button>
                  <button
                    onClick={() => { const target = selectedRequest; setSelectedRequest(null); setRejectTarget(target); setRejectReason('') }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8125rem', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── APPROVE CONFIRMATION DIALOG ────────────────────── */}
      {approveTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card fade-in" style={{ maxWidth: '480px', width: '100%', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#059669' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--color-text-primary)' }}>
                  Approve Refund Request?
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Order {approveTarget.orderReference} • {formatPrice(approveTarget.refundAmount)}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
              By approving this refund, you confirm receipt or agreement to customer's return. The platform will automatically initiate the refund to the customer's original payment method via Razorpay.
            </p>

            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.8125rem' }}>
              <div><strong>Product:</strong> {approveTarget.productName}</div>
              <div><strong>Customer:</strong> {approveTarget.customerName}</div>
              <div><strong>Refund Amount:</strong> <span style={{ color: 'var(--color-primary)', fontWeight: '700' }}>{formatPrice(approveTarget.refundAmount)}</span></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setApproveTarget(null)}
                disabled={actionLoading}
                className="btn btn-secondary"
                style={{ fontSize: '0.8125rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveConfirm}
                disabled={actionLoading}
                className="btn btn-primary"
                style={{ fontSize: '0.8125rem', backgroundColor: '#059669', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Confirm & Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── REJECT DIALOG ──────────────────────────────────── */}
      {rejectTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card fade-in" style={{ maxWidth: '480px', width: '100%', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--color-danger)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <XCircle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--color-text-primary)' }}>
                  Reject Refund Request
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Order {rejectTarget.orderReference} • {formatPrice(rejectTarget.refundAmount)}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
              Please state why this refund request is being rejected. This explanation will be permanently recorded in the audit trail and sent to the customer.
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--color-text-primary)' }}>
                Rejection Reason (Required)
              </label>
              <textarea
                rows={3}
                placeholder="e.g., Item returned is missing original packaging, or claim submitted after eligible return window."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="input"
                style={{ width: '100%', fontSize: '0.8125rem', resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                disabled={actionLoading}
                className="btn btn-secondary"
                style={{ fontSize: '0.8125rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                disabled={actionLoading || !rejectReason.trim()}
                className="btn btn-primary"
                style={{ fontSize: '0.8125rem', backgroundColor: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SellerRefunds


/**
 * SellerVerification.jsx — Seller Verification & Merchant Compliance
 * Route: /admin/sellers/verification
 * Layout: AdminLayout
 *
 * Provides administrators with dedicated tools to review merchant onboarding,
 * verify business credentials, audit catalog readiness, and approve or suspend
 * merchant selling privileges on Shopivo.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  ShieldAlert,
  Store,
  Search,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Eye,
  Ban,
  Check,
  Package,
  ShoppingBag,
  Calendar,
  Mail,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import {
  getAdminSellersPaged,
  suspendSeller,
  activateSeller,
  getAdminSellerDetail,
} from '@/services/userService'

const STATUS_FILTERS = [
  { id: '', label: 'All Merchants' },
  { id: 'ACTIVE', label: 'Verified & Active' },
  { id: 'SUSPENDED', label: 'Suspended / Inactive' },
]

const SellerVerification = () => {
  const navigate = useNavigate()

  const [sellers, setSellers] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Filters & search
  const [selectedStatus, setSelectedStatus] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Action states
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmModal, setConfirmModal] = useState({ open: false, seller: null, action: null })
  const [detailModal, setDetailModal] = useState({ open: false, seller: null, loading: false })
  const [adminNote, setAdminNote] = useState('')

  // Metrics summary
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    suspended: 0,
    withProducts: 0,
  })

  const fetchSellers = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {
        page,
        size: 10,
        status: selectedStatus || undefined,
        search: searchQuery || undefined,
      }
      const data = await getAdminSellersPaged(params)
      const items = data.content || []
      setSellers(items)
      setTotalPages(data.totalPages || 1)
      setTotalElements(data.totalElements || 0)

      // Calculate stats from page and totals
      const verifiedCount = items.filter((s) => s.enabled).length
      const suspendedCount = items.filter((s) => !s.enabled).length
      const withProdCount = items.filter((s) => (s.totalProducts || 0) > 0).length

      setStats({
        total: data.totalElements || items.length,
        verified: selectedStatus === 'ACTIVE' ? data.totalElements : (selectedStatus === 'SUSPENDED' ? 0 : verifiedCount),
        suspended: selectedStatus === 'SUSPENDED' ? data.totalElements : (selectedStatus === 'ACTIVE' ? 0 : suspendedCount),
        withProducts: withProdCount,
      })
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load merchant verification roster.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSellers()
  }, [page, selectedStatus, searchQuery])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(0)
    setSearchQuery(searchInput.trim())
  }

  const handleResetSearch = () => {
    setSearchInput('')
    setSearchQuery('')
    setSelectedStatus('')
    setPage(0)
  }

  const handleOpenActionModal = (seller, action) => {
    setAdminNote('')
    setConfirmModal({ open: true, seller, action })
  }

  const handleConfirmAction = async () => {
    const { seller, action } = confirmModal
    if (!seller) return
    try {
      setActionLoading(true)
      if (action === 'suspend') {
        await suspendSeller(seller.id)
        setSuccessMsg(`Merchant privileges suspended for "${seller.sellerName}".`)
      } else {
        await activateSeller(seller.id)
        setSuccessMsg(`Merchant account verified and activated for "${seller.sellerName}".`)
      }
      setConfirmModal({ open: false, seller: null, action: null })
      fetchSellers()
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update merchant verification status.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleViewDetail = async (seller) => {
    setDetailModal({ open: true, seller: null, loading: true })
    try {
      const detail = await getAdminSellerDetail(seller.id)
      setDetailModal({ open: true, seller: detail, loading: false })
    } catch (err) {
      setDetailModal({ open: false, seller: null, loading: false })
      setError(err.response?.data?.message || 'Failed to fetch detailed seller profile.')
    }
  }

  const formatDate = (isoString) => {
    if (!isoString) return '—'
    return new Date(isoString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                color: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
              Seller Verification &amp; Privileges
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.925rem' }}>
            Review merchant registrations, audit store catalogs, and manage selling permissions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary"
            onClick={fetchSellers}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/admin/sellers')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Store size={16} />
            All Merchants
          </button>
        </div>
      </div>

      {/* ── Success / Error Alerts ── */}
      {successMsg && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.9rem',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

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

      {/* ── KPI Metric Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
              TOTAL MERCHANTS
            </span>
            <Store size={18} style={{ color: 'var(--color-primary-light)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
            {stats.total}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>Registered platform sellers</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
              VERIFIED & ACTIVE
            </span>
            <ShieldCheck size={18} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#10b981' }}>
            {selectedStatus === 'ACTIVE' ? totalElements : stats.verified}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>Full selling & store privileges</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
              SUSPENDED / FLAGGED
            </span>
            <ShieldAlert size={18} style={{ color: 'var(--color-danger)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-danger)' }}>
            {selectedStatus === 'SUSPENDED' ? totalElements : stats.suspended}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>Privileges restricted</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
              CATALOG ACTIVE
            </span>
            <Package size={18} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
            {stats.withProducts}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>Merchants with listed inventory</span>
        </div>
      </div>

      {/* ── Filters & Search Controls ── */}
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
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setSelectedStatus(f.id)
                setPage(0)
              }}
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

        {/* Search Bar */}
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
              placeholder="Search merchant name or email..."
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

      {/* ── Merchant Verification Roster Table ── */}
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
                <th style={{ padding: '1rem 1.25rem' }}>Merchant / Business</th>
                <th style={{ padding: '1rem 1.25rem' }}>Registered</th>
                <th style={{ padding: '1rem 1.25rem' }}>Catalog / Orders</th>
                <th style={{ padding: '1rem 1.25rem' }}>Selling Privileges</th>
                <th style={{ padding: '1rem 1.25rem' }}>Account Status</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-disabled)' }}>
                    <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>Loading merchant verification roster...</p>
                  </td>
                </tr>
              ) : sellers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    <Store size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.35 }} />
                    <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-text-primary)' }}>
                      No merchants found
                    </p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--color-text-disabled)' }}>
                      {searchQuery || selectedStatus ? 'Try adjusting your search query or status filter.' : 'No seller accounts have registered on the platform yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                sellers.map((seller) => {
                  const isVerified = seller.enabled
                  const initial = seller.sellerName?.charAt(0).toUpperCase() || 'M'

                  return (
                    <tr
                      key={seller.id}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Merchant Identity */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: isVerified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: isVerified ? '#10b981' : 'var(--color-danger)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '700',
                              fontSize: '0.875rem',
                              flexShrink: 0,
                            }}
                          >
                            {initial}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                              {seller.sellerName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Mail size={12} />
                              {seller.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Registration Date */}
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={13} style={{ color: 'var(--color-text-disabled)' }} />
                          {formatDate(seller.createdAt)}
                        </div>
                      </td>

                      {/* Catalog / Orders */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                            <Package size={14} style={{ color: 'var(--color-primary-light)' }} />
                            <span><strong>{seller.totalProducts || 0}</strong> products</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                            <ShoppingBag size={14} style={{ color: '#10b981' }} />
                            <span><strong>{seller.totalOrders || 0}</strong> orders</span>
                          </div>
                        </div>
                      </td>

                      {/* Selling Privileges */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: '600', color: isVerified ? '#10b981' : 'var(--color-danger)' }}>
                          {isVerified ? (
                            <>
                              <ShieldCheck size={14} />
                              Active Privileges
                            </>
                          ) : (
                            <>
                              <AlertTriangle size={14} style={{ color: 'var(--color-danger)' }} />
                              Suspended Privileges
                            </>
                          )}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          className={`badge ${isVerified ? 'badge-success' : 'badge-danger'}`}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                        >
                          {isVerified ? 'Active / Verified' : 'Suspended / Revoked'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleViewDetail(seller)}
                            title="Quick View Dossier"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            <Eye size={14} />
                            <span>Inspect</span>
                          </button>

                          {isVerified ? (
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleOpenActionModal(seller, 'suspend')}
                              title="Suspend Merchant Privileges"
                              style={{
                                padding: '0.35rem 0.6rem',
                                fontSize: '0.75rem',
                                color: 'var(--color-danger)',
                                borderColor: 'rgba(239, 68, 68, 0.3)',
                              }}
                            >
                              <Ban size={14} />
                              <span>Suspend</span>
                            </button>
                          ) : (
                            <button
                              className="btn btn-primary"
                              onClick={() => handleOpenActionModal(seller, 'activate')}
                              title="Approve & Verify Merchant"
                              style={{
                                padding: '0.35rem 0.6rem',
                                fontSize: '0.75rem',
                                backgroundColor: '#10b981',
                                borderColor: '#10b981',
                              }}
                            >
                              <Check size={14} />
                              <span>Verify & Activate</span>
                            </button>
                          )}

                          <button
                            className="btn btn-secondary"
                            onClick={() => navigate(`/admin/sellers/${seller.id}`)}
                            title="Full Merchant Dashboard"
                            style={{ padding: '0.35rem 0.5rem' }}
                          >
                            <ExternalLink size={14} />
                          </button>
                        </div>
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
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.875rem 1.25rem',
              borderTop: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              Showing {sellers.length} of {totalElements} merchants
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                disabled={page === 0 || loading}
                onClick={() => setPage((p) => p - 1)}
                style={{ padding: '0.35rem 0.65rem' }}
              >
                <ChevronLeft size={16} />
              </button>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 0.75rem',
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-primary)',
                  fontWeight: '600',
                }}
              >
                Page {page + 1} of {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={page >= totalPages - 1 || loading}
                onClick={() => setPage((p) => p + 1)}
                style={{ padding: '0.35rem 0.65rem' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Action Confirmation Modal ── */}
      {confirmModal.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
            overflowY: 'auto',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '460px',
              width: '100%',
              maxHeight: 'min(90vh, 90dvh)',
              overflowY: 'auto',
              margin: 'auto',
              padding: '1.75rem',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: confirmModal.action === 'suspend' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: confirmModal.action === 'suspend' ? 'var(--color-danger)' : '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {confirmModal.action === 'suspend' ? <ShieldAlert size={24} /> : <ShieldCheck size={24} />}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-text-primary)', fontWeight: '700' }}>
                  {confirmModal.action === 'suspend' ? 'Suspend Merchant Privileges' : 'Approve & Verify Merchant'}
                </h3>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  Merchant: {confirmModal.seller?.sellerName}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
              {confirmModal.action === 'suspend'
                ? `Suspending this merchant will revoke their access to list new products, update catalog entries, and receive customer orders. Existing orders can still be viewed.`
                : `Verifying this merchant will immediately grant them full seller privileges to publish products to the marketplace, manage stock, and process customer orders.`}
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
                Administrative Audit Note (Optional)
              </label>
              <textarea
                className="input"
                rows={2}
                placeholder="E.g., Account details reviewed, catalog readiness checked..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                style={{ width: '100%', fontSize: '0.8125rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmModal({ open: false, seller: null, action: null })}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className={`btn ${confirmModal.action === 'suspend' ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleConfirmAction}
                disabled={actionLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: confirmModal.action === 'activate' ? '#10b981' : undefined,
                  borderColor: confirmModal.action === 'activate' ? '#10b981' : undefined,
                }}
              >
                {actionLoading && <Loader2 size={16} className="animate-spin" />}
                {confirmModal.action === 'suspend' ? 'Confirm Suspension' : 'Approve & Verify'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Dossier Inspection Modal ── */}
      {detailModal.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
            overflowY: 'auto',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '540px',
              width: '100%',
              maxHeight: 'min(90vh, 90dvh)',
              overflowY: 'auto',
              margin: 'auto',
              padding: '1.75rem',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            {detailModal.loading ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
                <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Loading merchant compliance file...</p>
              </div>
            ) : detailModal.seller ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'rgba(59, 130, 246, 0.12)',
                        color: 'var(--color-primary-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Store size={22} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-text-primary)', fontWeight: '700' }}>
                        {detailModal.seller.sellerName}
                      </h3>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-disabled)' }}>
                        Merchant ID: #{detailModal.seller.id}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`badge ${detailModal.seller.enabled ? 'badge-success' : 'badge-danger'}`}
                    style={{ fontSize: '0.75rem' }}
                  >
                    {detailModal.seller.enabled ? 'Verified & Active' : 'Suspended'}
                  </span>
                </div>

                {/* Information Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.75rem',
                    marginBottom: '1.25rem',
                    backgroundColor: 'var(--color-surface-raised)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)', display: 'block' }}>CONTACT EMAIL</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: '600' }}>
                      {detailModal.seller.email}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)', display: 'block' }}>ONBOARDING DATE</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: '600' }}>
                      {formatDate(detailModal.seller.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)', display: 'block' }}>TOTAL PRODUCTS</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: '600' }}>
                      {detailModal.seller.totalProducts} ({detailModal.seller.approvedProducts} approved)
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)', display: 'block' }}>TOTAL ORDERS</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: '600' }}>
                      {detailModal.seller.totalOrders} ({detailModal.seller.completedOrders} completed)
                    </span>
                  </div>
                </div>

                {/* Account Standing Checklist */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                    Account Standing &amp; Access Controls
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                      <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                      <span>Account Registration &amp; Credentials Authenticated</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                      <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                      <span>Store Ownership &amp; Catalog Access Configured</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                      <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                      <span>Product Listing &amp; Order Fulfillment Enabled</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setDetailModal({ open: false, seller: null, loading: false })}
                  >
                    Close
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      const id = detailModal.seller.id
                      setDetailModal({ open: false, seller: null, loading: false })
                      navigate(`/admin/sellers/${id}`)
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <ExternalLink size={16} />
                    Open Full Dossier
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

export default SellerVerification

/**
 * Customers.jsx — Customer Accounts Platform Administration
 * Route: /admin/customers
 * Layout: AdminLayout
 *
 * Provides administrators with visibility into registered customer accounts,
 * purchase frequencies, account standing, and suspension controls.
 */

import { useState, useEffect } from 'react'
import {
  Users,
  UserCheck,
  UserX,
  Search,
  RotateCcw,
  ShoppingBag,
  Mail,
  Calendar,
  Eye,
  Ban,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import {
  getAdminUsersPaged,
  suspendUser,
  activateUser,
  getAdminUserDetail,
} from '@/services/userService'

const STATUS_FILTERS = [
  { id: '', label: 'All Customers' },
  { id: 'ACTIVE', label: 'Active Accounts' },
  { id: 'SUSPENDED', label: 'Suspended Accounts' },
]

const Customers = () => {
  const [customers, setCustomers] = useState([])
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
  const [confirmModal, setConfirmModal] = useState({ open: false, user: null, action: null })
  const [detailModal, setDetailModal] = useState({ open: false, user: null, loading: false })

  // Summary stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
  })

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {
        role: 'CUSTOMER',
        page,
        size: 10,
        status: selectedStatus || undefined,
        search: searchQuery || undefined,
      }
      const data = await getAdminUsersPaged(params)
      const items = data.content || []
      setCustomers(items)
      setTotalPages(data.totalPages || 1)
      setTotalElements(data.totalElements || 0)

      const activeCount = items.filter((c) => c.enabled).length
      const suspendedCount = items.filter((c) => !c.enabled).length

      setStats({
        total: data.totalElements || items.length,
        active: selectedStatus === 'ACTIVE' ? data.totalElements : (selectedStatus === 'SUSPENDED' ? 0 : activeCount),
        suspended: selectedStatus === 'SUSPENDED' ? data.totalElements : (selectedStatus === 'ACTIVE' ? 0 : suspendedCount),
      })
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load customer accounts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
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

  const handleConfirmAction = async () => {
    const { user, action } = confirmModal
    if (!user) return
    try {
      setActionLoading(true)
      if (action === 'suspend') {
        await suspendUser(user.id)
        setSuccessMsg(`Customer account for "${user.fullName}" suspended.`)
      } else {
        await activateUser(user.id)
        setSuccessMsg(`Customer account for "${user.fullName}" activated.`)
      }
      setConfirmModal({ open: false, user: null, action: null })
      fetchCustomers()
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update account status.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleViewDetail = async (user) => {
    setDetailModal({ open: true, user: null, loading: true })
    try {
      const detail = await getAdminUserDetail(user.id)
      setDetailModal({ open: true, user: detail, loading: false })
    } catch (err) {
      setDetailModal({ open: false, user: null, loading: false })
      setError(err.response?.data?.message || 'Failed to fetch customer profile.')
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
              <Users size={24} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
              Customer Management
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.925rem' }}>
            Inspect registered customer profiles, monitor purchase histories, and manage account statuses.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={fetchCustomers}
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Alerts ── */}
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

      {/* ── Metric Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
              TOTAL CUSTOMERS
            </span>
            <Users size={18} style={{ color: 'var(--color-primary-light)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
            {stats.total}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>Registered shoppers on Shopivo</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
              ACTIVE ACCOUNTS
            </span>
            <UserCheck size={18} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#10b981' }}>
            {selectedStatus === 'ACTIVE' ? totalElements : stats.active}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>Enabled with ordering access</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
              SUSPENDED
            </span>
            <UserX size={18} style={{ color: 'var(--color-danger)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-danger)' }}>
            {selectedStatus === 'SUSPENDED' ? totalElements : stats.suspended}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>Checkout locked accounts</span>
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
              placeholder="Search customer name or email..."
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

      {/* ── Customers Table ── */}
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
                <th style={{ padding: '1rem 1.25rem' }}>Customer Profile</th>
                <th style={{ padding: '1rem 1.25rem' }}>Member Since</th>
                <th style={{ padding: '1rem 1.25rem' }}>Role</th>
                <th style={{ padding: '1rem 1.25rem' }}>Status</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-disabled)' }}>
                    <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>Loading customer records...</p>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    <Users size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.35 }} />
                    <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-text-primary)' }}>
                      No customers found
                    </p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--color-text-disabled)' }}>
                      {searchQuery || selectedStatus ? 'Try adjusting your search query or filter.' : 'No customer accounts registered yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const initial = c.fullName?.charAt(0).toUpperCase() || 'C'
                  const isActive = c.enabled

                  return (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Identity */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(59, 130, 246, 0.12)',
                              color: 'var(--color-primary-light)',
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
                              {c.fullName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Mail size={12} />
                              {c.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Created At */}
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={13} style={{ color: 'var(--color-text-disabled)' }} />
                          {formatDate(c.createdAt)}
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                          {c.role || 'CUSTOMER'}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                        >
                          {isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleViewDetail(c)}
                            title="View Customer Profile"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            <Eye size={14} />
                            <span>Inspect</span>
                          </button>

                          {isActive ? (
                            <button
                              className="btn btn-secondary"
                              onClick={() => setConfirmModal({ open: true, user: c, action: 'suspend' })}
                              title="Suspend Customer Account"
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
                              onClick={() => setConfirmModal({ open: true, user: c, action: 'activate' })}
                              title="Activate Customer Account"
                              style={{
                                padding: '0.35rem 0.6rem',
                                fontSize: '0.75rem',
                                backgroundColor: '#10b981',
                                borderColor: '#10b981',
                              }}
                            >
                              <Check size={14} />
                              <span>Activate</span>
                            </button>
                          )}
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
              Showing {customers.length} of {totalElements} customers
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

      {/* ── Confirmation Modal ── */}
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
              maxWidth: '440px',
              width: '100%',
              maxHeight: 'min(90vh, 90dvh)',
              overflowY: 'auto',
              margin: 'auto',
              padding: '1.75rem',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.15rem', color: 'var(--color-text-primary)', fontWeight: '700' }}>
              {confirmModal.action === 'suspend' ? 'Suspend Customer Account?' : 'Activate Customer Account?'}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              {confirmModal.action === 'suspend'
                ? `Are you sure you want to suspend "${confirmModal.user?.fullName}"? They will not be able to log in or place orders.`
                : `Are you sure you want to activate "${confirmModal.user?.fullName}"? They will regain full shopping and checkout access.`}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmModal({ open: false, user: null, action: null })}
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
                {confirmModal.action === 'suspend' ? 'Confirm Suspension' : 'Confirm Activation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
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
              maxWidth: '480px',
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
                <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Loading customer record...</p>
              </div>
            ) : detailModal.user ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-text-primary)', fontWeight: '700' }}>
                      {detailModal.user.fullName}
                    </h3>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-disabled)' }}>
                      Customer ID: #{detailModal.user.id}
                    </span>
                  </div>
                  <span
                    className={`badge ${detailModal.user.enabled ? 'badge-success' : 'badge-danger'}`}
                    style={{ fontSize: '0.75rem' }}
                  >
                    {detailModal.user.enabled ? 'Active' : 'Suspended'}
                  </span>
                </div>

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
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)', display: 'block' }}>EMAIL</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: '600' }}>
                      {detailModal.user.email}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)', display: 'block' }}>JOINED</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: '600' }}>
                      {formatDate(detailModal.user.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)', display: 'block' }}>ROLE</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: '600' }}>
                      {detailModal.user.role}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)', display: 'block' }}>TOTAL ORDERS</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: '600' }}>
                      {detailModal.user.customerInfo?.totalOrders ?? 0}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setDetailModal({ open: false, user: null, loading: false })}
                  >
                    Close
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

export default Customers

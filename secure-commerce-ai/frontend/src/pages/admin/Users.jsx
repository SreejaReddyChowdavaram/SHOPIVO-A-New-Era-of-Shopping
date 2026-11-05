/**
 * Users.jsx — Platform User Account Management
 * Route: /admin/users
 * Layout: AdminLayout
 *
 * Full administrator interface for searching, filtering, inspecting,
 * suspending, and activating user accounts across all platform roles.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  User,
  Shield,
  Store,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Ban,
  Check,
  Calendar,
  Mail,
  ShoppingBag,
  Package
} from 'lucide-react'
import {
  getAdminUsersPaged,
  getAdminUserDetail,
  suspendUser,
  activateUser
} from '@/services/userService'

const ROLE_TABS = [
  { id: '', label: 'All Roles' },
  { id: 'CUSTOMER', label: 'Customers' },
  { id: 'SELLER', label: 'Sellers' },
  { id: 'ADMIN', label: 'Administrators' },
]

const STATUS_FILTERS = [
  { id: '', label: 'All Statuses' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'SUSPENDED', label: 'Suspended' },
]

const ROLE_BADGE = {
  CUSTOMER: { label: 'Customer', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.12)', border: 'rgba(14, 165, 233, 0.3)' },
  SELLER:   { label: 'Seller',   color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.3)' },
  ADMIN:    { label: 'Admin',    color: 'var(--color-primary)', bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.3)' },
}

const Users = () => {
  const navigate = useNavigate()

  const [users, setUsers] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // Modals & Action States
  const [inspectUser, setInspectUser] = useState(null)
  const [inspectLoading, setInspectLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmModal, setConfirmModal] = useState({ open: false, user: null, action: null })

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {
        page,
        size: 10,
        role: selectedRole || undefined,
        status: selectedStatus || undefined,
        search: searchQuery || undefined,
      }
      const data = await getAdminUsersPaged(params)
      setUsers(data.content || [])
      setTotalPages(data.totalPages || 1)
      setTotalElements(data.totalElements || 0)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load platform users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, selectedRole, selectedStatus, searchQuery])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(0)
    setSearchQuery(searchInput.trim())
  }

  const handleInspect = async (user) => {
    try {
      setInspectLoading(true)
      setInspectUser(null)
      const detail = await getAdminUserDetail(user.id)
      setInspectUser(detail)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to fetch user details')
    } finally {
      setInspectLoading(false)
    }
  }

  const handleConfirmAction = async () => {
    const { user, action } = confirmModal
    if (!user) return
    try {
      setActionLoading(true)
      if (action === 'suspend') {
        await suspendUser(user.id)
      } else {
        await activateUser(user.id)
      }
      setConfirmModal({ open: false, user: null, action: null })
      if (inspectUser && inspectUser.id === user.id) {
        const updated = await getAdminUserDetail(user.id)
        setInspectUser(updated)
      }
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
          User Accounts
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Platform account management, role oversight, and account suspension controls.
        </p>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--color-border)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Role Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {ROLE_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setSelectedRole(tab.id); setPage(0); }}
                style={{
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.8125rem',
                  fontWeight: selectedRole === tab.id ? '700' : '500',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid',
                  borderColor: selectedRole === tab.id ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: selectedRole === tab.id ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                  color: selectedRole === tab.id ? 'var(--color-primary-light)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(0); }}
              style={{
                padding: '0.45rem 0.75rem',
                fontSize: '0.8125rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                cursor: 'pointer'
              }}
            >
              {STATUS_FILTERS.map(sf => (
                <option key={sf.id} value={sf.id}>{sf.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search users by name, email, or ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                fontSize: '0.875rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.8125rem' }}>
            Search
          </button>
          {searchQuery && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setSearchInput(''); setSearchQuery(''); setPage(0); }}
              style={{ padding: '0.55rem 0.75rem', fontSize: '0.8125rem' }}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Content Area */}
      {loading ? (
        <div style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          padding: '4rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          color: 'var(--color-text-secondary)',
        }}>
          <Loader2 size={32} className="animate-spin" color="var(--color-primary)" />
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Loading platform accounts...</p>
        </div>
      ) : error ? (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-sm)',
          padding: '1.5rem',
          textAlign: 'center',
          color: 'var(--color-danger)',
        }}>
          <AlertTriangle size={28} style={{ margin: '0 auto 0.5rem' }} />
          <p style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</p>
          <button className="btn btn-secondary" onClick={fetchUsers} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
            <RotateCcw size={14} /> Retry
          </button>
        </div>
      ) : users.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          padding: '3.5rem 1.5rem',
          textAlign: 'center',
          color: 'var(--color-text-secondary)'
        }}>
          <User size={36} style={{ margin: '0 auto 0.75rem', color: 'var(--color-text-muted)' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0, marginBottom: '0.25rem' }}>
            No users match criteria
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0 }}>
            Try resetting your search query or role filter.
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>User</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Email</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Role</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Registered</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const roleBadge = ROLE_BADGE[u.role] || ROLE_BADGE.CUSTOMER
                  const isSuspended = !u.enabled
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.15s' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '36px', height: '36px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(99, 102, 241, 0.12)',
                            color: 'var(--color-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: '700', fontSize: '0.875rem'
                          }}>
                            {u.firstName?.[0] || 'U'}
                          </div>
                          <div>
                            <p style={{ fontWeight: '600', color: 'var(--color-text-primary)', margin: 0 }}>
                              {u.fullName}
                            </p>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                              ID: #{u.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>
                        {u.email}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: roleBadge.bg,
                          color: roleBadge.color,
                          border: `1px solid ${roleBadge.border}`
                        }}>
                          {roleBadge.label}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: isSuspended ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                          color: isSuspended ? 'var(--color-danger)' : 'var(--color-success)',
                          border: `1px solid ${isSuspended ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`
                        }}>
                          {isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                        {formatDate(u.createdAt)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            onClick={() => handleInspect(u)}
                            className="btn btn-secondary"
                            title="Inspect Details"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <Eye size={13} /> View
                          </button>

                          {isSuspended ? (
                            <button
                              onClick={() => setConfirmModal({ open: true, user: u, action: 'activate' })}
                              className="btn btn-secondary"
                              title="Activate Account"
                              style={{
                                padding: '0.35rem 0.65rem',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                color: 'var(--color-success)',
                                borderColor: 'rgba(34, 197, 94, 0.3)'
                              }}
                            >
                              <Check size={13} /> Activate
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmModal({ open: true, user: u, action: 'suspend' })}
                              className="btn btn-secondary"
                              title="Suspend Account"
                              style={{
                                padding: '0.35rem 0.65rem',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                color: 'var(--color-danger)',
                                borderColor: 'rgba(239, 68, 68, 0.3)'
                              }}
                            >
                              <Ban size={13} /> Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.85rem 1.25rem',
            borderTop: '1px solid var(--color-border)',
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)'
          }}>
            <span>Showing {users.length} of {totalElements} platform users</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{ padding: '0.35rem 0.65rem' }}
              >
                <ChevronLeft size={16} />
              </button>
              <span>Page {page + 1} of {totalPages}</span>
              <button
                className="btn btn-secondary"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                style={{ padding: '0.35rem 0.65rem' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect User Detail Modal */}
      {(inspectUser || inspectLoading) && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '1.75rem' }}>
            {inspectLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Loader2 size={32} className="animate-spin" color="var(--color-primary)" />
              </div>
            ) : inspectUser && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
                      {inspectUser.fullName}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                      Account ID: #{inspectUser.id}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    padding: '0.2rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: inspectUser.enabled ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    color: inspectUser.enabled ? 'var(--color-success)' : 'var(--color-danger)'
                  }}>
                    {inspectUser.status}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Email</span>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{inspectUser.email}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Platform Role</span>
                    <strong style={{ color: 'var(--color-primary-light)' }}>{inspectUser.role}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Registered</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{formatDate(inspectUser.createdAt)}</span>
                  </div>

                  {/* Role Specific Summary */}
                  {inspectUser.sellerInfo && (
                    <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                        <Store size={15} color="var(--color-primary)" />
                        <span>Seller Overview</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8125rem' }}>
                        <div>Products: <strong>{inspectUser.sellerInfo.totalProducts}</strong></div>
                        <div>Approved: <strong style={{ color: 'var(--color-success)' }}>{inspectUser.sellerInfo.approvedProducts}</strong></div>
                        <div>Orders: <strong>{inspectUser.sellerInfo.totalOrders}</strong></div>
                        <div>Pending: <strong style={{ color: 'var(--color-warning)' }}>{inspectUser.sellerInfo.pendingProducts}</strong></div>
                      </div>
                      <button
                        onClick={() => { setInspectUser(null); navigate(`/admin/sellers/${inspectUser.id}`); }}
                        className="btn btn-secondary"
                        style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.75rem' }}
                      >
                        View Full Seller Details →
                      </button>
                    </div>
                  )}

                  {inspectUser.customerInfo && (
                    <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
                        <ShoppingBag size={15} color="#0ea5e9" />
                        <span>Customer Overview</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        Total Orders Placed: <strong>{inspectUser.customerInfo.totalOrders}</strong>
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setInspectUser(null)}
                  >
                    Close
                  </button>
                  {inspectUser.enabled ? (
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        const target = inspectUser
                        setInspectUser(null)
                        setConfirmModal({ open: true, user: target, action: 'suspend' })
                      }}
                    >
                      Suspend Account
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        const target = inspectUser
                        setInspectUser(null)
                        setConfirmModal({ open: true, user: target, action: 'activate' })
                      }}
                      style={{ backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                    >
                      Activate Account
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: confirmModal.action === 'suspend' ? 'var(--color-danger)' : 'var(--color-success)' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
                {confirmModal.action === 'suspend' ? 'Suspend Account' : 'Activate Account'}
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {confirmModal.action === 'suspend' ? (
                <>Are you sure you want to suspend account for <strong>{confirmModal.user?.fullName}</strong> ({confirmModal.user?.email})? The user will be blocked from logging in. Historical records remain preserved.</>
              ) : (
                <>Reactivate account for <strong>{confirmModal.user?.fullName}</strong> ({confirmModal.user?.email})? The user will regain platform access.</>
              )}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmModal({ open: false, user: null, action: null })}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={confirmModal.action === 'suspend' ? 'btn btn-danger' : 'btn btn-primary'}
                onClick={handleConfirmAction}
                disabled={actionLoading}
                style={confirmModal.action === 'activate' ? { backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' } : {}}
              >
                {actionLoading ? 'Processing...' : (confirmModal.action === 'suspend' ? 'Confirm Suspension' : 'Confirm Activation')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users

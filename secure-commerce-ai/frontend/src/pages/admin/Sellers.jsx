/**
 * Sellers.jsx — Platform Seller Account & Catalog Management
 * Route: /admin/sellers
 * Layout: AdminLayout
 *
 * Dedicated administrative interface for inspecting seller accounts,
 * monitoring product/order volumes, and managing seller active/suspended status.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
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
  Package,
  ShoppingBag
} from 'lucide-react'
import {
  getAdminSellersPaged,
  suspendSeller,
  activateSeller
} from '@/services/userService'

const STATUS_FILTERS = [
  { id: '', label: 'All Sellers' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'SUSPENDED', label: 'Suspended' },
]

const Sellers = () => {
  const navigate = useNavigate()

  const [sellers, setSellers] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // Action states
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmModal, setConfirmModal] = useState({ open: false, seller: null, action: null })

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
      setSellers(data.content || [])
      setTotalPages(data.totalPages || 1)
      setTotalElements(data.totalElements || 0)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load platform sellers')
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

  const handleConfirmAction = async () => {
    const { seller, action } = confirmModal
    if (!seller) return
    try {
      setActionLoading(true)
      if (action === 'suspend') {
        await suspendSeller(seller.id)
      } else {
        await activateSeller(seller.id)
      }
      setConfirmModal({ open: false, seller: null, action: null })
      fetchSellers()
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
          Seller Management
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Overview of registered vendor accounts, catalog listings, order volumes, and status controls.
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
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {STATUS_FILTERS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setSelectedStatus(tab.id); setPage(0); }}
                style={{
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.8125rem',
                  fontWeight: selectedStatus === tab.id ? '700' : '500',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid',
                  borderColor: selectedStatus === tab.id ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: selectedStatus === tab.id ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                  color: selectedStatus === tab.id ? 'var(--color-primary-light)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search sellers by name, email, or seller ID..."
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
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Loading platform sellers...</p>
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
          <button className="btn btn-secondary" onClick={fetchSellers} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
            <RotateCcw size={14} /> Retry
          </button>
        </div>
      ) : sellers.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          padding: '3.5rem 1.5rem',
          textAlign: 'center',
          color: 'var(--color-text-secondary)'
        }}>
          <Store size={36} style={{ margin: '0 auto 0.75rem', color: 'var(--color-text-muted)' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0, marginBottom: '0.25rem' }}>
            No sellers found
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0 }}>
            No registered vendor accounts match the selected filters.
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
                  <th style={{ padding: '0.85rem 1rem' }}>Seller</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Email</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Products</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Orders</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Joined</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map(s => {
                  const isSuspended = !s.enabled
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.15s' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '36px', height: '36px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'rgba(168, 85, 247, 0.12)',
                            color: '#a855f7',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: '700', fontSize: '0.875rem'
                          }}>
                            <Store size={18} />
                          </div>
                          <div>
                            <p style={{ fontWeight: '600', color: 'var(--color-text-primary)', margin: 0 }}>
                              {s.sellerName}
                            </p>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                              ID: #{s.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>
                        {s.email}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>
                          {s.totalProducts}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>
                          {s.totalOrders}
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
                        {formatDate(s.createdAt)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            onClick={() => navigate(`/admin/sellers/${s.id}`)}
                            className="btn btn-secondary"
                            title="Inspect Seller Details"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <Eye size={13} /> View Details
                          </button>

                          {isSuspended ? (
                            <button
                              onClick={() => setConfirmModal({ open: true, seller: s, action: 'activate' })}
                              className="btn btn-secondary"
                              title="Activate Seller"
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
                              onClick={() => setConfirmModal({ open: true, seller: s, action: 'suspend' })}
                              className="btn btn-secondary"
                              title="Suspend Seller"
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
            <span>Showing {sellers.length} of {totalElements} platform sellers</span>
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
                {confirmModal.action === 'suspend' ? 'Suspend Seller Account' : 'Activate Seller Account'}
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {confirmModal.action === 'suspend' ? (
                <>Are you sure you want to suspend <strong>{confirmModal.seller?.sellerName}</strong>? The seller will be unable to log in, add products, or fulfill orders until reactivated. Existing product listings and orders remain safely preserved.</>
              ) : (
                <>Reactivate seller account for <strong>{confirmModal.seller?.sellerName}</strong>? The seller will regain access to their portal.</>
              )}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmModal({ open: false, seller: null, action: null })}
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

export default Sellers

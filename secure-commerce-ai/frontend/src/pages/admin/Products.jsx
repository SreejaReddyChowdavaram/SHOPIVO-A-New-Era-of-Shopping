/**
 * Products.jsx — Admin Product Moderation & Management
 * Route: /admin/products
 * Layout: AdminLayout
 *
 * Allows administrators to review seller-submitted products, inspect catalog listings,
 * and approve or reject submissions with optional moderation feedback.
 */

import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  X,
  Eye,
  Loader2,
  AlertCircle,
  Check,
  ShieldCheck,
  Tag,
  User,
  ExternalLink,
  Boxes
} from 'lucide-react'
import { getAdminProducts, approveProduct, rejectProduct } from '@/services/productService'

const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED']

const STATUS_BADGE = {
  PENDING:  { label: 'Pending Review', color: 'var(--color-warning)', bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.3)', icon: Clock },
  APPROVED: { label: 'Approved',       color: 'var(--color-success)', bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.3)', icon: CheckCircle2 },
  REJECTED: { label: 'Rejected',       color: 'var(--color-danger)',  bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)', icon: XCircle },
}

const AdminProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialStatus = searchParams.get('status') || 'ALL'

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionSuccess, setActionSuccess] = useState(null)

  const [activeTab, setActiveTab] = useState(initialStatus)
  const [searchQuery, setSearchQuery] = useState('')

  // Review Modal State
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAdminProducts({
        status: activeTab !== 'ALL' ? activeTab : null,
        search: searchQuery
      })
      setProducts(data || [])
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [activeTab])

  // Handle Tab Change
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'ALL') {
      searchParams.delete('status')
    } else {
      searchParams.set('status', tab)
    }
    setSearchParams(searchParams)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchProducts()
  }

  const handleApprove = async (productId) => {
    try {
      setActionLoading(true)
      await approveProduct(productId)
      setActionSuccess(`Product #${productId} has been approved and is now live in the store.`)
      setSelectedProduct(null)
      setShowRejectInput(false)
      fetchProducts()
      setTimeout(() => setActionSuccess(null), 5000)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve product')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (productId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason so the seller can address the issues.')
      return
    }

    try {
      setActionLoading(true)
      await rejectProduct(productId, rejectionReason.trim())
      setActionSuccess(`Product #${productId} has been rejected. Feedback recorded for seller.`)
      setSelectedProduct(null)
      setShowRejectInput(false)
      setRejectionReason('')
      fetchProducts()
      setTimeout(() => setActionSuccess(null), 5000)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject product')
    } finally {
      setActionLoading(false)
    }
  }

  const openReviewModal = (product) => {
    setSelectedProduct(product)
    setShowRejectInput(false)
    setRejectionReason('')
  }

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  // Filter products locally for search if already loaded
  const filteredProducts = products.filter(p => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    const nameMatch = (p.name || '').toLowerCase().includes(q)
    const sellerMatch = (p.sellerName || '').toLowerCase().includes(q)
    const categoryMatch = (p.categoryName || '').toLowerCase().includes(q)
    const idMatch = String(p.id).includes(q)
    return nameMatch || sellerMatch || categoryMatch || idMatch
  })

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
          Product Moderation
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Review, approve, or reject seller submissions before they become visible to customers.
        </p>
      </div>

      {/* ── Success Banner ── */}
      {actionSuccess && (
        <div style={{
          backgroundColor: 'rgba(34, 197, 94, 0.12)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          color: 'var(--color-success)',
          padding: '0.875rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.875rem',
        }}>
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* ── Search & Filter Controls ── */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: '1.25rem'
      }}>
        {/* Search form */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '260px', maxWidth: '460px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="var(--color-text-secondary)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, seller, or ID..."
              style={{
                width: '100%',
                padding: '0.55rem 2.25rem 0.55rem 2.4rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: '0.85rem'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); fetchProducts() }}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }}>
            Search
          </button>
        </form>
      </div>

      {/* ── Status Filter Tabs ── */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.75rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid var(--color-border)'
      }}>
        {STATUS_TABS.map(tab => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid',
                borderColor: isActive ? 'var(--color-primary)' : 'var(--color-border)',
                background: isActive ? 'rgba(4, 219, 126, 0.15)' : 'var(--color-surface)',
                color: isActive ? 'var(--color-nav-active-text, var(--color-primary))' : 'var(--color-text-secondary)',
                fontSize: '0.8125rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.charAt(0) + tab.slice(1).toLowerCase()}</span>
            </button>
          )
        })}
      </div>

      {/* ── Products Content ── */}
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
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Loading product catalog...</p>
        </div>
      ) : error ? (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-sm)',
          padding: '1.5rem',
          color: 'var(--color-danger)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          textAlign: 'center',
          padding: '4rem 2rem'
        }}>
          <Package size={48} style={{ margin: '0 auto 1rem', color: 'var(--color-text-disabled)' }} />
          <h2 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
            No products found
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
            {activeTab === 'ALL'
              ? 'No products matching your search criteria.'
              : `No products currently in "${activeTab}" status.`}
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-raised)',
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  <th style={{ padding: '0.875rem 1rem' }}>Product</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Seller</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Price</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Stock</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Submitted</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => {
                  const badge = STATUS_BADGE[product.status] || STATUS_BADGE.PENDING
                  const BadgeIcon = badge.icon

                  return (
                    <tr
                      key={product.id}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Product Thumbnail + Name */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img
                            src={product.imageUrl || 'https://placehold.co/44x44/1a1d2e/818cf8?text=P'}
                            alt={product.name}
                            style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                            onError={e => { e.target.src = 'https://placehold.co/44x44/1a1d2e/818cf8?text=P' }}
                          />
                          <div>
                            <p style={{ fontWeight: '600', color: 'var(--color-text-primary)', margin: 0, maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {product.name}
                            </p>
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-disabled)' }}>
                              ID: #{product.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                        {product.categoryName || 'Uncategorized'}
                      </td>

                      {/* Seller */}
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <User size={13} color="var(--color-text-disabled)" />
                          <span>{product.sellerName || 'Seller #' + product.sellerId}</span>
                        </div>
                      </td>

                      {/* Price */}
                      <td style={{ padding: '0.875rem 1rem', fontWeight: '700', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                        {formatPrice(product.price)}
                      </td>

                      {/* Stock */}
                      <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{
                          color: product.stockQuantity > 0 ? 'var(--color-text-primary)' : 'var(--color-danger)',
                          fontWeight: product.stockQuantity === 0 ? '700' : '500'
                        }}>
                          {product.stockQuantity} units
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          color: badge.color,
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}>
                          <BadgeIcon size={12} />
                          {badge.label}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {formatDate(product.createdAt)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => openReviewModal(product)}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            title="Inspect Details"
                          >
                            <Eye size={13} />
                            <span>Review</span>
                          </button>

                          {product.status === 'PENDING' && (
                            <button
                              className="btn btn-primary"
                              onClick={() => handleApprove(product.id)}
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                              title="Quick Approve"
                            >
                              <Check size={14} />
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
        </div>
      )}

      {/* ── Review & Moderation Modal ── */}
      {selectedProduct && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedProduct(null)}
              style={{
                position: 'absolute', top: '1.25rem', right: '1.25rem',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-secondary)', padding: '0.25rem'
              }}
            >
              <X size={20} />
            </button>

            {/* Modal Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <ShieldCheck size={24} color="var(--color-primary-light)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
                Product Moderation Review
              </h2>
            </div>

            {/* Product Overview Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 160px) 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <img
                src={selectedProduct.imageUrl || 'https://placehold.co/160x160/1a1d2e/818cf8?text=Product'}
                alt={selectedProduct.name}
                style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                onError={e => { e.target.src = 'https://placehold.co/160x160/1a1d2e/818cf8?text=Product' }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
                  {selectedProduct.name}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-disabled)', margin: 0 }}>
                  Slug: {selectedProduct.slug}
                </p>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.75rem' }}>Price</span>
                    <strong style={{ color: 'var(--color-primary-light)', fontSize: '1.1rem' }}>{formatPrice(selectedProduct.price)}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.75rem' }}>Stock</span>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{selectedProduct.stockQuantity} units</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.75rem' }}>Category</span>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{selectedProduct.categoryName || 'None'}</strong>
                  </div>
                </div>

                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  <span>Seller: </span>
                  <strong style={{ color: 'var(--color-text-primary)' }}>{selectedProduct.sellerName || 'ID #' + selectedProduct.sellerId}</strong>
                </div>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '0.04em' }}>
                Product Description
              </span>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-primary)',
                background: 'var(--color-surface-raised)',
                padding: '0.875rem',
                borderRadius: 'var(--radius-sm)',
                marginTop: '0.4rem',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.6'
              }}>
                {selectedProduct.description || 'No description provided by seller.'}
              </p>
            </div>

            {/* Existing Rejection Reason (if rejected) */}
            {selectedProduct.status === 'REJECTED' && selectedProduct.rejectionReason && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                marginBottom: '1.5rem',
                fontSize: '0.85rem'
              }}>
                <strong style={{ color: 'var(--color-danger)', display: 'block', marginBottom: '0.25rem' }}>
                  Recorded Rejection Reason:
                </strong>
                <span style={{ color: 'var(--color-text-secondary)' }}>{selectedProduct.rejectionReason}</span>
              </div>
            )}

            {/* Rejection Input Area */}
            {showRejectInput && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-danger)', marginBottom: '0.4rem' }}>
                  Specify Rejection Reason (Mandatory Feedback for Seller):
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="e.g. Images do not meet platform quality standards, prohibited item, misleading claim..."
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowRejectInput(false)}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn"
                    disabled={actionLoading || !rejectionReason.trim()}
                    onClick={() => handleReject(selectedProduct.id)}
                    style={{
                      fontSize: '0.8rem',
                      padding: '0.4rem 0.875rem',
                      backgroundColor: 'var(--color-danger)',
                      color: '#fff',
                      border: 'none',
                      cursor: rejectionReason.trim() ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {actionLoading ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {selectedProduct.status === 'PENDING' && !showRejectInput && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                <button
                  className="btn btn-secondary"
                  disabled={actionLoading}
                  onClick={() => setShowRejectInput(true)}
                  style={{ color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                >
                  Reject Listing
                </button>
                <button
                  className="btn btn-primary"
                  disabled={actionLoading}
                  onClick={() => handleApprove(selectedProduct.id)}
                  style={{
                    backgroundColor: 'var(--color-success)',
                    borderColor: 'var(--color-success)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>Approve & Publish</span>
                </button>
              </div>
            )}

            {selectedProduct.status !== 'PENDING' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                <button className="btn btn-secondary" onClick={() => setSelectedProduct(null)}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminProducts

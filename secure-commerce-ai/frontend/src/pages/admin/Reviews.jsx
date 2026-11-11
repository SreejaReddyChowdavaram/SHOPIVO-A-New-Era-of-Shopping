/**
 * Reviews.jsx — Admin Reviews Moderation & Ratings Oversight
 * Route: /admin/reviews
 * Layout: AdminLayout
 *
 * Dedicated admin interface for inspecting product reviews, monitoring
 * customer satisfaction metrics, and moderating inappropriate content.
 */

import { useState, useEffect } from 'react'
import {
  Star,
  MessageSquare,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Search,
  User,
  Calendar,
  Package,
  Loader2,
} from 'lucide-react'
import { getAdminReviews, deleteAdminReview } from '@/services/reviewService'

const RATING_FILTERS = [
  { id: 'ALL', label: 'All Ratings' },
  { id: '5', label: '5 Stars' },
  { id: '4', label: '4 Stars' },
  { id: '3', label: '3 Stars' },
  { id: '2', label: '2 Stars' },
  { id: '1', label: '1 Star' },
]

const Reviews = () => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Filters & Search
  const [selectedRating, setSelectedRating] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // Summary Metrics
  const [summary, setSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  })

  // Delete Action Modal
  const [deleteModal, setDeleteModal] = useState({ open: false, review: null, loading: false })

  const fetchReviews = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAdminReviews()
      if (data) {
        setReviews(data.reviews || [])
        setSummary({
          averageRating: data.averageRating || 0,
          totalReviews: data.totalReviews || 0,
          ratingBreakdown: {
            5: data.rating5Count ?? data.ratingBreakdown?.[5] ?? 0,
            4: data.rating4Count ?? data.ratingBreakdown?.[4] ?? 0,
            3: data.rating3Count ?? data.ratingBreakdown?.[3] ?? 0,
            2: data.rating2Count ?? data.ratingBreakdown?.[2] ?? 0,
            1: data.rating1Count ?? data.ratingBreakdown?.[1] ?? 0,
          },
        })
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to retrieve reviews.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setSearchQuery(searchInput.trim())
  }

  const handleResetSearch = () => {
    setSearchInput('')
    setSearchQuery('')
    setSelectedRating('ALL')
  }

  const handleDeleteConfirm = async () => {
    const { review } = deleteModal
    if (!review) return
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }))
      await deleteAdminReview(review.id)
      setSuccessMsg(`Review #${review.id} deleted successfully.`)
      setDeleteModal({ open: false, review: null, loading: false })
      fetchReviews()
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete review.')
      setDeleteModal((prev) => ({ ...prev, loading: false }))
    }
  }

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    if (selectedRating !== 'ALL' && String(r.rating) !== selectedRating) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const commentMatch = r.comment?.toLowerCase().includes(q)
      const authorMatch = r.customerName?.toLowerCase().includes(q)
      const prodMatch = r.productTitle?.toLowerCase().includes(q)
      if (!commentMatch && !authorMatch && !prodMatch) return false
    }
    return true
  })

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
                color: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Star size={24} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
              Reviews & Moderation
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.925rem' }}>
            Monitor product ratings across the platform, verify customer feedback integrity, and moderate inappropriate submissions.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={fetchReviews}
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
              AVERAGE RATING
            </span>
            <Star size={18} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
            {summary.averageRating > 0 ? summary.averageRating.toFixed(1) : '—'} / 5.0
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>Platform average score</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
              TOTAL REVIEWS
            </span>
            <MessageSquare size={18} style={{ color: 'var(--color-primary-light)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
            {summary.totalReviews}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>Submitted customer ratings</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
              5-STAR RATINGS
            </span>
            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#10b981' }}>
            {summary.ratingBreakdown[5] || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>Maximum satisfaction</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
              CRITICAL REVIEWS (1-2★)
            </span>
            <AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-danger)' }}>
            {(summary.ratingBreakdown[1] || 0) + (summary.ratingBreakdown[2] || 0)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>Requires attention</span>
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
          {RATING_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedRating(f.id)}
              className={`btn ${selectedRating === f.id ? 'btn-primary' : 'btn-secondary'}`}
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
              placeholder="Search feedback or customer..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '100%', fontSize: '0.875rem' }}
            />
          </div>
          <button type="submit" className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.875rem' }}>
            Search
          </button>
          {(searchQuery || selectedRating !== 'ALL') && (
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

      {/* ── Reviews Feed / Table ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-disabled)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Loading customer reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <MessageSquare size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.35 }} />
            <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-text-primary)' }}>
              No reviews found
            </p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--color-text-disabled)' }}>
              {searchQuery || selectedRating !== 'ALL'
                ? 'Try adjusting your rating filter or search term.'
                : 'No reviews have been submitted for platform products yet.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredReviews.map((r) => {
              const stars = Array.from({ length: 5 }, (_, i) => i < (r.rating || 5))

              return (
                <div
                  key={r.id}
                  style={{
                    padding: '1.25rem',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {stars.map((filled, idx) => (
                          <Star
                            key={idx}
                            size={16}
                            style={{
                              color: filled ? '#f59e0b' : 'var(--color-border)',
                              fill: filled ? '#f59e0b' : 'transparent',
                            }}
                          />
                        ))}
                      </div>
                      <span style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                        {r.title || 'Verified Purchase Feedback'}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: '0 0 0.75rem' }}>
                      {r.comment || 'No textual feedback provided.'}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.75rem', color: 'var(--color-text-disabled)', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <User size={12} />
                        <span>{r.customerName || 'Verified Customer'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Package size={12} />
                        <span>Product #{r.productId}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={12} />
                        <span>{formatDate(r.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn btn-secondary"
                    onClick={() => setDeleteModal({ open: true, review: r, loading: false })}
                    title="Moderate / Delete Inappropriate Review"
                    style={{
                      padding: '0.4rem 0.65rem',
                      fontSize: '0.75rem',
                      color: 'var(--color-danger)',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Remove</span>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Delete Modal ── */}
      {deleteModal.open && (
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
              Remove Review?
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Are you sure you want to delete this customer review? This will permanently remove the rating and comment from the product page.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteModal({ open: false, review: null, loading: false })}
                disabled={deleteModal.loading}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
                disabled={deleteModal.loading}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {deleteModal.loading && <Loader2 size={16} className="animate-spin" />}
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reviews

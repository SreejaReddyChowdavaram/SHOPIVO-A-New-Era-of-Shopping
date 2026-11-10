/**
 * Reviews.jsx — Seller Product Reviews & Ratings Management
 * Route: /seller/reviews
 * Layout: SellerLayout
 */

import { useState, useEffect, useMemo } from 'react'
import {
  Star,
  MessageSquare,
  CheckCircle2,
  Search,
  RotateCw,
  Package,
  AlertCircle,
  Calendar,
  ThumbsUp,
  Sparkles,
} from 'lucide-react'
import { getSellerReviews } from '../../services/reviewService'

const Reviews = () => {
  const [data, setData] = useState({
    averageRating: 0,
    totalReviews: 0,
    rating5Count: 0,
    rating4Count: 0,
    rating3Count: 0,
    rating2Count: 0,
    rating1Count: 0,
    reviews: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedRating, setSelectedRating] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  const fetchReviews = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getSellerReviews()
      if (res) {
        setData(res)
      }
    } catch (err) {
      console.error('Failed to load seller reviews:', err)
      setError(err?.response?.data?.message || 'Failed to load reviews. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const filteredReviews = useMemo(() => {
    if (!data?.reviews) return []

    let list = [...data.reviews]

    // Rating filter
    if (selectedRating !== 'ALL') {
      const r = Number(selectedRating)
      list = list.filter((rev) => rev.rating === r)
    }

    // Search query filter (product name, customer name, review text)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (rev) =>
          (rev.productName && rev.productName.toLowerCase().includes(q)) ||
          (rev.customerName && rev.customerName.toLowerCase().includes(q)) ||
          (rev.reviewText && rev.reviewText.toLowerCase().includes(q))
      )
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt)
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt)
      }
      if (sortBy === 'highest') {
        return b.rating - a.rating
      }
      if (sortBy === 'lowest') {
        return a.rating - b.rating
      }
      return 0
    })

    return list
  }, [data?.reviews, selectedRating, searchQuery, sortBy])

  const totalReviews = data.totalReviews || 0
  const avgRating = data.averageRating ? Number(data.averageRating).toFixed(1) : '0.0'
  const positiveReviews = (data.rating5Count || 0) + (data.rating4Count || 0)
  const positivePercentage = totalReviews > 0 ? Math.round((positiveReviews / totalReviews) * 100) : 100

  const ratingCounts = {
    5: data.rating5Count || 0,
    4: data.rating4Count || 0,
    3: data.rating3Count || 0,
    2: data.rating2Count || 0,
    1: data.rating1Count || 0,
  }

  const renderStars = (rating, size = 16) => {
    return (
      <div style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={size}
            style={{
              color: s <= rating ? '#f59e0b' : 'var(--color-border)',
              fill: s <= rating ? '#f59e0b' : 'none',
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ paddingBottom: '2.5rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              color: 'var(--color-text-primary)',
              margin: '0 0 0.35rem 0',
            }}
          >
            Customer Reviews &amp; Ratings
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.875rem' }}>
            Monitor verified customer feedback and rating performance across all your store's products.
          </p>
        </div>

        <button
          onClick={fetchReviews}
          disabled={loading}
          className="btn btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            fontWeight: '600',
          }}
        >
          <RotateCw size={15} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--color-error)',
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Rating Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginRight: '0.25rem' }}>
            Filter:
          </span>
          <button
            onClick={() => setSelectedRating('ALL')}
            style={{
              padding: '0.375rem 0.875rem',
              borderRadius: '999px',
              fontSize: '0.8125rem',
              fontWeight: selectedRating === 'ALL' ? '700' : '500',
              backgroundColor: selectedRating === 'ALL' ? 'var(--color-primary)' : 'var(--color-bg-subtle, rgba(0,0,0,0.04))',
              color: selectedRating === 'ALL' ? '#ffffff' : 'var(--color-text-primary)',
              border: '1px solid',
              borderColor: selectedRating === 'ALL' ? 'var(--color-primary)' : 'var(--color-border)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            All ({totalReviews})
          </button>
          {[5, 4, 3, 2, 1].map((s) => {
            const count = ratingCounts[s]
            const active = selectedRating === s
            return (
              <button
                key={s}
                onClick={() => setSelectedRating(s)}
                style={{
                  padding: '0.375rem 0.875rem',
                  borderRadius: '999px',
                  fontSize: '0.8125rem',
                  fontWeight: active ? '700' : '500',
                  backgroundColor: active ? 'var(--color-primary)' : 'var(--color-bg-subtle, rgba(0,0,0,0.04))',
                  color: active ? '#ffffff' : 'var(--color-text-primary)',
                  border: '1px solid',
                  borderColor: active ? 'var(--color-primary)' : 'var(--color-border)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{s}</span>
                <Star size={13} style={{ color: active ? '#ffffff' : '#f59e0b', fill: active ? '#ffffff' : '#f59e0b' }} />
                <span>({count})</span>
              </button>
            )
          })}
        </div>

        {/* Search & Sort Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-secondary)',
              }}
            />
            <input
              type="text"
              placeholder="Search reviews or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.75rem 0.45rem 2.25rem',
                fontSize: '0.8125rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-primary, var(--color-surface))',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              width: 'auto',
              minWidth: '140px',
              padding: '0.45rem 0.75rem',
              fontSize: '0.8125rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-primary, var(--color-surface))',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {/* Rating Breakdown Card */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
            gridColumn: 'span 2',
          }}
        >
          <h2
            style={{
              fontSize: '1.05rem',
              fontWeight: '600',
              color: 'var(--color-text-primary)',
              margin: '0 0 1.25rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
            Overall Store Rating Overview
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              alignItems: 'center',
            }}
          >
            {/* Big Score Box */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-bg-subtle, rgba(0, 0, 0, 0.02))',
                border: '1px solid var(--color-border)',
              }}
            >
              <div
                style={{
                  fontSize: '3.25rem',
                  fontWeight: '800',
                  color: 'var(--color-text-primary)',
                  lineHeight: '1',
                  marginBottom: '0.5rem',
                }}
              >
                {avgRating}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>{renderStars(Math.round(data.averageRating || 0), 20)}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                Based on <strong style={{ color: 'var(--color-text-primary)' }}>{totalReviews}</strong> verified{' '}
                {totalReviews === 1 ? 'review' : 'reviews'}
              </div>
            </div>

            {/* Star Distribution Progress Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingCounts[star]
                const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
                return (
                  <div
                    key={star}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      fontSize: '0.8125rem',
                    }}
                  >
                    <span
                      style={{
                        minWidth: '42px',
                        color: 'var(--color-text-secondary)',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      {star} <Star size={13} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: '8px',
                        borderRadius: '999px',
                        backgroundColor: 'var(--color-border)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          borderRadius: '999px',
                          backgroundColor: star >= 4 ? '#10b981' : star === 3 ? '#f59e0b' : '#ef4444',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        minWidth: '60px',
                        textAlign: 'right',
                        color: 'var(--color-text-secondary)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {count} ({pct}%)
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Quick Highlights Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ThumbsUp size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                Customer Satisfaction
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                {positivePercentage}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '500' }}>
                4 &amp; 5 star ratings
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'var(--color-primary-subtle)',
                color: 'var(--color-nav-active-text, var(--color-primary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                Total Reviews
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                {totalReviews}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Customer feedback count
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Reviews List */}
      {loading ? (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <RotateCw size={28} className="spin" style={{ color: 'var(--color-primary)', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Loading customer reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '4rem 1.5rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-bg-subtle, rgba(0, 0, 0, 0.04))',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <MessageSquare size={26} />
          </div>
          <h3
            style={{
              fontSize: '1.15rem',
              fontWeight: '700',
              color: 'var(--color-text-primary)',
              marginBottom: '0.5rem',
            }}
          >
            {totalReviews === 0 ? 'No Reviews Received Yet' : 'No Reviews Found'}
          </h3>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: '0.875rem',
              maxWidth: '460px',
              margin: '0 auto 1.5rem',
              lineHeight: '1.5',
            }}
          >
            {totalReviews === 0
              ? 'When verified customers receive their orders, their ratings and reviews will appear here in real-time.'
              : 'No reviews matched your active filters or search terms. Try clearing your search or selecting another rating.'}
          </p>
          {(selectedRating !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedRating('ALL')
                setSearchQuery('')
              }}
              className="btn btn-secondary"
              style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredReviews.map((review) => {
            const initial = review.customerName ? review.customerName.charAt(0).toUpperCase() : 'C'
            const formattedDate = review.createdAt
              ? new Date(review.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Recent'

            return (
              <div
                key={review.id}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem 1.5rem',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'border-color 0.2s ease',
                }}
              >
                {/* Review Header: User info, Product, Date */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    marginBottom: '0.875rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary-subtle, rgba(59, 130, 246, 0.15))',
                        color: 'var(--color-primary)',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {initial}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '0.925rem',
                          fontWeight: '600',
                          color: 'var(--color-text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        {review.customerName || 'Verified Customer'}
                        {review.verifiedPurchase && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              color: '#10b981',
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              padding: '2px 7px',
                              borderRadius: '999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <CheckCircle2 size={11} />
                            Verified Buyer
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          fontSize: '0.75rem',
                          color: 'var(--color-text-secondary)',
                          marginTop: '2px',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Calendar size={12} />
                          {formattedDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Product Badge */}
                  {review.productName && (
                    <div
                      style={{
                        fontSize: '0.775rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-bg-subtle, rgba(0, 0, 0, 0.04))',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        maxWidth: '260px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={review.productName}
                    >
                      <Package size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{review.productName}</span>
                    </div>
                  )}
                </div>

                {/* Rating Stars */}
                <div style={{ marginBottom: '0.75rem' }}>{renderStars(review.rating, 16)}</div>

                {/* Review Text */}
                <p
                  style={{
                    color: 'var(--color-text-primary)',
                    fontSize: '0.875rem',
                    lineHeight: '1.6',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {review.reviewText}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Reviews

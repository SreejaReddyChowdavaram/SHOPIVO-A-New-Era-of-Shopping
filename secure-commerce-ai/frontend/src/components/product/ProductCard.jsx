/**
 * ProductCard.jsx — Modern Clean Marketplace Product Card
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, ShoppingCart, Star, Check } from 'lucide-react'
import { resolveImageUrl } from '@/utils/imageUtils'

const ProductCard = ({
  product,
  wishlistItemId = null,
  onWishlistToggle,
  onAddToCart,
}) => {
  const navigate = useNavigate()
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const [addedFeedback, setAddedFeedback] = useState(false)

  const isInWishlist = wishlistItemId !== null
  const isOutOfStock = product.stockQuantity === 0
  const isLowStock = !isOutOfStock && product.stockQuantity <= 5

  // Consistent rating and MRP for demo
  const ratingScore = product.rating || (4.0 + (product.id % 10) * 0.1).toFixed(1)
  const reviewCount = product.reviewCount || (24 + (product.id * 17) % 380)
  const discountPercent = product.discountPercent || (15 + (product.id * 7) % 45)
  const mrpPrice = Math.round(product.price * (1 + discountPercent / 100))

  const handleWishlistClick = async (e) => {
    e.stopPropagation()
    if (!onWishlistToggle || wishlistLoading) return
    setWishlistLoading(true)
    try {
      await onWishlistToggle(product.id, wishlistItemId)
    } finally {
      setWishlistLoading(false)
    }
  }

  const handleAddToCart = async (e) => {
    e.stopPropagation()
    if (!onAddToCart || cartLoading || isOutOfStock) return
    setCartLoading(true)
    try {
      await onAddToCart(product.id)
      setAddedFeedback(true)
      setTimeout(() => setAddedFeedback(false), 1800)
    } finally {
      setCartLoading(false)
    }
  }

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)

  return (
    <div
      onClick={() => navigate(`/customer/products/${product.id}`)}
      className="card card-interactive"
      style={{
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        height: '100%',
        transition: 'background-color var(--transition-normal), border-color var(--transition-normal), transform var(--transition-fast)',
      }}
    >
      {/* 1. Product Image Frame */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1/1',
          overflow: 'hidden',
          backgroundColor: 'var(--color-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}
      >
        <img
          src={resolveImageUrl(product.imageUrl) || `https://placehold.co/400x400/ffffff/087847?text=${encodeURIComponent(product.name.slice(0, 15))}`}
          alt={product.name}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            transition: 'transform 0.25s ease',
          }}
          onError={(e) => {
            e.target.src = `https://placehold.co/400x400/ffffff/087847?text=${encodeURIComponent(product.name.slice(0, 12))}`
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        />

        {/* Stock Badge Overlay */}
        {isOutOfStock ? (
          <span
            style={{
              position: 'absolute', top: '10px', left: '10px',
              backgroundColor: 'var(--color-danger)', color: '#ffffff',
              fontSize: '0.65rem', fontWeight: '700', padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-xs)', zIndex: 2,
            }}
          >
            OUT OF STOCK
          </span>
        ) : isLowStock ? (
          <span
            style={{
              position: 'absolute', top: '10px', left: '10px',
              backgroundColor: 'var(--color-warning)', color: '#ffffff',
              fontSize: '0.65rem', fontWeight: '700', padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-xs)', zIndex: 2,
            }}
          >
            ONLY {product.stockQuantity} LEFT
          </span>
        ) : null}

        {/* Wishlist Heart Icon */}
        {onWishlistToggle && (
          <button
            onClick={handleWishlistClick}
            disabled={wishlistLoading}
            title={isInWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 3,
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform 0.15s ease, background-color var(--transition-normal)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Heart
              size={15}
              fill={isInWishlist ? '#ef4444' : 'none'}
              color={isInWishlist ? '#ef4444' : '#94a3b8'}
            />
          </button>
        )}
      </div>

      {/* Product Content Body */}
      <div style={{ padding: '0.85rem 1rem 1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Product Name */}
        <h3
          style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--color-text-primary)',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.45rem',
            marginBottom: '0.4rem',
          }}
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Star Rating & Review Count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.45rem' }}>
          <span className="badge-rating">
            <span>{ratingScore}</span>
            <Star size={10} fill="#ffffff" strokeWidth={0} />
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>
            ({reviewCount})
          </span>
        </div>

        {/* Price Row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
            {formatPrice(product.price)}
          </span>
          <span style={{ fontSize: '0.775rem', color: 'var(--color-text-secondary)', textDecoration: 'line-through' }}>
            {formatPrice(mrpPrice)}
          </span>
          <span style={{ fontSize: '0.775rem', color: 'var(--color-discount)', fontWeight: '700' }}>
            {discountPercent}% off
          </span>
        </div>

        {/* Delivery Line */}
        <div style={{ fontSize: '0.725rem', color: 'var(--color-text-secondary)', marginBottom: '0.85rem' }}>
          Free delivery
        </div>

        {/* Add to Cart Button */}
        {onAddToCart && (
          <div style={{ marginTop: 'auto', paddingTop: '0.25rem' }}>
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || cartLoading}
              className={addedFeedback ? 'btn btn-success' : 'btn btn-primary'}
              style={{
                width: '100%',
                fontSize: '0.8125rem',
                height: '36px',
                padding: '0 0.5rem',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {cartLoading ? (
                <span style={{ display: 'inline-block', width: '13px', height: '13px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
              ) : addedFeedback ? (
                <><Check size={14} /> Added to Cart</>
              ) : isOutOfStock ? (
                'Out of Stock'
              ) : (
                <><ShoppingCart size={14} /> Add to Cart</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductCard

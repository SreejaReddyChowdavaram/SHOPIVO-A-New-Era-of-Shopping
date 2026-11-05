/**
 * Wishlist.jsx — Customer Saved Wishlist Page (Light Marketplace Style)
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Heart, ShoppingCart, Trash2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { getWishlist, removeItem, moveToCart as moveItemToCart } from '@/services/wishlistService'
import { updateCartSummary } from '@/store/cartSlice'
import { getCart } from '@/services/cartService'
import { ROUTES } from '@/constants/routes'

const Wishlist = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [wishlist, setWishlist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [movingItemId, setMovingItemId] = useState(null)
  const [removingItemId, setRemovingItemId] = useState(null)
  const [moveSuccess, setMoveSuccess] = useState(null)

  const fetchWishlist = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getWishlist()
      setWishlist(data)
    } catch (err) {
      setError(err.message || 'Could not load wishlist')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWishlist()
  }, [])

  const handleRemove = async (itemId) => {
    setRemovingItemId(itemId)
    try {
      const updated = await removeItem(itemId)
      setWishlist(updated)
    } catch (err) {
      setError(err.message || 'Could not remove item')
      setTimeout(() => setError(null), 3000)
    } finally {
      setRemovingItemId(null)
    }
  }

  const handleMoveToCart = async (itemId, productName) => {
    setMovingItemId(itemId)
    try {
      const updatedWishlist = await moveItemToCart(itemId)
      setWishlist(updatedWishlist)
      const cart = await getCart()
      dispatch(updateCartSummary({ itemCount: cart.totalItems, subtotal: cart.subtotal }))
      setMoveSuccess(`"${productName}" moved to cart!`)
      setTimeout(() => setMoveSuccess(null), 2500)
    } catch (err) {
      setError(err.message || 'Could not move to cart')
      setTimeout(() => setError(null), 3000)
    } finally {
      setMovingItemId(null)
    }
  }

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)

  if (loading) {
    return (
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh', flexDirection: 'column', gap: '0.75rem', color: 'var(--color-text-secondary)' }}>
        <Loader2 size={32} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--color-primary)' }} />
        <span>Loading wishlist...</span>
      </div>
    )
  }

  const isEmpty = !wishlist || wishlist.items.length === 0

  return (
    <div className="fade-in">
      {/* Header */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
          My Wishlist ({isEmpty ? 0 : wishlist.totalItems})
        </h1>
      </div>

      {/* Success toast */}
      {moveSuccess && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--color-discount)', backgroundColor: 'var(--color-discount-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1.25rem', border: '1px solid rgba(22,163,74,0.3)', marginBottom: '1.25rem', fontSize: '0.875rem', fontWeight: '600' }}>
          <CheckCircle2 size={18} />
          <span>{moveSuccess}</span>
          <Link to={ROUTES.CUSTOMER_CART} style={{ marginLeft: 'auto', color: 'var(--color-discount)', fontWeight: '700', textDecoration: 'none' }}>View Cart →</Link>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1.25rem', border: '1px solid rgba(239,68,68,0.25)', marginBottom: '1.25rem', fontSize: '0.875rem', fontWeight: '600' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Empty state */}
      {isEmpty ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '4rem 1.5rem',
          }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--color-text-muted)' }}>
            <Heart size={28} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--color-text-primary)' }}>
            Your wishlist is empty
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            Explore items you love and save them here for later purchase.
          </p>
          <Link to={ROUTES.CUSTOMER_PRODUCTS} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
            Browse Catalog
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1.25rem' }}>
          {wishlist.items.map((item) => (
            <div
              key={item.itemId}
              className="card card-interactive"
              style={{
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                opacity: removingItemId === item.itemId || movingItemId === item.itemId ? 0.5 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {/* Image Frame */}
              <div
                style={{
                  aspectRatio: '1/1',
                  overflow: 'hidden',
                  backgroundColor: 'var(--color-surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem',
                  borderBottom: '1px solid var(--color-border-subtle)',
                }}
                onClick={() => navigate(`/customer/products/${item.product.id}`)}
              >
                <img
                  src={item.product.imageUrl || `https://placehold.co/300x300/ffffff/2874f0?text=P`}
                  alt={item.product.name}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transition: 'transform var(--transition-fast)' }}
                  onError={(e) => { e.target.src = `https://placehold.co/300x300/ffffff/2874f0?text=P` }}
                />
              </div>

              {/* Content */}
              <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <h3
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '2.45rem',
                    color: 'var(--color-text-primary)',
                    margin: 0,
                  }}
                  onClick={() => navigate(`/customer/products/${item.product.id}`)}
                >
                  {item.product.name}
                </h3>

                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-text-primary)', marginTop: 'auto', paddingTop: '0.35rem' }}>
                  {formatPrice(item.product.price)}
                </div>

                {item.product.stockQuantity === 0 ? (
                  <span className="badge badge-danger" style={{ alignSelf: 'flex-start', fontSize: '0.65rem' }}>Out of Stock</span>
                ) : item.product.stockQuantity <= 5 ? (
                  <span className="badge badge-warning" style={{ alignSelf: 'flex-start', fontSize: '0.65rem' }}>Only {item.product.stockQuantity} left</span>
                ) : null}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
                  <button
                    id={`move-to-cart-${item.itemId}`}
                    className="btn btn-primary"
                    onClick={() => handleMoveToCart(item.itemId, item.product.name)}
                    disabled={movingItemId === item.itemId || item.product.stockQuantity === 0}
                    style={{ flex: 1, fontSize: '0.8125rem', height: '36px', gap: '0.35rem' }}
                  >
                    {movingItemId === item.itemId ? (
                      <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                    ) : (
                      <><ShoppingCart size={14} /> Move to Cart</>
                    )}
                  </button>

                  <button
                    className="btn btn-secondary"
                    title="Remove from wishlist"
                    onClick={() => handleRemove(item.itemId)}
                    disabled={removingItemId === item.itemId}
                    style={{ width: '36px', height: '36px', padding: 0 }}
                  >
                    <Trash2 size={15} color="var(--color-text-secondary)" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Wishlist

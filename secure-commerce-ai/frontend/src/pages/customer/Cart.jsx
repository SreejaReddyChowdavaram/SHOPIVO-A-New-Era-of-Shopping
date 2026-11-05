/**
 * Cart.jsx — Dense Marketplace Shopping Cart (Amazon/Flipkart Style)
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import {
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  ArrowRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Lock,
  ArrowLeft
} from 'lucide-react'
import { getCart, updateQuantity, removeItem, clearCart } from '@/services/cartService'
import { updateCartSummary, clearCartSummary } from '@/store/cartSlice'
import { ROUTES } from '@/constants/routes'

const Cart = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingItemId, setUpdatingItemId] = useState(null)
  const [removingItemId, setRemovingItemId] = useState(null)

  const fetchCart = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getCart()
      setCart(data)
      dispatch(updateCartSummary({ itemCount: data.totalItems, subtotal: data.subtotal }))
    } catch (err) {
      setError(err.message || 'Could not load cart')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCart()
  }, [])

  const handleQuantityChange = async (itemId, currentQty, delta) => {
    const newQty = currentQty + delta
    if (newQty < 1) return handleRemove(itemId)

    setUpdatingItemId(itemId)
    try {
      const updatedCart = await updateQuantity(itemId, newQty)
      setCart(updatedCart)
      dispatch(updateCartSummary({ itemCount: updatedCart.totalItems, subtotal: updatedCart.subtotal }))
    } catch (err) {
      setError(err.message || 'Could not update quantity')
      setTimeout(() => setError(null), 3000)
    } finally {
      setUpdatingItemId(null)
    }
  }

  const handleRemove = async (itemId) => {
    setRemovingItemId(itemId)
    try {
      const updatedCart = await removeItem(itemId)
      setCart(updatedCart)
      dispatch(updateCartSummary({ itemCount: updatedCart.totalItems, subtotal: updatedCart.subtotal }))
    } catch (err) {
      setError(err.message || 'Could not remove item')
      setTimeout(() => setError(null), 3000)
    } finally {
      setRemovingItemId(null)
    }
  }

  const handleClearCart = async () => {
    if (!window.confirm('Remove all items from your cart?')) return
    try {
      await clearCart()
      setCart((prev) => ({ ...prev, items: [], subtotal: 0, totalItems: 0 }))
      dispatch(clearCartSummary())
    } catch (err) {
      setError('Could not clear cart')
    }
  }

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)

  if (loading) {
    return (
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', flexDirection: 'column', gap: '0.75rem', color: 'var(--color-text-secondary)' }}>
        <Loader2 size={32} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--color-primary)' }} />
        <span>Loading your cart...</span>
      </div>
    )
  }

  const isEmpty = !cart || cart.items.length === 0

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Error Toast */}
      {error && (
        <div
          className="fade-in"
          style={{
            backgroundColor: 'var(--color-danger-subtle)',
            border: '1px solid rgba(211, 47, 47, 0.3)',
            color: 'var(--color-danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.8125rem',
            fontWeight: '600',
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {isEmpty ? (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xs)',
            textAlign: 'center',
            padding: '4rem 1.5rem',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: 'var(--color-primary)',
            }}
          >
            <ShoppingBag size={36} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--color-text-primary)' }}>
            Your Cart is Empty
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '380px', margin: '0 auto 1.5rem', fontSize: '0.875rem', lineHeight: 1.5 }}>
            Explore our curated marketplace catalog and add items to your shopping bag.
          </p>
          <Link to={ROUTES.CUSTOMER_PRODUCTS} className="btn btn-primary" style={{ padding: '0.65rem 1.75rem', borderRadius: 'var(--radius-sm)' }}>
            Shop Now
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 360px',
            gap: '1.5rem',
            alignItems: 'start',
          }}
          className="account-layout-grid"
        >
          {/* ── Left: Cart Line Items ── */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-xs)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h1 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
                Shopping Cart ({cart.totalItems} items)
              </h1>
              <button
                onClick={handleClearCart}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-danger)',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                Clear Cart
              </button>
            </div>

            {/* Line Items List */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {cart.items.map((item, idx) => (
                <div
                  key={item.itemId}
                  style={{
                    padding: '1.25rem 1.5rem',
                    display: 'grid',
                    gridTemplateColumns: '88px minmax(0, 1fr) auto',
                    gap: '1.25rem',
                    alignItems: 'start',
                    borderBottom: idx !== cart.items.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                    opacity: removingItemId === item.itemId ? 0.4 : 1,
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: '88px',
                      height: '88px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'var(--color-surface)',
                      padding: '0.35rem',
                    }}
                    onClick={() => navigate(`/customer/products/${item.product.id}`)}
                  >
                    <img
                      src={item.product.imageUrl || `https://placehold.co/88x88/ffffff/2563eb?text=P`}
                      alt={item.product.name}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      onError={(e) => { e.target.src = `https://placehold.co/88x88/ffffff/2563eb?text=P` }}
                    />
                  </div>

                  {/* Info + Stepper */}
                  <div>
                    <h3
                      onClick={() => navigate(`/customer/products/${item.product.id}`)}
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                        lineHeight: 1.4,
                        marginBottom: '0.25rem',
                      }}
                    >
                      {item.product.name}
                    </h3>
                    {item.product.categoryName && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>
                        {item.product.categoryName}
                      </span>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Qty:</span>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface)' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ width: '28px', height: '28px', padding: 0, border: 'none', borderRadius: 0 }}
                          onClick={() => handleQuantityChange(item.itemId, item.quantity, -1)}
                          disabled={updatingItemId === item.itemId}
                        >
                          <Minus size={12} />
                        </button>

                        {updatingItemId === item.itemId ? (
                          <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--color-primary)', margin: '0 6px' }} />
                        ) : (
                          <span style={{ fontWeight: '700', fontSize: '0.8125rem', minWidth: '32px', textAlign: 'center' }}>
                            {item.quantity}
                          </span>
                        )}

                        <button
                          className="btn btn-secondary"
                          style={{ width: '28px', height: '28px', padding: 0, border: 'none', borderRadius: 0 }}
                          onClick={() => handleQuantityChange(item.itemId, item.quantity, 1)}
                          disabled={updatingItemId === item.itemId || item.quantity >= item.product.stockQuantity}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemove(item.itemId)}
                        disabled={removingItemId === item.itemId}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-text-secondary)',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          marginLeft: '0.5rem',
                          textTransform: 'uppercase',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
                      >
                        REMOVE
                      </button>
                    </div>
                  </div>

                  {/* Price Block */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                      {formatPrice(item.lineTotal)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                      {formatPrice(item.priceAtAddition)} each
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Sticky Price Details Sidebar ── */}
          <div style={{ position: 'sticky', top: '80px' }}>
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-xs)',
                padding: '1.5rem',
              }}
            >
              <h2 style={{ fontSize: '0.8125rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                Price Details
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-primary)' }}>
                  <span>Price ({cart.totalItems} items)</span>
                  <span style={{ fontWeight: '600' }}>{formatPrice(cart.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-primary)' }}>
                  <span>Delivery Charges</span>
                  <span style={{ color: 'var(--color-discount)', fontWeight: '700' }}>FREE</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-primary)' }}>
                  <span>Total Taxes</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Included</span>
                </div>
              </div>

              <div style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>Total Amount</span>
                <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                  {formatPrice(cart.subtotal)}
                </span>
              </div>

              {/* Proceed to Checkout CTA */}
              <Link
                id="proceed-to-checkout-btn"
                to={ROUTES.CUSTOMER_CHECKOUT}
                className="btn btn-deal"
                style={{
                  width: '100%',
                  height: '46px',
                  fontSize: '0.9375rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <span>PLACE ORDER</span>
                <ArrowRight size={16} />
              </Link>

              {/* Safe Payments Trust Banner */}
              <div
                style={{
                  marginTop: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.75rem',
                  borderTop: '1px solid var(--color-border-subtle)',
                  paddingTop: '0.85rem',
                }}
              >
                <ShieldCheck size={18} color="var(--color-discount)" style={{ flexShrink: 0 }} />
                <span>Safe and Secure Payments. 100% Authentic products.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cart

/**
 * Dashboard.jsx — Authenticated Customer Marketplace Homepage & Discovery Engine
 * Stage 1B UI/UX Redesign
 *
 * SPECIFICATION HIERARCHY:
 * 1. Compact Personalized Greeting & Quick-Action Bar
 * 2. Horizontally Swipeable (Mobile) / Grid (Desktop) Category Discovery
 * 3. Commercial Promotional Hero Banner with Authentic Marketplace Metadata
 * 4. Recent Order Quick-Access Tracking Card (with empty state fallback)
 * 5. Featured Marketplace Deals & Flash Selections
 * 6. Trending Marketplace Arrivals (Real Catalog Data)
 * 7. Recently Viewed History (Client-side localStorage)
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Smartphone,
  Tv,
  Shirt,
  Home,
  BookOpen,
  Dumbbell,
  Gamepad2,
  Package,
  ShieldCheck,
  Truck,
  AlertCircle,
  Zap,
  Flame,
  ChevronRight,
  TrendingUp,
  History,
  Heart,
  RefreshCw,
  Clock,
  CheckCircle2,
  Layers,
} from 'lucide-react'
import { getProducts, getCategories } from '@/services/productService'
import { getMyOrders } from '@/services/orderService'
import { addItem as cartAdd } from '@/services/cartService'
import { addItem as wishlistAdd, removeItem as wishlistRemove, getWishlist } from '@/services/wishlistService'
import { updateCartSummary } from '@/store/cartSlice'
import { selectCurrentUser } from '@/store/authSlice'
import { ROUTES } from '@/constants/routes'
import ProductCard from '@/components/product/ProductCard'

// ── Category Icon Mapping ─────────────────────────────────────
const CATEGORY_ICONS = {
  mobiles: Smartphone,
  mobile: Smartphone,
  electronics: Tv,
  electronic: Tv,
  fashion: Shirt,
  clothing: Shirt,
  home: Home,
  'home & kitchen': Home,
  appliances: Tv,
  beauty: Sparkles,
  'beauty & personal care': Sparkles,
  books: BookOpen,
  sports: Dumbbell,
  'sports & fitness': Dumbbell,
  toys: Gamepad2,
}

const getCategoryIcon = (categoryName) => {
  if (!categoryName) return Package
  const key = categoryName.toLowerCase().trim()
  return CATEGORY_ICONS[key] || Package
}

const CustomerDashboard = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector(selectCurrentUser)

  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [wishlistItems, setWishlistItems] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [recentlyViewed, setRecentlyViewed] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retrying, setRetrying] = useState(false)

  // ── Fetch Homepage Data ──────────────────────────────────────
  const loadHomepageData = useCallback(async (isRetry = false) => {
    if (isRetry) setRetrying(true)
    else setLoading(true)
    setError(null)

    try {
      const [productPage, categoryList, orderList, wishlistData] = await Promise.allSettled([
        getProducts({ page: 0, size: 16 }),
        getCategories(),
        user ? getMyOrders() : Promise.resolve([]),
        user ? getWishlist() : Promise.resolve({ items: [] }),
      ])

      // Handle Products
      if (productPage.status === 'fulfilled') {
        const val = productPage.value
        if (val && val.content && Array.isArray(val.content)) {
          setProducts(val.content)
        } else if (Array.isArray(val)) {
          setProducts(val)
        }
      }

      // Handle Categories
      if (categoryList.status === 'fulfilled' && Array.isArray(categoryList.value)) {
        setCategories(categoryList.value)
      }

      // Handle Orders
      if (orderList.status === 'fulfilled' && Array.isArray(orderList.value)) {
        setRecentOrders(orderList.value.slice(0, 2))
      }

      // Handle Wishlist
      if (wishlistData.status === 'fulfilled' && wishlistData.value?.items) {
        setWishlistItems(wishlistData.value.items)
      }

      // Load client-side recently viewed
      try {
        const storedViewed = JSON.parse(localStorage.getItem('sc_recently_viewed') || '[]')
        setRecentlyViewed(Array.isArray(storedViewed) ? storedViewed.slice(0, 6) : [])
      } catch {
        setRecentlyViewed([])
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load marketplace dashboard.')
    } finally {
      setLoading(false)
      setRetrying(false)
    }
  }, [user])

  useEffect(() => {
    loadHomepageData()
  }, [loadHomepageData])

  // ── Cart Action Handler ─────────────────────────────────────
  const handleAddToCart = async (productId) => {
    if (!user) {
      navigate(ROUTES.LOGIN)
      return
    }
    const updatedCart = await cartAdd(productId, 1)
    if (updatedCart) {
      dispatch(
        updateCartSummary({
          itemCount: updatedCart.totalItems ?? updatedCart.itemCount ?? 0,
          subtotal: updatedCart.totalAmount ?? updatedCart.subtotal ?? 0,
        })
      )
    }
  }

  // ── Wishlist Action Handler ─────────────────────────────────
  const handleWishlistToggle = async (productId, currentWishlistItemId) => {
    if (!user) {
      navigate(ROUTES.LOGIN)
      return
    }
    if (currentWishlistItemId) {
      await wishlistRemove(productId)
      setWishlistItems((prev) =>
        prev.filter((item) => (item.product?.id || item.productId) !== productId && item.itemId !== currentWishlistItemId)
      )
    } else {
      const updatedWishlist = await wishlistAdd(productId)
      if (updatedWishlist?.items) {
        setWishlistItems(updatedWishlist.items)
      } else {
        const refreshed = await getWishlist()
        setWishlistItems(refreshed?.items || [])
      }
    }
  }

  const clearRecentlyViewed = (e) => {
    e.stopPropagation()
    try {
      localStorage.removeItem('sc_recently_viewed')
      setRecentlyViewed([])
    } catch {}
  }

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price || 0)

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Split products for deals and trending sections
  const dealsProducts = useMemo(() => products.slice(0, 4), [products])
  const trendingProducts = useMemo(
    () => (products.length > 4 ? products.slice(4, 12) : products),
    [products]
  )

  const customerFirstName = user?.firstName || 'Valued Customer'

  // Order status badge styling
  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return { label: 'Delivered', bg: 'var(--color-success-subtle)', color: 'var(--color-success)', icon: CheckCircle2 }
      case 'SHIPPED':
        return { label: 'Shipped', bg: 'var(--color-info-subtle)', color: 'var(--color-info)', icon: Truck }
      case 'PROCESSING':
        return { label: 'Processing', bg: 'var(--color-primary-subtle)', color: 'var(--color-primary)', icon: Clock }
      case 'CANCELLED':
        return { label: 'Cancelled', bg: 'var(--color-danger-subtle)', color: 'var(--color-danger)', icon: AlertCircle }
      default:
        return { label: status || 'Pending', bg: 'var(--color-warning-subtle)', color: 'var(--color-warning)', icon: Clock }
    }
  }

  return (
    <div className="dashboard-root fade-in">

      {/* ── Error Banner if API Fails ── */}
      {error && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-danger-subtle)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            color: 'var(--color-danger)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{error}</span>
          </div>
          <button
            onClick={() => loadHomepageData(true)}
            disabled={retrying}
            className="btn btn-secondary"
            style={{ fontSize: '0.8125rem', padding: '0.35rem 0.75rem', gap: '0.35rem' }}
          >
            <RefreshCw size={14} className={retrying ? 'spin' : ''} />
            <span>{retrying ? 'Retrying...' : 'Retry'}</span>
          </button>
        </div>
      )}

      {/* ── 1. Compact Personalized Greeting & Quick-Action Bar ── */}
      <div className="dashboard-welcome-card">
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontSize: 'clamp(1.15rem, 2vw, 1.4rem)',
              fontWeight: '800',
              color: 'var(--color-text-primary)',
              margin: '0 0 0.25rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              letterSpacing: '-0.02em',
            }}
          >
            <span>Welcome back, {customerFirstName}</span>
            <span style={{ fontSize: '1.25rem' }}>👋</span>
          </h1>
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            Explore real-time marketplace arrivals, track live orders, and manage your saved items.
          </p>
        </div>

        {/* Quick action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link
            to={ROUTES.CUSTOMER_PRODUCTS}
            className="btn btn-primary"
            style={{
              fontSize: '0.8125rem',
              padding: '0.5rem 0.95rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: '600',
              gap: '0.35rem',
            }}
          >
            <ShoppingBag size={15} />
            <span>Browse Catalog</span>
          </Link>

          <Link
            to={ROUTES.CUSTOMER_ORDERS}
            className="btn btn-secondary"
            style={{
              fontSize: '0.8125rem',
              padding: '0.5rem 0.95rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: '600',
              gap: '0.35rem',
            }}
          >
            <Package size={15} />
            <span>My Orders</span>
          </Link>

          <Link
            to={ROUTES.CUSTOMER_WISHLIST}
            className="btn btn-secondary"
            style={{
              fontSize: '0.8125rem',
              padding: '0.5rem 0.95rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: '600',
              gap: '0.35rem',
            }}
          >
            <Heart size={15} color="var(--color-deal)" />
            <span>Saved ({wishlistItems.length})</span>
          </Link>
        </div>
      </div>

      {/* ── 2. Promotional Hero Banner ── */}
      <div className="dashboard-hero-banner">
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '620px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '0.3rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.725rem',
              fontWeight: '700',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '0.75rem',
              backdropFilter: 'blur(4px)',
            }}
          >
            <Sparkles size={13} color="#fde047" />
            <span>Curated Marketplace Catalog</span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(1.35rem, 3.2vw, 2rem)',
              fontWeight: '800',
              lineHeight: 1.25,
              margin: '0 0 0.6rem 0',
              letterSpacing: '-0.025em',
            }}
          >
            Discover Tech, Fashion &amp; Everyday Essentials
          </h2>

          <p
            style={{
              fontSize: 'clamp(0.8125rem, 1.4vw, 0.925rem)',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: '0 0 1.25rem 0',
              lineHeight: 1.5,
            }}
          >
            Explore multi-vendor listings, verify atomic inventory availability, and enjoy seamless order tracking.
          </p>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <Link
              to={ROUTES.CUSTOMER_PRODUCTS}
              style={{
                backgroundColor: '#ffffff',
                color: '#0F8F6B',
                border: 'none',
                fontWeight: '700',
                fontSize: '0.84rem',
                padding: '0.6rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                transition: 'transform var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <span>Explore Full Catalog</span>
              <ArrowRight size={15} />
            </Link>

            <Link
              to={ROUTES.CUSTOMER_ANALYTICS}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                fontWeight: '600',
                fontSize: '0.84rem',
                padding: '0.6rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                textDecoration: 'none',
                backdropFilter: 'blur(4px)',
                transition: 'background-color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)')}
            >
              <TrendingUp size={15} color="var(--color-primary)" />
              <span>Spending Insights</span>
            </Link>
          </div>
        </div>

        {/* Decorative Watermark Shield */}
        <div
          className="dashboard-hero-watermark"
          style={{
            position: 'absolute',
            right: 0,
            bottom: '-25px',
            opacity: 0.08,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
          aria-hidden="true"
        >
          <ShieldCheck size={240} color="#ffffff" />
        </div>
      </div>

      {/* ── 3. Recent Order Quick-Access Strip ── */}
      {recentOrders.length > 0 ? (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            padding: '1rem 1.35rem',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
          }}
        >
          {(() => {
            const latest = recentOrders[0]
            const badge = getOrderStatusBadge(latest.status)
            const BadgeIcon = badge.icon

            return (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-primary-subtle)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Package size={20} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                        Recent Order #{latest.id}
                      </span>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: '700',
                          padding: '0.15rem 0.55rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: badge.bg,
                          color: badge.color,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          textTransform: 'uppercase',
                        }}
                      >
                        <BadgeIcon size={11} strokeWidth={2.5} />
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '0.2rem 0 0' }}>
                      Placed {formatDate(latest.createdAt)} · {latest.totalItems} item{latest.totalItems !== 1 ? 's' : ''} · Total: <strong style={{ color: 'var(--color-text-primary)' }}>{formatPrice(latest.totalAmount)}</strong>
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <Link
                    to={`/customer/orders/${latest.id}`}
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: '700',
                      color: 'var(--color-primary)',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span>Track Order</span>
                    <ArrowRight size={14} />
                  </Link>

                  <span style={{ color: 'var(--color-border)' }}>|</span>

                  <Link
                    to={ROUTES.CUSTOMER_ORDERS}
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      color: 'var(--color-text-secondary)',
                      textDecoration: 'none',
                    }}
                  >
                    View All Orders
                  </Link>
                </div>
              </>
            )
          })()}
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            padding: '1rem 1.35rem',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface-raised)',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Package size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                No active orders placed yet
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                When you make a purchase, real-time tracking will appear right here.
              </div>
            </div>
          </div>

          <Link
            to={ROUTES.CUSTOMER_PRODUCTS}
            style={{
              fontSize: '0.8125rem',
              fontWeight: '700',
              color: 'var(--color-primary)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span>Start Shopping</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ── 4. Category Discovery ── */}
      <section aria-labelledby="category-discovery-heading">
        <div className="dashboard-section-header">
          <div>
            <h2 id="category-discovery-heading" style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
              Shop by Category
            </h2>
            <p style={{ fontSize: '0.785rem', color: 'var(--color-text-secondary)', margin: '0.15rem 0 0 0' }}>
              Explore curated collections across our marketplace departments
            </p>
          </div>

          <Link
            to={ROUTES.CUSTOMER_PRODUCTS}
            style={{
              fontSize: '0.8125rem',
              fontWeight: '700',
              color: 'var(--color-primary)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span>All Categories</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="dashboard-category-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton" style={{ height: '90px', borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div
            style={{
              padding: '1.15rem 1.35rem',
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-surface-raised)',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Layers size={18} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                  Categories Updating
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Browse all marketplace products directly in our catalog.
                </p>
              </div>
            </div>

            <Link
              to={ROUTES.CUSTOMER_PRODUCTS}
              className="btn btn-secondary"
              style={{ fontSize: '0.8125rem', padding: '0.4rem 0.85rem', gap: '0.35rem' }}
            >
              <span>Browse Catalog</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="dashboard-category-grid">
            {categories.map((category) => {
              const IconComponent = getCategoryIcon(category.name)
              return (
                <div
                  key={category.id}
                  onClick={() => navigate(`${ROUTES.CUSTOMER_PRODUCTS}?categoryId=${category.id}`)}
                  className="dashboard-category-card"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(`${ROUTES.CUSTOMER_PRODUCTS}?categoryId=${category.id}`)
                    }
                  }}
                  aria-label={`Browse ${category.name}`}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--color-primary-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-primary)',
                    }}
                  >
                    <IconComponent size={20} strokeWidth={1.85} />
                  </div>
                  <span
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: '700',
                      color: 'var(--color-text-primary)',
                      lineHeight: 1.25,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {category.name}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── 5. Featured Deals Section ── */}
      <section id="deals-section" aria-labelledby="featured-deals-heading">
        <div className="dashboard-section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--color-danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Flame size={18} />
            </div>
            <div>
              <h2 id="featured-deals-heading" style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
                Today's Featured Deals
              </h2>
              <p style={{ fontSize: '0.785rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                Limited inventory spotlight selections from genuine sellers
              </p>
            </div>
          </div>

          <Link
            to={ROUTES.CUSTOMER_PRODUCTS}
            style={{
              fontSize: '0.8125rem',
              fontWeight: '700',
              color: 'var(--color-primary)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span>See All Products</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="dashboard-product-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton" style={{ height: '340px', borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        ) : dealsProducts.length === 0 ? (
          <div
            style={{
              padding: '1.15rem 1.35rem',
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  color: 'var(--color-danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Flame size={18} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                  Spotlight Deals Refreshing
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Explore the full catalog while seller inventory updates.
                </p>
              </div>
            </div>

            <Link
              to={ROUTES.CUSTOMER_PRODUCTS}
              className="btn btn-secondary"
              style={{ fontSize: '0.8125rem', padding: '0.4rem 0.85rem', gap: '0.35rem' }}
            >
              <ShoppingBag size={14} />
              <span>Explore All Products</span>
            </Link>
          </div>
        ) : (
          <div className="dashboard-product-grid">
            {dealsProducts.map((p) => {
              const wishItem = wishlistItems.find((w) => (w.product?.id || w.productId) === p.id)
              return (
                <ProductCard
                  key={p.id}
                  product={p}
                  wishlistItemId={wishItem?.itemId || null}
                  onAddToCart={handleAddToCart}
                  onWishlistToggle={handleWishlistToggle}
                />
              )
            })}
          </div>
        )}
      </section>

      {/* ── 6. Trending Marketplace Arrivals ── */}
      <section aria-labelledby="trending-products-heading">
        <div className="dashboard-section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={18} />
            </div>
            <div>
              <h2 id="trending-products-heading" style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
                Trending Marketplace Arrivals
              </h2>
              <p style={{ fontSize: '0.785rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                Popular and newly listed products across all departments
              </p>
            </div>
          </div>

          <Link
            to={ROUTES.CUSTOMER_PRODUCTS}
            style={{
              fontSize: '0.8125rem',
              fontWeight: '700',
              color: 'var(--color-primary)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span>View All ({products.length})</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="dashboard-product-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="skeleton" style={{ height: '340px', borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        ) : trendingProducts.length === 0 ? (
          <div
            style={{
              padding: '1.15rem 1.35rem',
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-subtle)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <TrendingUp size={18} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                  Catalog Updating
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  New seller inventory is actively being cataloged.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => loadHomepageData(true)}
                disabled={retrying}
                className="btn btn-secondary"
                style={{ fontSize: '0.8125rem', padding: '0.4rem 0.85rem', gap: '0.35rem' }}
              >
                <RefreshCw size={13} className={retrying ? 'spin' : ''} />
                <span>{retrying ? 'Checking...' : 'Refresh'}</span>
              </button>
              <Link
                to={ROUTES.CUSTOMER_PRODUCTS}
                className="btn btn-primary"
                style={{ fontSize: '0.8125rem', padding: '0.4rem 0.85rem' }}
              >
                Browse Catalog
              </Link>
            </div>
          </div>
        ) : (
          <div className="dashboard-product-grid">
            {trendingProducts.map((p) => {
              const wishItem = wishlistItems.find((w) => (w.product?.id || w.productId) === p.id)
              return (
                <ProductCard
                  key={p.id}
                  product={p}
                  wishlistItemId={wishItem?.itemId || null}
                  onAddToCart={handleAddToCart}
                  onWishlistToggle={handleWishlistToggle}
                />
              )
            })}
          </div>
        )}
      </section>

      {/* ── 7. Recently Viewed Products (Client-Side Storage) ── */}
      {recentlyViewed.length > 0 && (
        <section aria-labelledby="recently-viewed-heading">
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              padding: '1.35rem 1.5rem',
              boxShadow: 'var(--shadow-xs)',
              transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={18} color="var(--color-primary)" />
                <h2 id="recently-viewed-heading" style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
                  Recently Viewed by You
                </h2>
              </div>

              <button
                type="button"
                onClick={clearRecentlyViewed}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: '2px 4px',
                }}
              >
                Clear History
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '0.85rem',
              }}
            >
              {recentlyViewed.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/customer/products/${item.id}`)}
                  className="card card-interactive"
                  style={{
                    padding: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    backgroundColor: 'var(--color-surface-raised)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'transform var(--transition-fast), border-color var(--transition-fast)',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '1/1',
                      backgroundColor: 'var(--color-surface)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={item.imageUrl || `https://placehold.co/200x200/ffffff/087847?text=${encodeURIComponent(item.name ? item.name.slice(0, 10) : 'Product')}`}
                      alt={item.name || 'Product'}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={(e) => {
                        e.target.src = `https://placehold.co/200x200/ffffff/087847?text=${encodeURIComponent(item.name ? item.name.slice(0, 8) : 'Item')}`
                      }}
                    />
                  </div>
                  <h4
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      color: 'var(--color-text-primary)',
                      margin: 0,
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.name}
                  </h4>
                  <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                    {formatPrice(item.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default CustomerDashboard

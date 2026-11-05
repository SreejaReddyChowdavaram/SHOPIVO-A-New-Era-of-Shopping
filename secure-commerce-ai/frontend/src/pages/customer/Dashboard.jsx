/**
 * Dashboard.jsx — Full-Width Customer Marketplace Homepage & Discovery Engine
 * Prioritizes product discovery, category exploration, live deals, recent orders, and recently viewed.
 */

import { useState, useEffect, useCallback } from 'react'
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
  RotateCcw,
  CreditCard,
  Clock,
  AlertCircle,
  Tag,
  Zap,
  Flame,
  ChevronRight,
  TrendingUp,
  History
} from 'lucide-react'
import { getProducts, getCategories } from '@/services/productService'
import { getMyOrders } from '@/services/orderService'
import { addItem as cartAdd } from '@/services/cartService'
import { addItem as wishlistAdd, removeItem as wishlistRemove, getWishlist } from '@/services/wishlistService'
import { updateCartSummary } from '@/store/cartSlice'
import { selectCurrentUser } from '@/store/authSlice'
import { ROUTES } from '@/constants/routes'
import ProductCard from '@/components/product/ProductCard'

// Category Icon Mapping
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

  // Fetch Homepage Data
  const loadHomepageData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [productPage, categoryList, orderList, wishlistData] = await Promise.allSettled([
        getProducts({ page: 0, size: 12 }),
        getCategories(),
        user ? getMyOrders() : Promise.resolve([]),
        user ? getWishlist() : Promise.resolve({ items: [] }),
      ])

      if (productPage.status === 'fulfilled' && productPage.value?.content) {
        setProducts(productPage.value.content)
      } else if (productPage.status === 'fulfilled' && Array.isArray(productPage.value)) {
        setProducts(productPage.value)
      }

      if (categoryList.status === 'fulfilled' && Array.isArray(categoryList.value)) {
        setCategories(categoryList.value)
      }

      if (orderList.status === 'fulfilled' && Array.isArray(orderList.value)) {
        setRecentOrders(orderList.value.slice(0, 2))
      }

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
      setError(err.message || 'Failed to load marketplace homepage.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadHomepageData()
  }, [loadHomepageData])

  // Cart Action Handler
  const handleAddToCart = async (productId) => {
    if (!user) {
      navigate(ROUTES.LOGIN)
      return
    }
    const updatedCart = await cartAdd(productId, 1)
    dispatch(
      updateCartSummary({
        itemCount: updatedCart.totalItems ?? updatedCart.itemCount ?? 0,
        subtotal: updatedCart.totalAmount ?? updatedCart.subtotal ?? 0,
      })
    )
  }

  // Wishlist Action Handler
  const handleWishlistToggle = async (productId, currentWishlistItemId) => {
    if (!user) {
      navigate(ROUTES.LOGIN)
      return
    }
    if (currentWishlistItemId) {
      await wishlistRemove(productId)
      setWishlistItems((prev) => prev.filter((item) => item.product?.id !== productId && item.itemId !== currentWishlistItemId))
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

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price || 0)

  // Split products for deals and trending sections
  const dealsProducts = products.slice(0, 4)
  const popularProducts = products.slice(4, 12).length > 0 ? products.slice(4, 12) : products.slice(0, 8)

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
      
      {/* ── 1. Commercial Hero Promotional Banner ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 50%, #2563eb 100%)',
          borderRadius: 'var(--radius-lg)',
          color: '#ffffff',
          padding: '2.5rem 2.25rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: '230px',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '640px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '0.3rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: '700',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '0.85rem',
              backdropFilter: 'blur(4px)',
            }}
          >
            <Sparkles size={14} color="#fde047" />
            <span>Marketplace Catalog Live</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)',
              fontWeight: '800',
              lineHeight: 1.25,
              margin: '0 0 0.65rem 0',
              letterSpacing: '-0.025em',
            }}
          >
            Discover Premium Tech, Fashion &amp; Everyday Essentials
          </h1>

          <p
            style={{
              fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: '0 0 1.5rem 0',
              lineHeight: 1.55,
            }}
          >
            Verified marketplace listings, atomic inventory validation, and seamless checkout with direct order tracking.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link
              to={ROUTES.CUSTOMER_PRODUCTS}
              className="btn btn-primary"
              style={{
                backgroundColor: '#ffffff',
                color: '#1e40af',
                border: 'none',
                fontWeight: '700',
                fontSize: '0.875rem',
                padding: '0.65rem 1.35rem',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              }}
            >
              Explore Full Catalog <ArrowRight size={16} />
            </Link>

            <button
              onClick={() => {
                const dealsElement = document.getElementById('deals-section')
                if (dealsElement) dealsElement.scrollIntoView({ behavior: 'smooth' })
              }}
              className="btn btn-secondary"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                fontWeight: '600',
                fontSize: '0.875rem',
                padding: '0.65rem 1.35rem',
                borderRadius: 'var(--radius-sm)',
                backdropFilter: 'blur(4px)',
              }}
            >
              <Zap size={16} color="#fde047" /> Today's Deals
            </button>
            <Link
              to={ROUTES.CUSTOMER_ANALYTICS}
              className="btn btn-secondary"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                fontWeight: '600',
                fontSize: '0.875rem',
                padding: '0.65rem 1.35rem',
                borderRadius: 'var(--radius-sm)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <TrendingUp size={16} color="#93c5fd" /> Shopping Analytics
            </Link>
          </div>
        </div>

        {/* Decorative Watermark Background */}
        <div
          style={{
            position: 'absolute',
            right: '-20px',
            bottom: '-30px',
            opacity: 0.08,
            pointerEvents: 'none',
          }}
        >
          <ShieldCheck size={280} color="#ffffff" />
        </div>
      </div>

      {/* ── 2. Recent Order Quick-Access Strip (If Logged-in Customer has orders) ── */}
      {recentOrders.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            padding: '1.15rem 1.5rem',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-sm)',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                  Your Recent Order #{recentOrders[0].id}
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: '700',
                    padding: '0.15rem 0.45rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor:
                      recentOrders[0].status === 'DELIVERED'
                        ? 'var(--color-success-subtle)'
                        : 'var(--color-info-subtle)',
                    color:
                      recentOrders[0].status === 'DELIVERED'
                        ? 'var(--color-success)'
                        : 'var(--color-info)',
                    textTransform: 'uppercase',
                  }}
                >
                  {recentOrders[0].status}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '0.15rem 0 0' }}>
                {recentOrders[0].totalItems} item{recentOrders[0].totalItems !== 1 ? 's' : ''} · Total: {formatPrice(recentOrders[0].totalAmount)}
              </p>
            </div>
          </div>

          <Link
            to={`/customer/orders/${recentOrders[0].id}`}
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
            Track Order Details <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ── 3. Shop by Category Discovery Grid ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
              Shop by Category
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: '0.15rem 0 0 0' }}>
              Explore curated products across our primary marketplace categories
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
            All Categories <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.85rem' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton" style={{ height: '95px', borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div style={{ padding: '2rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            No categories available at the moment.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '0.875rem',
            }}
          >
            {categories.map((category) => {
              const IconComponent = getCategoryIcon(category.name)
              return (
                <div
                  key={category.id}
                  onClick={() => navigate(`${ROUTES.CUSTOMER_PRODUCTS}?categoryId=${category.id}`)}
                  className="card card-interactive"
                  style={{
                    padding: '1.25rem 1rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.65rem',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-xs)',
                    cursor: 'pointer',
                    transition: 'background-color var(--transition-normal), border-color var(--transition-normal), transform var(--transition-fast)',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-primary)',
                    }}
                  >
                    <IconComponent size={20} />
                  </div>
                  <span
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: '700',
                      color: 'var(--color-text-primary)',
                      lineHeight: 1.3,
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
      </div>

      {/* ── 4. Today's Deals Section ── */}
      <div id="deals-section">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
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
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
                Today's Deals
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                Limited inventory deals on top-rated products
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
            See All Deals <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton" style={{ height: '340px', borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        ) : dealsProducts.length === 0 ? (
          <div style={{ padding: '2rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            No deal items found in catalog.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '1rem',
            }}
          >
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
      </div>

      {/* ── 5. Popular Products / Explore More Section ── */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
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
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
                Popular Products
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                Frequently purchased and trending items
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
            View All ({products.length}) <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="skeleton" style={{ height: '340px', borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        ) : popularProducts.length === 0 ? (
          <div style={{ padding: '2rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            No products available.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '1rem',
            }}
          >
            {popularProducts.map((p) => {
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
      </div>

      {/* ── 6. Recently Viewed Products (Client-Side Storage) ── */}
      {recentlyViewed.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-xs)',
            transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <History size={18} color="var(--color-primary)" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
              Recently Viewed by You
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '1rem',
            }}
          >
            {recentlyViewed.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/customer/products/${item.id}`)}
                className="card card-interactive"
                style={{
                  padding: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  backgroundColor: 'var(--color-surface-raised)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'background-color var(--transition-normal), border-color var(--transition-normal), transform var(--transition-fast)',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1/1',
                    backgroundColor: 'var(--color-surface)',
                    borderRadius: 'var(--radius-xs)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={item.imageUrl || `https://placehold.co/200x200/ffffff/2563eb?text=${encodeURIComponent(item.name.slice(0, 10))}`}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                      e.target.src = `https://placehold.co/200x200/ffffff/2563eb?text=${encodeURIComponent(item.name.slice(0, 8))}`
                    }}
                  />
                </div>
                <h4
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    color: 'var(--color-text-primary)',
                    margin: 0,
                    lineHeight: 1.35,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.name}
                </h4>
                <span style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                  {formatPrice(item.price)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 7. Marketplace Trust & Service Strip ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-xs)',
          transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--color-success-subtle)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <p style={{ fontWeight: '700', fontSize: '0.875rem', margin: 0, color: 'var(--color-text-primary)' }}>100% Genuine Products</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>Moderated seller listings</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--color-info-subtle)', color: 'var(--color-info)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CreditCard size={20} />
          </div>
          <div>
            <p style={{ fontWeight: '700', fontSize: '0.875rem', margin: 0, color: 'var(--color-text-primary)' }}>Secure Checkout</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>Stateless 256-bit encryption</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--color-warning-subtle)', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Truck size={20} />
          </div>
          <div>
            <p style={{ fontWeight: '700', fontSize: '0.875rem', margin: 0, color: 'var(--color-text-primary)' }}>Fast Order Dispatch</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>Live multi-step tracking</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--color-primary-subtle)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <RotateCcw size={20} />
          </div>
          <div>
            <p style={{ fontWeight: '700', fontSize: '0.875rem', margin: 0, color: 'var(--color-text-primary)' }}>Easy Returns Policy</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>Transparent resolution process</p>
          </div>
        </div>
      </div>

    </div>
  )
}

export default CustomerDashboard

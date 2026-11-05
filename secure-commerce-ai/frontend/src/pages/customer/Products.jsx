/**
 * Products.jsx — Dense Marketplace Product Browse Page with Dedicated Filter Panel & URL-Synchronized Search/Sort
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Star,
  RotateCcw,
  Check,
  AlertCircle,
  X,
  Tag,
  ArrowUpDown,
  Filter
} from 'lucide-react'
import { getProducts, getCategories } from '@/services/productService'
import { addItem as cartAdd } from '@/services/cartService'
import { addItem as wishlistAdd, removeItem as wishlistRemove, getWishlist } from '@/services/wishlistService'
import { updateCartSummary } from '@/store/cartSlice'
import { selectCurrentUser } from '@/store/authSlice'
import ProductCard from '@/components/product/ProductCard'
import { ROUTES } from '@/constants/routes'

const PAGE_SIZE = 16

const PRICE_RANGES = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under ₹1,000', min: 0, max: 1000 },
  { label: '₹1,000 - ₹5,000', min: 1000, max: 5000 },
  { label: '₹5,000 - ₹15,000', min: 5000, max: 15000 },
  { label: 'Above ₹15,000', min: 15000, max: Infinity },
]

const RATING_FILTERS = [
  { label: '4★ & above', minRating: 4.0 },
  { label: '3★ & above', minRating: 3.0 },
  { label: '2★ & above', minRating: 2.0 },
]

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance / Featured' },
  { value: 'price_asc', label: 'Price -- Low to High' },
  { value: 'price_desc', label: 'Price -- High to Low' },
  { value: 'rating', label: 'Customer Rating' },
  { value: 'newest', label: 'Newest Arrivals' },
]

// Shimmer Skeleton Placeholder Card
const SkeletonCard = () => (
  <div
    style={{
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '0.75rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      height: '320px',
    }}
  >
    <div className="skeleton" style={{ width: '100%', height: '160px' }} />
    <div className="skeleton" style={{ width: '85%', height: '14px', marginTop: '0.5rem' }} />
    <div className="skeleton" style={{ width: '60%', height: '14px' }} />
    <div className="skeleton" style={{ width: '35%', height: '12px' }} />
    <div className="skeleton" style={{ width: '50%', height: '18px', marginTop: 'auto' }} />
    <div className="skeleton" style={{ width: '100%', height: '32px' }} />
  </div>
)

const Products = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const currentUser = useSelector(selectCurrentUser)
  const [searchParams, setSearchParams] = useSearchParams()

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters from URL
  const searchParam = searchParams.get('search') || ''
  const categoryParam = searchParams.get('category') || searchParams.get('categoryId') || ''
  const sortParam = searchParams.get('sort') || 'relevance'

  const [selectedCategory, setSelectedCategory] = useState(categoryParam === 'all' ? '' : categoryParam)
  const [priceRangeIndex, setPriceRangeIndex] = useState(0)
  const [minRating, setMinRating] = useState(0)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sortBy, setSortBy] = useState(sortParam)

  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  const [wishlistMap, setWishlistMap] = useState({})
  const [cartError, setCartError] = useState(null)

  // Sync category & sort param from URL changes
  useEffect(() => {
    setSelectedCategory(categoryParam === 'all' ? '' : categoryParam)
    setSortBy(sortParam)
  }, [categoryParam, sortParam])

  // Load Categories
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {})
  }, [])

  // Load Wishlist
  useEffect(() => {
    if (!currentUser) return
    getWishlist()
      .then((wishlist) => {
        const map = {}
        if (wishlist?.items) {
          wishlist.items.forEach((item) => {
            map[item.product?.id || item.productId] = item.itemId
          })
        }
        setWishlistMap(map)
      })
      .catch(() => {})
  }, [currentUser])

  // Fetch Products from Backend API
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getProducts({
        page,
        size: PAGE_SIZE,
        categoryId: selectedCategory || undefined,
        search: searchParam || undefined,
      })
      setProducts(data.content || [])
      setTotalPages(data.page?.totalPages ?? data.totalPages ?? 1)
      setTotalElements(data.page?.totalElements ?? data.totalElements ?? (data.content ? data.content.length : 0))
    } catch (err) {
      setError(err.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [page, selectedCategory, searchParam])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Client-side filtering & sorting for instant responsiveness
  const filteredProducts = useMemo(() => {
    const selectedPriceRange = PRICE_RANGES[priceRangeIndex] || PRICE_RANGES[0]

    let list = products.filter((p) => {
      // Price range
      if (p.price < selectedPriceRange.min || p.price > selectedPriceRange.max) return false
      // In stock
      if (inStockOnly && p.stockQuantity <= 0) return false
      // Rating
      if (minRating > 0) {
        const rating = p.rating || (4.0 + (p.id % 10) * 0.1)
        if (rating < minRating) return false
      }
      return true
    })

    // Sorting
    if (sortBy === 'price_asc') {
      list = [...list].sort((a, b) => Number(a.price) - Number(b.price))
    } else if (sortBy === 'price_desc') {
      list = [...list].sort((a, b) => Number(b.price) - Number(a.price))
    } else if (sortBy === 'rating') {
      list = [...list].sort((a, b) => (Number(b.rating) || 4.0) - (Number(a.rating) || 4.0))
    } else if (sortBy === 'newest') {
      list = [...list].sort((a, b) => (new Date(b.createdAt || 0)) - (new Date(a.createdAt || 0)) || b.id - a.id)
    }

    return list
  }, [products, priceRangeIndex, inStockOnly, minRating, sortBy])

  const activeCategoryObj = categories.find((c) => String(c.id) === String(selectedCategory))

  const hasActiveFilters = Boolean(
    selectedCategory || priceRangeIndex > 0 || minRating > 0 || inStockOnly || searchParam || sortBy !== 'relevance'
  )

  const handleResetFilters = () => {
    setSelectedCategory('')
    setPriceRangeIndex(0)
    setMinRating(0)
    setInStockOnly(false)
    setSortBy('relevance')
    setSearchParams({})
    setPage(0)
  }

  const handleClearSearch = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('search')
    next.delete('page')
    setSearchParams(next)
    setPage(0)
  }

  const handleClearCategory = () => {
    setSelectedCategory('')
    const next = new URLSearchParams(searchParams)
    next.delete('category')
    next.delete('categoryId')
    next.delete('page')
    setSearchParams(next)
    setPage(0)
  }

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId)
    const next = new URLSearchParams(searchParams)
    if (catId) {
      next.set('category', catId)
    } else {
      next.delete('category')
      next.delete('categoryId')
    }
    next.delete('page')
    setSearchParams(next)
    setPage(0)
  }

  const handleSortChange = (newSort) => {
    setSortBy(newSort)
    const next = new URLSearchParams(searchParams)
    if (newSort === 'relevance') {
      next.delete('sort')
    } else {
      next.set('sort', newSort)
    }
    setSearchParams(next)
  }

  const handleWishlistToggle = async (productId, currentItemId) => {
    if (!currentUser) {
      navigate(ROUTES.LOGIN)
      return
    }
    try {
      if (currentItemId) {
        await wishlistRemove(productId)
        setWishlistMap((prev) => {
          const m = { ...prev }
          delete m[productId]
          return m
        })
      } else {
        const updated = await wishlistAdd(productId)
        if (updated?.items) {
          const map = {}
          updated.items.forEach((item) => {
            map[item.product?.id || item.productId] = item.itemId
          })
          setWishlistMap(map)
        } else {
          const refreshed = await getWishlist()
          const map = {}
          refreshed?.items?.forEach((item) => {
            map[item.product?.id || item.productId] = item.itemId
          })
          setWishlistMap(map)
        }
      }
    } catch (err) {
      console.error('Wishlist toggle error:', err)
    }
  }

  const handleAddToCart = async (productId) => {
    if (!currentUser) {
      navigate(ROUTES.LOGIN)
      return
    }
    setCartError(null)
    try {
      const cart = await cartAdd(productId, 1)
      dispatch(updateCartSummary({
        itemCount: cart.totalItems ?? cart.itemCount ?? 0,
        subtotal: cart.totalAmount ?? cart.subtotal ?? 0,
      }))
    } catch (err) {
      setCartError(err.message || 'Could not add to cart')
      setTimeout(() => setCartError(null), 3000)
    }
  }

  return (
    <div className="fade-in" style={{ paddingBottom: '2.5rem' }}>
      
      {/* ── Main Two-Column Browse Layout ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 240px) minmax(0, 1fr)',
          gap: '1.25rem',
          alignItems: 'start',
        }}
        className="account-layout-grid"
      >
        {/* ── Left Column: Dense Marketplace Filter Panel ── */}
        <aside
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xs)',
            height: 'fit-content',
            position: 'sticky',
            top: 'calc(var(--header-height, 64px) + 1.5rem)',
          }}
        >
          {/* Filter Header */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
              <SlidersHorizontal size={16} color="var(--color-primary)" />
              <span>Filters</span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                Clear All
              </button>
            )}
          </div>

          {/* 1. Categories Filter */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
              Categories
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '190px', overflowY: 'auto' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--color-text-primary)' }}>
                <input
                  type="radio"
                  name="category"
                  checked={!selectedCategory}
                  onChange={() => handleCategoryChange('')}
                />
                <span>All Categories</span>
              </label>
              {categories.map((cat) => (
                <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--color-text-primary)' }}>
                  <input
                    type="radio"
                    name="category"
                    checked={String(selectedCategory) === String(cat.id)}
                    onChange={() => handleCategoryChange(cat.id)}
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 2. Price Range Filter */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
              Price
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {PRICE_RANGES.map((range, idx) => (
                <label key={range.label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--color-text-primary)' }}>
                  <input
                    type="radio"
                    name="priceRange"
                    checked={priceRangeIndex === idx}
                    onChange={() => setPriceRangeIndex(idx)}
                  />
                  <span>{range.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 3. Customer Ratings Filter */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
              Customer Rating
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--color-text-primary)' }}>
                <input
                  type="radio"
                  name="ratingFilter"
                  checked={minRating === 0}
                  onChange={() => setMinRating(0)}
                />
                <span>Any Rating</span>
              </label>
              {RATING_FILTERS.map((rf) => (
                <label key={rf.label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--color-text-primary)' }}>
                  <input
                    type="radio"
                    name="ratingFilter"
                    checked={minRating === rf.minRating}
                    onChange={() => setMinRating(rf.minRating)}
                  />
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    {rf.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 4. Availability Filter */}
          <div style={{ padding: '1rem 1.25rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
              Availability
            </h4>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--color-text-primary)' }}>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
              />
              <span>In Stock Only</span>
            </label>
          </div>
        </aside>

        {/* ── Right Column: Search Results, Sort Bar, & Dense Grid ── */}
        <section style={{ minWidth: 0 }}>
          
          {/* Top Sort & Summary Bar */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.95rem 1.25rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--color-text-primary)' }}>
                  {searchParam ? (
                    <>Search results for <span style={{ color: 'var(--color-primary)' }}>"{searchParam}"</span></>
                  ) : activeCategoryObj ? (
                    activeCategoryObj.name
                  ) : (
                    'All Marketplace Products'
                  )}
                </span>
                
                <span
                  style={{
                    fontSize: '0.725rem',
                    fontWeight: '700',
                    backgroundColor: 'var(--color-surface-raised)',
                    color: 'var(--color-text-secondary)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {loading ? '...' : `${filteredProducts.length} items`}
                </span>
              </div>

              {/* Active Filter Chips */}
              {(searchParam || selectedCategory) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                  {searchParam && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.725rem',
                        padding: '0.2rem 0.6rem',
                        backgroundColor: 'var(--color-primary-subtle)',
                        border: '1px solid rgba(37, 99, 235, 0.2)',
                        color: 'var(--color-primary)',
                        borderRadius: 'var(--radius-xs)',
                        fontWeight: '600',
                      }}
                    >
                      Query: {searchParam}
                      <X size={12} style={{ cursor: 'pointer' }} onClick={handleClearSearch} />
                    </span>
                  )}

                  {activeCategoryObj && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.725rem',
                        padding: '0.2rem 0.6rem',
                        backgroundColor: 'var(--color-surface-raised)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        borderRadius: 'var(--radius-xs)',
                        fontWeight: '600',
                      }}
                    >
                      Category: {activeCategoryObj.name}
                      <X size={12} style={{ cursor: 'pointer' }} onClick={handleClearCategory} />
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Sort Options */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--color-text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ArrowUpDown size={14} /> Sort by:
              </span>
              <select
                className="input"
                style={{ width: 'auto', padding: '0.35rem 0.75rem', height: '34px', fontSize: '0.8125rem', cursor: 'pointer', fontWeight: '600' }}
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cart Error Toast */}
          {cartError && (
            <div
              className="fade-in"
              style={{
                backgroundColor: 'var(--color-danger-subtle)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--color-danger)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem',
                fontWeight: '600',
              }}
            >
              <AlertCircle size={16} />
              <span>{cartError}</span>
            </div>
          )}

          {/* ── Product Grid or Skeletons ── */}
          {loading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                gap: '1rem',
              }}
            >
              {Array.from({ length: 8 }).map((_, idx) => (
                <SkeletonCard key={idx} />
              ))}
            </div>
          ) : error ? (
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                padding: '3rem 1.5rem',
                transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
              }}
            >
              <AlertCircle size={40} color="var(--color-danger)" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '0.35rem' }}>Failed to load products</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>
              <button className="btn btn-primary" onClick={fetchProducts}>Try Again</button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                padding: '4rem 1.5rem',
                boxShadow: 'var(--shadow-xs)',
                transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-surface-raised)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  color: 'var(--color-text-disabled)',
                }}
              >
                <Search size={28} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--color-text-primary)' }}>
                {searchParam ? `No products found for "${searchParam}"` : 'No products match your filters'}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', maxWidth: '440px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                {searchParam
                  ? 'Check for spelling mistakes, try more general terms, or explore other marketplace categories.'
                  : 'Try adjusting your price range, category filter, or rating filters to see more results.'}
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {hasActiveFilters && (
                  <button className="btn btn-primary" onClick={handleResetFilters}>
                    Clear All Filters &amp; View Catalog
                  </button>
                )}
                <Link to={ROUTES.CUSTOMER_DASHBOARD} className="btn btn-secondary">
                  Back to Homepage
                </Link>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                gap: '1rem',
              }}
            >
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  wishlistItemId={wishlistMap[product.id] ?? null}
                  onWishlistToggle={currentUser ? handleWishlistToggle : undefined}
                  onAddToCart={currentUser ? handleAddToCart : undefined}
                />
              ))}
            </div>
          )}

          {/* ── Pagination ── */}
          {!loading && totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                marginTop: '2rem',
              }}
            >
              <button
                className="btn btn-secondary"
                disabled={page === 0}
                onClick={() => {
                  setPage((p) => p - 1)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                style={{ height: '36px' }}
              >
                <ChevronLeft size={16} /> Previous
              </button>

              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: '600' }}>
                Page {page + 1} of {totalPages}
              </span>

              <button
                className="btn btn-secondary"
                disabled={page >= totalPages - 1}
                onClick={() => {
                  setPage((p) => p + 1)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                style={{ height: '36px' }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}

        </section>
      </div>

    </div>
  )
}

export default Products

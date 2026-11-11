/**
 * ProductDetails.jsx — Marketplace Product Details Page
 * Phase C3: Product Details Polish + Specifications
 * Phase C7: Customer Reviews & Ratings Lifecycle (Verified Purchase Foundation)
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Heart,
  ShoppingCart,
  Zap,
  Minus,
  Plus,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  Store,
  Calendar,
  Layers,
  Tag,
  Package,
  Clock,
  Sparkles,
  MessageSquare,
  Edit3,
  Trash2,
  X,
  UserCheck,
  Loader2
} from 'lucide-react'
import { getProductById, getProducts } from '@/services/productService'
import {
  getProductReviews,
  checkReviewEligibility,
  createReview,
  updateReview,
  deleteReview
} from '@/services/reviewService'
import { addItem as cartAdd } from '@/services/cartService'
import { addItem as wishlistAdd, removeItem as wishlistRemove, getWishlist } from '@/services/wishlistService'
import { updateCartSummary } from '@/store/cartSlice'
import { selectCurrentUser } from '@/store/authSlice'
import { ROUTES } from '@/constants/routes'
import ProductCard from '@/components/product/ProductCard'
import { resolveImageUrl } from '@/utils/imageUtils'

const ProductDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const currentUser = useSelector(selectCurrentUser)

  // Product & Data States
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [similarProducts, setSimilarProducts] = useState([])
  const [similarLoading, setSimilarLoading] = useState(false)
  const [recentlyViewed, setRecentlyViewed] = useState([])

  // Purchase Actions States
  const [quantity, setQuantity] = useState(1)
  const [cartLoading, setCartLoading] = useState(false)
  const [cartSuccess, setCartSuccess] = useState(false)
  const [cartError, setCartError] = useState(null)

  // Wishlist States
  const [wishlistItemId, setWishlistItemId] = useState(null)
  const [wishlistLoading, setWishlistLoading] = useState(false)

  // Description expand state
  const [showFullDescription, setShowFullDescription] = useState(false)

  // Image fallback state
  const [imageError, setImageError] = useState(false)

  // Reviews States (Phase C7)
  const [reviewSummary, setReviewSummary] = useState(null)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [eligibility, setEligibility] = useState(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [isEditingReview, setIsEditingReview] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState(null)
  const [reviewSuccess, setReviewSuccess] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Fetch reviews & summary
  const fetchReviews = (productId) => {
    setReviewsLoading(true)
    getProductReviews(productId)
      .then(setReviewSummary)
      .catch((err) => console.error('Failed to load reviews:', err))
      .finally(() => setReviewsLoading(false))
  }

  // Fetch customer eligibility
  const fetchEligibility = (productId) => {
    if (!currentUser) {
      setEligibility(null)
      return
    }
    checkReviewEligibility(productId)
      .then(setEligibility)
      .catch(() => setEligibility(null))
  }

  // 1. Fetch Product by ID & record Recently Viewed
  useEffect(() => {
    setLoading(true)
    setError(null)
    setQuantity(1)
    setImageError(false)
    setShowFullDescription(false)
    setShowReviewForm(false)
    setIsEditingReview(false)
    setReviewText('')
    setReviewRating(5)
    setReviewError(null)
    setReviewSuccess(null)

    getProductById(id)
      .then((data) => {
        setProduct(data)
        setLoading(false)

        // Read and update recently viewed in localStorage
        try {
          const viewed = JSON.parse(localStorage.getItem('sc_recently_viewed') || '[]')
          const filtered = viewed.filter((item) => item.id !== data.id)
          const updated = [
            {
              id: data.id,
              name: data.name,
              price: data.price,
              imageUrl: data.imageUrl,
              categoryName: data.categoryName,
              stockQuantity: data.stockQuantity,
            },
            ...filtered,
          ].slice(0, 10)
          localStorage.setItem('sc_recently_viewed', JSON.stringify(updated))

          // Filter out active product for the "Recently Viewed" section display
          setRecentlyViewed(filtered.slice(0, 4))
        } catch {
          // ignore localStorage access issues
        }

        // Fetch similar products in the same category if categoryId exists
        if (data.categoryId) {
          setSimilarLoading(true)
          getProducts({ categoryId: data.categoryId, size: 5 })
            .then((res) => {
              const items = res?.content || (Array.isArray(res) ? res : [])
              const related = items.filter((p) => p.id !== data.id).slice(0, 4)
              setSimilarProducts(related)
            })
            .catch(() => setSimilarProducts([]))
            .finally(() => setSimilarLoading(false))
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Product not found')
        setLoading(false)
      })

    // Fetch reviews & eligibility for this product
    fetchReviews(id)
    fetchEligibility(id)
  }, [id, currentUser])

  // 2. Fetch Wishlist Item status
  useEffect(() => {
    if (!currentUser || !product) {
      setWishlistItemId(null)
      return
    }
    getWishlist()
      .then((wishlist) => {
        const items = wishlist?.items || []
        const existing = items.find((i) => i.product.id === product.id)
        setWishlistItemId(existing ? existing.itemId : null)
      })
      .catch(() => setWishlistItemId(null))
  }, [currentUser, product])

  // Quantity Stepper Handlers
  const handleQuantityChange = (delta) => {
    setQuantity((prev) => {
      const next = prev + delta
      if (next < 1) return 1
      if (product && next > product.stockQuantity) return product.stockQuantity
      return next
    })
  }

  // Add to Cart & Buy Now Flow
  const handleAddToCart = async (redirectCheckout = false) => {
    if (!currentUser) {
      navigate(ROUTES.LOGIN)
      return
    }
    if (cartLoading || !product || product.stockQuantity === 0) return

    setCartLoading(true)
    setCartError(null)
    setCartSuccess(false)
    try {
      const cart = await cartAdd(product.id, quantity)
      dispatch(updateCartSummary({ itemCount: cart.totalItems, subtotal: cart.subtotal }))
      if (redirectCheckout) {
        navigate(ROUTES.CUSTOMER_CHECKOUT)
      } else {
        setCartSuccess(true)
        setTimeout(() => setCartSuccess(false), 3000)
      }
    } catch (err) {
      setCartError(err.response?.data?.message || err.message || 'Could not add product to cart')
      setTimeout(() => setCartError(null), 3500)
    } finally {
      setCartLoading(false)
    }
  }

  // Wishlist Toggle
  const handleWishlistToggle = async () => {
    if (!currentUser) {
      navigate(ROUTES.LOGIN)
      return
    }
    if (wishlistLoading || !product) return

    setWishlistLoading(true)
    try {
      if (wishlistItemId) {
        await wishlistRemove(wishlistItemId)
        setWishlistItemId(null)
      } else {
        const updated = await wishlistAdd(product.id)
        const items = updated?.items || []
        const newItem = items.find((i) => i.product.id === product.id)
        setWishlistItemId(newItem ? newItem.itemId : null)
      }
    } catch (err) {
      console.error('Wishlist error:', err)
    } finally {
      setWishlistLoading(false)
    }
  }

  // Review Handlers
  const handleStartReview = () => {
    setIsEditingReview(false)
    setReviewRating(5)
    setReviewText('')
    setReviewError(null)
    setShowReviewForm(true)
  }

  const handleStartEditReview = (existing) => {
    setIsEditingReview(true)
    setReviewRating(existing.rating)
    setReviewText(existing.reviewText)
    setReviewError(null)
    setShowReviewForm(true)
  }

  const handleCancelReviewForm = () => {
    setShowReviewForm(false)
    setIsEditingReview(false)
    setReviewText('')
    setReviewRating(5)
    setReviewError(null)
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!reviewText.trim() || reviewText.trim().length < 3) {
      setReviewError('Please provide a review text of at least 3 characters.')
      return
    }
    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError('Please select a rating between 1 and 5 stars.')
      return
    }

    setReviewSubmitting(true)
    setReviewError(null)
    setReviewSuccess(null)

    try {
      if (isEditingReview && eligibility?.existingReview) {
        await updateReview(eligibility.existingReview.id, {
          rating: reviewRating,
          reviewText: reviewText.trim(),
        })
        setReviewSuccess('Your review has been updated successfully!')
      } else {
        await createReview({
          productId: product.id,
          rating: reviewRating,
          reviewText: reviewText.trim(),
        })
        setReviewSuccess('Thank you! Your verified purchase review has been published.')
      }

      setShowReviewForm(false)
      fetchReviews(product.id)
      fetchEligibility(product.id)
      setTimeout(() => setReviewSuccess(null), 5000)
    } catch (err) {
      setReviewError(err.response?.data?.message || err.message || 'Failed to submit review.')
    } finally {
      setReviewSubmitting(false)
    }
  }

  const handleDeleteReview = async (reviewId) => {
    setDeleteLoading(true)
    try {
      await deleteReview(reviewId)
      setDeleteConfirmId(null)
      fetchReviews(product.id)
      fetchEligibility(product.id)
      setReviewSuccess('Your review has been deleted.')
      setTimeout(() => setReviewSuccess(null), 4000)
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete review')
    } finally {
      setDeleteLoading(false)
    }
  }

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently listed'
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return 'Recently listed'
    }
  }

  const renderStars = (ratingVal, size = 14) => {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            fill={star <= ratingVal ? '#ff9f00' : 'none'}
            color={star <= ratingVal ? '#ff9f00' : '#d0d0d0'}
          />
        ))}
      </div>
    )
  }

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="fade-in" style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '3rem' }}>
        {/* Breadcrumb Skeleton */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', alignItems: 'center' }}>
          <div className="skeleton" style={{ width: '60px', height: '14px', borderRadius: '4px' }} />
          <div style={{ color: 'var(--color-text-muted)' }}>/</div>
          <div className="skeleton" style={{ width: '80px', height: '14px', borderRadius: '4px' }} />
          <div style={{ color: 'var(--color-text-muted)' }}>/</div>
          <div className="skeleton" style={{ width: '140px', height: '14px', borderRadius: '4px' }} />
        </div>

        {/* Main Grid Skeleton */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 460px) minmax(0, 1fr)',
            gap: '2rem',
            padding: '1.5rem',
            transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
          }}
          className="account-layout-grid"
        >
          <div className="skeleton" style={{ width: '100%', aspectRatio: '1/1', borderRadius: 'var(--radius-xs)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="skeleton" style={{ width: '90px', height: '16px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ width: '85%', height: '28px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ width: '120px', height: '20px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ width: '150px', height: '36px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ width: '100px', height: '24px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ width: '100%', height: '48px', borderRadius: 'var(--radius-xs)' }} />
            <div className="skeleton" style={{ width: '100%', height: '80px', borderRadius: 'var(--radius-xs)' }} />
          </div>
        </div>
      </div>
    )
  }

  // Not Found / Error State
  if (error || !product) {
    return (
      <div className="fade-in" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '2.5rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <AlertCircle size={44} color="var(--color-danger)" style={{ margin: '0 auto 0.75rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--color-text-primary)' }}>
            Product Unavailable
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error || 'This product does not exist or is currently unavailable.'}
          </p>
          <button className="btn btn-primary" onClick={() => navigate(ROUTES.CUSTOMER_PRODUCTS)}>
            <ArrowLeft size={15} /> Back to Products Catalog
          </button>
        </div>
      </div>
    )
  }

  // Stock status conditions
  const isOutOfStock = product.stockQuantity === 0
  const isLowStock = !isOutOfStock && product.stockQuantity <= 5

  const totalReviews = reviewSummary?.totalReviews || 0
  const avgRating = reviewSummary?.averageRating || 0

  return (
    <div className="fade-in" style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* 1. Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        style={{
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.4rem',
          fontSize: '0.8125rem',
        }}
      >
        <Link
          to={ROUTES.CUSTOMER_DASHBOARD}
          style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
        >
          Home
        </Link>
        <ChevronRight size={13} color="var(--color-text-muted)" />
        {product.categoryId ? (
          <Link
            to={`${ROUTES.CUSTOMER_PRODUCTS}?categoryId=${product.categoryId}`}
            style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
          >
            {product.categoryName || 'Category'}
          </Link>
        ) : (
          <span style={{ color: 'var(--color-text-secondary)' }}>Catalog</span>
        )}
        <ChevronRight size={13} color="var(--color-text-muted)" />
        <span
          style={{
            color: 'var(--color-text-primary)',
            fontWeight: '600',
            maxWidth: '320px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={product.name}
        >
          {product.name}
        </span>
      </nav>

      {/* 2. Main Two-Column Product Container */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-xs)',
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 460px) minmax(0, 1fr)',
          gap: '2.5rem',
          padding: '2rem',
          alignItems: 'start',
          transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
        }}
        className="account-layout-grid"
      >
        {/* ── Left Column: Product Image Frame & Trust Indicators ── */}
        <div style={{ position: 'sticky', top: '80px' }}>
          <div
            style={{
              width: '100%',
              aspectRatio: '1/1',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              position: 'relative',
              overflow: 'hidden',
              transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
            }}
          >
            {/* Out of Stock Overlay Badge */}
            {isOutOfStock ? (
              <span
                style={{
                  position: 'absolute',
                  top: '14px',
                  left: '14px',
                  backgroundColor: 'var(--color-danger)',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-xs)',
                  zIndex: 2,
                  letterSpacing: '0.04em',
                }}
              >
                OUT OF STOCK
              </span>
            ) : isLowStock ? (
              <span
                style={{
                  position: 'absolute',
                  top: '14px',
                  left: '14px',
                  backgroundColor: 'var(--color-warning)',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-xs)',
                  zIndex: 2,
                }}
              >
                ONLY {product.stockQuantity} LEFT
              </span>
            ) : null}

            {/* Product Image */}
            <img
              src={
                !imageError && product.imageUrl
                  ? (resolveImageUrl(product.imageUrl) || product.imageUrl)
                  : `https://placehold.co/600x600/ffffff/2563eb?text=${encodeURIComponent(product.name.slice(0, 20))}`
              }
              alt={product.name}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                transition: 'transform 0.25s ease',
              }}
              onError={() => setImageError(true)}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />

            {/* Wishlist Button inside image frame */}
            <button
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              title={wishlistItemId ? 'Remove from wishlist' : 'Save to wishlist'}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                zIndex: 3,
                transition: 'transform 0.15s ease, background-color var(--transition-normal)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Heart
                size={18}
                fill={wishlistItemId ? '#ef4444' : 'none'}
                color={wishlistItemId ? '#ef4444' : '#94a3b8'}
              />
            </button>
          </div>

          {/* Secure Platform Indicators */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              marginTop: '1rem',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--color-surface-raised)',
                padding: '0.65rem 0.35rem',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <ShieldCheck size={18} color="var(--color-primary)" style={{ margin: '0 auto 0.25rem' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--color-text-primary)', display: 'block' }}>
                Verified Seller
              </span>
            </div>
            <div
              style={{
                backgroundColor: 'var(--color-surface-raised)',
                padding: '0.65rem 0.35rem',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <Truck size={18} color="var(--color-discount)" style={{ margin: '0 auto 0.25rem' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--color-text-primary)', display: 'block' }}>
                Secure Delivery
              </span>
            </div>
            <div
              style={{
                backgroundColor: 'var(--color-surface-raised)',
                padding: '0.65rem 0.35rem',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <RotateCcw size={18} color="var(--color-deal)" style={{ margin: '0 auto 0.25rem' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--color-text-primary)', display: 'block' }}>
                Support Assistance
              </span>
            </div>
          </div>
        </div>

        {/* ── Right Column: Product Info, Pricing & Actions ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Category & Seller Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            {product.categoryName && (
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: 'var(--color-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {product.categoryName}
              </span>
            )}
            {product.sellerName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                <Store size={14} />
                <span>
                  Sold by: <strong style={{ color: 'var(--color-text-primary)' }}>{product.sellerName}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Product Title */}
          <h1 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--color-text-primary)', lineHeight: 1.35, margin: 0 }}>
            {product.name}
          </h1>

          {/* Real Ratings & Reviews Badge / Summary in header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {totalReviews > 0 ? (
              <a
                href="#reviews-section"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: 'var(--color-discount)',
                  color: '#ffffff',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  textDecoration: 'none',
                }}
              >
                <span>{avgRating.toFixed(1)}</span>
                <Star size={11} fill="#ffffff" color="#ffffff" />
              </a>
            ) : null}

            <a
              href="#reviews-section"
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-primary)',
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              {totalReviews > 0 ? `${totalReviews} Ratings & Reviews` : 'No reviews yet'}
            </a>

            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              Listed {formatDate(product.createdAt)}
            </span>
          </div>

          {/* Price Block */}
          <div
            style={{
              backgroundColor: 'var(--color-surface-raised)',
              padding: '0.875rem 1.25rem',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                {formatPrice(product.price)}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem', margin: 0 }}>
              Inclusive of applicable marketplace taxes.
            </p>
          </div>

          {/* Stock Availability Badge */}
          <div>
            {isOutOfStock ? (
              <span className="badge badge-danger" style={{ fontSize: '0.8125rem', padding: '0.25rem 0.6rem' }}>
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="badge badge-warning" style={{ fontSize: '0.8125rem', padding: '0.25rem 0.6rem' }}>
                Hurry, Only {product.stockQuantity} Left in Stock!
              </span>
            ) : (
              <span className="badge badge-success" style={{ fontSize: '0.8125rem', padding: '0.25rem 0.6rem' }}>
                In Stock ({product.stockQuantity} units available)
              </span>
            )}
          </div>

          {/* Quantity Stepper (1 to stockQuantity) */}
          {!isOutOfStock && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                Quantity:
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--color-surface)',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1 || cartLoading}
                  style={{ width: '32px', height: '32px', padding: 0, border: 'none', borderRadius: 0 }}
                  title="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span style={{ fontWeight: '700', fontSize: '0.9375rem', minWidth: '36px', textAlign: 'center' }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stockQuantity || cartLoading}
                  style={{ width: '32px', height: '32px', padding: 0, border: 'none', borderRadius: 0 }}
                  title="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                (Max: {product.stockQuantity})
              </span>
            </div>
          )}

          {/* Action Feedback Alerts */}
          {cartSuccess && (
            <div
              className="fade-in"
              style={{
                backgroundColor: 'var(--color-discount-subtle)',
                border: '1px solid rgba(56, 142, 60, 0.3)',
                color: 'var(--color-discount)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-xs)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
              }}
            >
              <CheckCircle2 size={18} />
              <span>Added {quantity} {quantity === 1 ? 'item' : 'items'} to Cart!</span>
              <Link
                to={ROUTES.CUSTOMER_CART}
                style={{ marginLeft: 'auto', fontWeight: '700', color: 'var(--color-discount)', textDecoration: 'underline' }}
              >
                View Cart &rarr;
              </Link>
            </div>
          )}

          {cartError && (
            <div
              className="fade-in"
              style={{
                backgroundColor: 'var(--color-danger-subtle)',
                border: '1px solid rgba(211, 47, 47, 0.3)',
                color: 'var(--color-danger)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-xs)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
              }}
            >
              <AlertCircle size={18} />
              <span>{cartError}</span>
            </div>
          )}

          {/* Action Buttons: Add to Cart & Buy Now */}
          {currentUser ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.25rem' }}>
              <button
                id="add-to-cart-btn"
                className="btn btn-primary"
                onClick={() => handleAddToCart(false)}
                disabled={isOutOfStock || cartLoading}
                style={{ height: '46px', fontSize: '0.9375rem', fontWeight: '700' }}
              >
                {cartLoading ? (
                  <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                ) : (
                  <><ShoppingCart size={18} /> Add to Cart</>
                )}
              </button>

              <button
                id="buy-now-btn"
                className="btn btn-deal"
                onClick={() => handleAddToCart(true)}
                disabled={isOutOfStock || cartLoading}
                style={{ height: '46px', fontSize: '0.9375rem', fontWeight: '700' }}
              >
                <Zap size={18} /> Buy Now
              </button>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: 'var(--color-surface-raised)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border)',
                textAlign: 'center',
              }}
            >
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                Sign in to your customer account to add items to your cart and place orders.
              </p>
              <Link to={ROUTES.LOGIN} className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', display: 'inline-flex' }}>
                Sign In to Buy
              </Link>
            </div>
          )}

          {/* Product Highlights Strip */}
          <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '1rem', marginTop: '0.25rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
              Product Highlights
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-secondary)' }}>
                <Package size={14} color="var(--color-primary)" />
                <span>Identifier: <strong style={{ color: 'var(--color-text-primary)' }}>{product.slug || `PRD-${product.id}`}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-secondary)' }}>
                <Layers size={14} color="var(--color-primary)" />
                <span>Category: <strong style={{ color: 'var(--color-text-primary)' }}>{product.categoryName || 'Catalog Item'}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-secondary)' }}>
                <Store size={14} color="var(--color-primary)" />
                <span>Fulfillment: <strong style={{ color: 'var(--color-text-primary)' }}>{product.sellerName || 'Direct Seller'}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-secondary)' }}>
                <Calendar size={14} color="var(--color-primary)" />
                <span>Listed: <strong style={{ color: 'var(--color-text-primary)' }}>{formatDate(product.createdAt)}</strong></span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Specifications Table Section */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          padding: '1.5rem',
          marginTop: '1.5rem',
          transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
        }}
      >
        <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Tag size={18} color="var(--color-primary)" /> Specifications &amp; Details
        </h2>

        <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--color-border-subtle)', backgroundColor: 'var(--color-surface-raised)' }}>
                <td style={{ padding: '0.75rem 1rem', width: '30%', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                  Product Name
                </td>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-primary)', fontWeight: '600' }}>
                  {product.name}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                  Product Identifier / Slug
                </td>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-primary)', fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                  {product.slug || `PRD-${product.id}`}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-subtle)', backgroundColor: 'var(--color-surface-raised)' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                  Category
                </td>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-primary)' }}>
                  {product.categoryName || 'Standard Catalog'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                  Seller Information
                </td>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-primary)' }}>
                  {product.sellerName || 'Direct Marketplace Seller'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-subtle)', backgroundColor: 'var(--color-surface-raised)' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                  Stock Status
                </td>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-primary)' }}>
                  {isOutOfStock ? 'Out of stock' : `${product.stockQuantity} units available`}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                  Listing Date
                </td>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-primary)' }}>
                  {formatDate(product.createdAt)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Product Description Section */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          padding: '1.5rem',
          marginTop: '1.5rem',
          transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
        }}
      >
        <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.75rem' }}>
          Product Description
        </h2>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
          {product.description ? (
            product.description.length > 350 && !showFullDescription ? (
              <>
                {product.description.slice(0, 350)}...
                <button
                  onClick={() => setShowFullDescription(true)}
                  style={{
                    display: 'inline-block',
                    marginLeft: '0.5rem',
                    color: 'var(--color-primary)',
                    fontWeight: '700',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '0.875rem',
                  }}
                >
                  Read more
                </button>
              </>
            ) : (
              <>
                {product.description}
                {product.description.length > 350 && (
                  <button
                    onClick={() => setShowFullDescription(false)}
                    style={{
                      display: 'inline-block',
                      marginLeft: '0.5rem',
                      color: 'var(--color-primary)',
                      fontWeight: '700',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '0.875rem',
                    }}
                  >
                    Show less
                  </button>
                )}
              </>
            )
          ) : (
            'Standard verified marketplace item with verified seller fulfillment and secure checkout guarantee.'
          )}
        </div>
      </div>

      {/* 5. Customer Ratings & Reviews Section (Phase C7 Verified Purchase Lifecycle) */}
      <div
        id="reviews-section"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          padding: '1.5rem',
          marginTop: '1.5rem',
          transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={20} color="var(--color-primary)" /> Customer Ratings &amp; Reviews
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '0.2rem 0 0' }}>
              Real reviews submitted by verified buyers who received this product
            </p>
          </div>

          {/* Review Action Buttons */}
          <div>
            {currentUser ? (
              eligibility?.eligible && !showReviewForm && (
                <button
                  onClick={handleStartReview}
                  className="btn btn-primary"
                  style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.95rem' }}
                >
                  <Star size={14} /> Write a Review
                </button>
              )
            ) : (
              <Link
                to={ROUTES.LOGIN}
                className="btn btn-secondary"
                style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.95rem' }}
              >
                Sign in to Review
              </Link>
            )}
          </div>
        </div>

        {/* Global Feedback Alert */}
        {reviewSuccess && (
          <div
            className="fade-in"
            style={{
              backgroundColor: 'var(--color-discount-subtle)',
              border: '1px solid rgba(56, 142, 60, 0.3)',
              color: 'var(--color-discount)',
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-xs)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontSize: '0.875rem',
              fontWeight: '600',
            }}
          >
            <CheckCircle2 size={18} />
            <span>{reviewSuccess}</span>
          </div>
        )}

        {/* Customer Review Eligibility & Existing Review Status Banner */}
        {currentUser && eligibility && (
          <div
            style={{
              backgroundColor: eligibility.alreadyReviewed ? 'var(--color-primary-subtle)' : eligibility.eligible ? 'var(--color-discount-subtle)' : 'var(--color-surface-raised)',
              border: `1px solid ${eligibility.alreadyReviewed ? 'rgba(40, 116, 240, 0.25)' : eligibility.eligible ? 'rgba(56, 142, 60, 0.25)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-xs)',
              padding: '0.85rem 1.25rem',
              marginBottom: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <UserCheck size={18} color={eligibility.alreadyReviewed ? 'var(--color-primary)' : eligibility.eligible ? 'var(--color-discount)' : 'var(--color-text-secondary)'} />
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                  {eligibility.alreadyReviewed
                    ? 'You reviewed this product'
                    : eligibility.eligible
                    ? 'Verified Purchase Eligible'
                    : 'Review Status'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  {eligibility.reason}
                </div>
              </div>
            </div>

            {eligibility.alreadyReviewed && eligibility.existingReview && !showReviewForm && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleStartEditReview(eligibility.existingReview)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.65rem' }}
                >
                  <Edit3 size={13} /> Edit My Review
                </button>
                <button
                  onClick={() => setDeleteConfirmId(eligibility.existingReview.id)}
                  className="btn btn-danger-outline"
                  style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.65rem' }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Review Form (Create or Edit) ── */}
        {showReviewForm && (
          <form
            onSubmit={handleSubmitReview}
            className="fade-in"
            style={{
              backgroundColor: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xs)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Star size={16} color="var(--color-star)" fill="var(--color-star)" />
                {isEditingReview ? 'Edit Your Review' : 'Write a Verified Purchase Review'}
              </h3>
              <button
                type="button"
                onClick={handleCancelReviewForm}
                disabled={reviewSubmitting}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {reviewError && (
              <div
                style={{
                  backgroundColor: 'var(--color-danger-subtle)',
                  color: 'var(--color-danger)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  marginBottom: '1rem',
                }}
              >
                <AlertCircle size={16} />
                <span>{reviewError}</span>
              </div>
            )}

            {/* Star Rating Picker */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>
                Your Rating *
              </label>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || reviewRating) >= star
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      disabled={reviewSubmitting}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        transition: 'transform 0.15s ease',
                      }}
                      title={`${star} star${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        size={26}
                        fill={isFilled ? '#ff9f00' : 'none'}
                        color={isFilled ? '#ff9f00' : '#c0c0c0'}
                      />
                    </button>
                  )
                })}
                <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                  {hoverRating || reviewRating} / 5 Stars
                </span>
              </div>
            </div>

            {/* Review Text */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>
                Detailed Review *
              </label>
              <textarea
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                disabled={reviewSubmitting}
                placeholder="Share details of your experience with this product (quality, fit, performance)..."
                className="input"
                style={{ width: '100%', fontSize: '0.875rem', resize: 'vertical' }}
                maxLength={2000}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                <span>Minimum 3 characters</span>
                <span>{reviewText.length} / 2000 characters</span>
              </div>
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancelReviewForm}
                disabled={reviewSubmitting}
                style={{ fontSize: '0.8125rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={reviewSubmitting}
                style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                {reviewSubmitting ? (
                  <>
                    <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Submitting...
                  </>
                ) : isEditingReview ? (
                  'Update Review'
                ) : (
                  'Submit Review'
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── Rating Summary Breakdown + Review List ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '260px minmax(0, 1fr)',
            gap: '2rem',
            alignItems: 'start',
          }}
          className="account-layout-grid"
        >
          {/* Rating Summary Block */}
          <div
            style={{
              textAlign: 'center',
              borderRight: '1px solid var(--color-border-subtle)',
              paddingRight: '1.5rem',
            }}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-text-primary)', lineHeight: 1 }}>
              {totalReviews > 0 ? avgRating.toFixed(1) : '--'}{' '}
              <span style={{ fontSize: '1.5rem', color: 'var(--color-star)' }}>★</span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: '600', marginTop: '0.5rem', marginBottom: '1rem' }}>
              {totalReviews > 0 ? `Based on ${totalReviews} verified ${totalReviews === 1 ? 'review' : 'reviews'}` : 'No ratings yet'}
            </p>

            {/* Rating distribution breakdown bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.75rem' }}>
              {[
                { star: 5, count: reviewSummary?.rating5Count || 0 },
                { star: 4, count: reviewSummary?.rating4Count || 0 },
                { star: 3, count: reviewSummary?.rating3Count || 0 },
                { star: 2, count: reviewSummary?.rating2Count || 0 },
                { star: 1, count: reviewSummary?.rating1Count || 0 },
              ].map(({ star, count }) => {
                const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
                return (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ minWidth: '24px', textAlign: 'right', color: 'var(--color-text-secondary)', fontWeight: '600' }}>
                      {star}★
                    </span>
                    <div style={{ flex: 1, height: '7px', backgroundColor: 'var(--color-border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: '100%',
                          backgroundColor: star >= 4 ? 'var(--color-discount)' : star === 3 ? '#ff9f00' : 'var(--color-danger)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                    <span style={{ minWidth: '22px', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Review List Column ── */}
          <div>
            {reviewsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--color-primary)' }} />
                <span>Loading customer reviews...</span>
              </div>
            ) : totalReviews === 0 ? (
              <div
                style={{
                  backgroundColor: 'var(--color-surface-raised)',
                  border: '1px dashed var(--color-border)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                }}
              >
                <Star size={32} color="var(--color-text-disabled)" style={{ margin: '0 auto 0.5rem' }} />
                <h3 style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
                  No Customer Reviews Yet
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: '0 auto', maxWidth: '420px', lineHeight: 1.5 }}>
                  Be the first verified customer to purchase and share feedback on this product.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reviewSummary.reviews.map((rev) => {
                  const isOwner = currentUser && rev.customerId === currentUser.id
                  return (
                    <div
                      key={rev.id}
                      style={{
                        paddingBottom: '1rem',
                        borderBottom: '1px solid var(--color-border-subtle)',
                      }}
                    >
                      {/* Top review header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              backgroundColor: rev.rating >= 4 ? 'var(--color-discount)' : rev.rating === 3 ? '#ff9f00' : 'var(--color-danger)',
                              color: '#ffffff',
                              padding: '0.1rem 0.45rem',
                              borderRadius: 'var(--radius-xs)',
                              fontSize: '0.725rem',
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                          >
                            {rev.rating} <Star size={10} fill="#ffffff" color="#ffffff" />
                          </span>
                          <span style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                            {rev.customerName}
                          </span>
                          {rev.verifiedPurchase && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                color: 'var(--color-discount)',
                                fontSize: '0.7rem',
                                fontWeight: '700',
                              }}
                            >
                              <CheckCircle2 size={12} /> Verified Purchase
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>
                            {formatDate(rev.createdAt)}
                          </span>

                          {isOwner && (
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button
                                onClick={() => handleStartEditReview(rev)}
                                title="Edit your review"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '2px' }}
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(rev.id)}
                                title="Delete your review"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: '2px' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Review body text */}
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', lineHeight: 1.5, margin: '0.4rem 0 0', whiteSpace: 'pre-line' }}>
                        {rev.reviewText}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Similar Products Section */}
      {similarProducts.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
              Similar Products {product.categoryName ? `in ${product.categoryName}` : ''}
            </h2>
            {product.categoryId && (
              <Link
                to={`${ROUTES.CUSTOMER_PRODUCTS}?categoryId=${product.categoryId}`}
                style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-primary)', textDecoration: 'none' }}
              >
                View All &rarr;
              </Link>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            {similarProducts.map((simProduct) => (
              <ProductCard
                key={simProduct.id}
                product={simProduct}
                onAddToCart={currentUser ? (prodId) => cartAdd(prodId, 1).then((cart) => dispatch(updateCartSummary({ itemCount: cart.totalItems, subtotal: cart.subtotal }))) : null}
              />
            ))}
          </div>
        </div>
      )}

      {/* 7. Recently Viewed Section */}
      {recentlyViewed.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
              Recently Viewed Products
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            {recentlyViewed.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                onAddToCart={currentUser ? (prodId) => cartAdd(prodId, 1).then((cart) => dispatch(updateCartSummary({ itemCount: cart.totalItems, subtotal: cart.subtotal }))) : null}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Delete Review Confirmation Modal ── */}
      {deleteConfirmId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
            overflowY: 'auto',
          }}
          onClick={() => !deleteLoading && setDeleteConfirmId(null)}
        >
          <div
            className="fade-in"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-xl)',
              maxWidth: '420px',
              width: '100%',
              maxHeight: 'min(90vh, 90dvh)',
              overflowY: 'auto',
              margin: 'auto',
              padding: '1.5rem',
              transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--color-danger)', marginBottom: '0.75rem' }}>
              <Trash2 size={22} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, color: 'var(--color-text-primary)' }}>
                Delete Review?
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Are you sure you want to delete your review for this product? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleteLoading}
                style={{ fontSize: '0.8125rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleDeleteReview(deleteConfirmId)}
                disabled={deleteLoading}
                style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                {deleteLoading ? (
                  <>
                    <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Deleting...
                  </>
                ) : (
                  'Confirm Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default ProductDetails


/**
 * Products.jsx — Seller Product Management (Catalog, Status, Search, and Actions)
 */

import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Package,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Edit,
  ExternalLink,
  Loader2,
  AlertCircle,
  Tag,
  Boxes,
  Eye,
  RotateCcw,
  ShoppingBag
} from 'lucide-react'
import { getSellerProducts, getCategories } from '@/services/productService'
import { ROUTES } from '@/constants/routes'
import { resolveImageUrl } from '@/utils/imageUtils'

const STATUS_CONFIG = {
  APPROVED: {
    label: 'Approved & Live',
    icon: CheckCircle2,
    badgeClass: 'badge-success',
    color: 'var(--color-success)',
    bg: 'rgba(34, 197, 94, 0.1)',
    border: 'rgba(34, 197, 94, 0.3)',
    desc: 'Visible on customer marketplace'
  },
  PENDING: {
    label: 'Pending Review',
    icon: Clock,
    badgeClass: 'badge-warning',
    color: 'var(--color-warning)',
    bg: 'rgba(234, 179, 8, 0.1)',
    border: 'rgba(234, 179, 8, 0.3)',
    desc: 'Awaiting administrator verification'
  },
  REJECTED: {
    label: 'Rejected',
    icon: XCircle,
    badgeClass: 'badge-danger',
    color: 'var(--color-danger)',
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.3)',
    desc: 'Changes requested before listing'
  },
}

const SellerProducts = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || null
  )

  // Filters & Search (Client-Side filtering on seller's retrieved products)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [productList, categoryList] = await Promise.all([
        getSellerProducts(),
        getCategories(),
      ])
      setProducts(productList || [])
      setCategories(categoryList || [])
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load your product catalog')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Metrics summary
  const metrics = useMemo(() => {
    const total = products.length
    const approved = products.filter((p) => p.status === 'APPROVED').length
    const pending = products.filter((p) => p.status === 'PENDING').length
    const rejected = products.filter((p) => p.status === 'REJECTED').length
    return { total, approved, pending, rejected }
  }, [products])

  // Filtered product list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.slug && p.slug.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory =
        selectedCategory === 'ALL' ||
        (p.categoryId && String(p.categoryId) === String(selectedCategory))

      const matchesStatus =
        selectedStatus === 'ALL' || p.status === selectedStatus

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [products, searchQuery, selectedCategory, selectedStatus])

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(price || 0)

  const formatDate = (isoString) => {
    if (!isoString) return '—'
    return new Date(isoString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="fade-in" style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Success Banner (shown after add/edit redirect) ── */}
      {successMessage && (
        <div
          style={{
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.875rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            color: 'var(--color-success)',
            fontSize: '0.875rem',
            fontWeight: '600',
          }}
        >
          <span>✓ {successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-success)',
              fontSize: '1rem',
              lineHeight: 1,
              padding: '0.1rem',
            }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
      
      {/* ── Page Header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: 'var(--color-surface)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
              Product Inventory
            </h1>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                backgroundColor: 'var(--color-surface-raised)',
                color: 'var(--color-text-secondary)',
                padding: '0.2rem 0.55rem',
                borderRadius: '999px',
                border: '1px solid var(--color-border)',
              }}
            >
              {products.length} Items
            </span>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem', margin: 0 }}>
            Manage listings, track admin approval statuses, and update available stock.
          </p>
        </div>

        <Link
          to={ROUTES.SELLER_ADD_PRODUCT}
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            fontWeight: '600',
            fontSize: '0.875rem',
          }}
        >
          <Plus size={18} />
          Add New Product
        </Link>
      </div>

      {/* ── Summary Metric Cards ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Total */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.15rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Boxes size={22} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: '600', textTransform: 'uppercase', margin: 0 }}>
              Total Listings
            </p>
            <p style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.2 }}>
              {metrics.total}
            </p>
          </div>
        </div>

        {/* Approved */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.15rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: '600', textTransform: 'uppercase', margin: 0 }}>
              Live in Store
            </p>
            <p style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-success)', margin: 0, lineHeight: 1.2 }}>
              {metrics.approved}
            </p>
          </div>
        </div>

        {/* Pending */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.15rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(234, 179, 8, 0.1)',
              color: 'var(--color-warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: '600', textTransform: 'uppercase', margin: 0 }}>
              Under Review
            </p>
            <p style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-warning)', margin: 0, lineHeight: 1.2 }}>
              {metrics.pending}
            </p>
          </div>
        </div>

        {/* Rejected */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.15rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--color-danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <XCircle size={22} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: '600', textTransform: 'uppercase', margin: 0 }}>
              Needs Revision
            </p>
            <p style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-danger)', margin: 0, lineHeight: 1.2 }}>
              {metrics.rejected}
            </p>
          </div>
        </div>
      </div>

      {/* ── Search and Filter Controls ── */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          padding: '1rem 1.25rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '460px' }}>
            <Search
              size={17}
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
              placeholder="Search products by title, SKU, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.5rem', width: '100%', fontSize: '0.85rem' }}
            />
          </div>

          {/* Category Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tag size={16} color="var(--color-text-secondary)" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-input"
              style={{ width: 'auto', minWidth: '180px', fontSize: '0.85rem' }}
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.875rem', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: 'All Listings', count: metrics.total },
            { key: 'APPROVED', label: 'Approved', count: metrics.approved },
            { key: 'PENDING', label: 'Pending Review', count: metrics.pending },
            { key: 'REJECTED', label: 'Rejected', count: metrics.rejected },
          ].map((tab) => {
            const active = selectedStatus === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setSelectedStatus(tab.key)}
                style={{
                  padding: '0.4rem 0.875rem',
                  fontSize: '0.8rem',
                  fontWeight: active ? '700' : '500',
                  borderRadius: 'var(--radius-xs)',
                  border: active ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: active ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
                  color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'var(--transition-fast)',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '999px',
                    backgroundColor: active ? 'var(--color-primary)' : 'var(--color-surface-raised)',
                    color: active ? '#ffffff' : 'var(--color-text-secondary)',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Main Product Table / List ── */}
      {loading ? (
        <div
          style={{
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
          }}
        >
          <Loader2 size={32} className="animate-spin" color="var(--color-primary)" />
          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '500' }}>Loading your product catalog...</p>
        </div>
      ) : error ? (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--color-danger)',
          }}
        >
          <AlertCircle size={32} style={{ margin: '0 auto 0.5rem' }} />
          <p style={{ fontWeight: '600', marginBottom: '1rem' }}>{error}</p>
          <button className="btn btn-secondary" onClick={fetchData} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <RotateCcw size={15} /> Retry
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            padding: '4rem 2rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
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
            <Package size={28} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
            {products.length === 0 ? 'No products listed yet' : 'No matching products found'}
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            {products.length === 0
              ? 'Get started by creating your first product listing. Once submitted, it will be sent to the moderation queue for review.'
              : 'Try clearing your search query or adjusting your filters to see more results.'}
          </p>
          {products.length === 0 ? (
            <Link to={ROUTES.SELLER_ADD_PRODUCT} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} /> Add Your First Product
            </Link>
          ) : (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('ALL')
                setSelectedStatus('ALL')
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--color-surface-raised)',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text-secondary)',
                    fontWeight: '700',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <th style={{ padding: '0.875rem 1.25rem' }}>Product</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Price</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Stock</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Date Listed</th>
                  <th style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const statusInfo = STATUS_CONFIG[p.status] || STATUS_CONFIG.PENDING
                  const StatusIcon = statusInfo.icon

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Product Info & Thumbnail */}
                      <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: 'var(--radius-xs)',
                              backgroundColor: 'var(--color-surface-raised)',
                              border: '1px solid var(--color-border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              flexShrink: 0,
                            }}
                          >
                            {p.imageUrl ? (
                              <img
                                src={resolveImageUrl(p.imageUrl)}
                                alt={p.name}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  e.target.parentNode.innerHTML = '<span style="color:var(--color-text-disabled)">📦</span>'
                                }}
                              />
                            ) : (
                              <Package size={20} color="var(--color-text-disabled)" />
                            )}
                          </div>
                          <div>
                            <p style={{ fontWeight: '700', color: 'var(--color-text-primary)', margin: 0, fontSize: '0.9rem' }}>
                              {p.name}
                            </p>
                            <p style={{ fontSize: '0.725rem', color: 'var(--color-text-disabled)', margin: 0 }}>
                              SKU: {p.slug || `PRD-${p.id}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '1rem 1rem', verticalAlign: 'middle', color: 'var(--color-text-secondary)' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            backgroundColor: 'var(--color-surface-raised)',
                            border: '1px solid var(--color-border)',
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-xs)',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                          }}
                        >
                          {p.categoryName || 'Uncategorized'}
                        </span>
                      </td>

                      {/* Price */}
                      <td style={{ padding: '1rem 1rem', verticalAlign: 'middle', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                        {formatPrice(p.price)}
                      </td>

                      {/* Stock */}
                      <td style={{ padding: '1rem 1rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span
                            style={{
                              fontWeight: '600',
                              color: p.stockQuantity === 0 ? 'var(--color-danger)' : p.stockQuantity < 5 ? 'var(--color-warning)' : 'var(--color-text-primary)',
                            }}
                          >
                            {p.stockQuantity} units
                          </span>
                          {p.stockQuantity === 0 && (
                            <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '4px', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', fontWeight: '700' }}>
                              OUT OF STOCK
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem 1rem', verticalAlign: 'middle' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '999px',
                            backgroundColor: statusInfo.bg,
                            border: `1px solid ${statusInfo.border}`,
                            color: statusInfo.color,
                            fontSize: '0.75rem',
                            fontWeight: '700',
                          }}
                          title={statusInfo.desc}
                        >
                          <StatusIcon size={13} />
                          <span>{p.status}</span>
                        </div>
                        {p.status === 'REJECTED' && p.rejectionReason && (
                          <div
                            style={{
                              marginTop: '0.35rem',
                              fontSize: '0.72rem',
                              color: 'var(--color-danger)',
                              maxWidth: '180px',
                              lineHeight: '1.3'
                            }}
                            title={`Admin feedback: ${p.rejectionReason}`}
                          >
                            <strong>Feedback:</strong> {p.rejectionReason}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '1rem 1rem', verticalAlign: 'middle', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                        {formatDate(p.createdAt)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <Link
                            to={`/seller/products/${p.id}/edit`}
                            className="btn btn-secondary"
                            style={{
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.8rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                            title="Edit product details & pricing"
                          >
                            <Edit size={14} />
                            <span>Edit</span>
                          </Link>

                          {p.status === 'APPROVED' && (
                            <Link
                              to={`/customer/products/${p.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary"
                              style={{
                                padding: '0.35rem 0.5rem',
                                color: 'var(--color-text-secondary)',
                              }}
                              title="Preview on customer marketplace (New Tab)"
                            >
                              <ExternalLink size={14} />
                            </Link>
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

    </div>
  )
}

export default SellerProducts

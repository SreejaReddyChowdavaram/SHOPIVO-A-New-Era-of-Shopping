/**
 * Inventory.jsx — Platform Inventory Oversight & Warehouse Stock Monitoring
 * Route: /admin/inventory
 * Layout: AdminLayout
 *
 * Provides platform administrators with bird's-eye visibility into inventory
 * levels across all merchant stores, low-stock alerts, and restocking needs.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Boxes,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  RotateCcw,
  Store,
  Tag,
  DollarSign,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { getAdminProducts } from '@/services/productService'

const STOCK_FILTERS = [
  { id: 'ALL', label: 'All Catalog Items' },
  { id: 'LOW', label: 'Low Stock Alerts (< 10)' },
  { id: 'OUT', label: 'Out of Stock (0)' },
  { id: 'HEALTHY', label: 'Healthy Stock (> 10)' },
]

const Inventory = () => {
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters & Search
  const [selectedFilter, setSelectedFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // Pagination
  const [page, setPage] = useState(0)
  const pageSize = 10

  const fetchInventory = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAdminProducts({ search: searchQuery || undefined })
      setProducts(data || [])
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch platform inventory.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [searchQuery])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(0)
    setSearchQuery(searchInput.trim())
  }

  const handleResetSearch = () => {
    setSearchInput('')
    setSearchQuery('')
    setSelectedFilter('ALL')
    setPage(0)
  }

  // Filtered products calculation
  const filteredProducts = products.filter((p) => {
    const stock = Number(p.stockQuantity) || 0
    if (selectedFilter === 'LOW') return stock > 0 && stock <= 10
    if (selectedFilter === 'OUT') return stock === 0
    if (selectedFilter === 'HEALTHY') return stock > 10
    return true
  })

  // Summary Metrics
  const totalItems = products.length
  const outOfStockCount = products.filter((p) => (Number(p.stockQuantity) || 0) === 0).length
  const lowStockCount = products.filter((p) => {
    const stock = Number(p.stockQuantity) || 0
    return stock > 0 && stock <= 10
  }).length
  const inStockCount = products.filter((p) => (Number(p.stockQuantity) || 0) > 10).length

  // Paginated slice
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1
  const paginatedProducts = filteredProducts.slice(page * pageSize, (page + 1) * pageSize)

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(val) || 0)
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
              <Boxes size={24} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
              Inventory Oversight
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.925rem' }}>
            Monitor real-time warehouse stock levels, low-stock warnings, and merchant replenishment across all catalog items.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary"
            onClick={fetchInventory}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/admin/products')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Package size={16} />
            Product Moderation
          </button>
        </div>
      </div>

      {/* ── Error Alert ── */}
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
              CATALOG ITEMS
            </span>
            <Boxes size={18} style={{ color: 'var(--color-primary-light)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
            {totalItems}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>Total products monitored</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
              HEALTHY STOCK
            </span>
            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#10b981' }}>
            {inStockCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>Units &gt; 10 in stock</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
              LOW STOCK ALERTS
            </span>
            <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f59e0b' }}>
            {lowStockCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>1 to 10 units remaining</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
              OUT OF STOCK
            </span>
            <XCircle size={18} style={{ color: 'var(--color-danger)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-danger)' }}>
            {outOfStockCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>Zero available inventory</span>
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
          {STOCK_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setSelectedFilter(f.id)
                setPage(0)
              }}
              className={`btn ${selectedFilter === f.id ? 'btn-primary' : 'btn-secondary'}`}
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
              placeholder="Search product title..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '100%', fontSize: '0.875rem' }}
            />
          </div>
          <button type="submit" className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.875rem' }}>
            Search
          </button>
          {(searchQuery || selectedFilter !== 'ALL') && (
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

      {/* ── Inventory Table ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-raised)',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <th style={{ padding: '1rem 1.25rem' }}>Product Details</th>
                <th style={{ padding: '1rem 1.25rem' }}>Merchant</th>
                <th style={{ padding: '1rem 1.25rem' }}>Category</th>
                <th style={{ padding: '1rem 1.25rem' }}>Unit Price</th>
                <th style={{ padding: '1rem 1.25rem' }}>Stock Level</th>
                <th style={{ padding: '1rem 1.25rem' }}>Health Status</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-disabled)' }}>
                    <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>Loading inventory catalog...</p>
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    <Package size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.35 }} />
                    <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-text-primary)' }}>
                      No inventory items found
                    </p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--color-text-disabled)' }}>
                      {searchQuery || selectedFilter !== 'ALL'
                        ? 'Try adjusting your stock filter or search query.'
                        : 'No products have been cataloged on the platform yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const stock = Number(p.stockQuantity) || 0
                  const isOut = stock === 0
                  const isLow = stock > 0 && stock <= 10
                  const isHealthy = stock > 10

                  let healthClass = 'badge-success'
                  let healthLabel = 'In Stock'
                  if (isOut) {
                    healthClass = 'badge-danger'
                    healthLabel = 'Out of Stock'
                  } else if (isLow) {
                    healthClass = 'badge-warning'
                    healthLabel = 'Low Stock'
                  }

                  // Visual bar percentage (capped at 50 units for 100%)
                  const barPercent = Math.min(100, Math.max(0, (stock / 50) * 100))

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
                      {/* Product */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.title}
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: 'var(--radius-sm)',
                                objectFit: 'cover',
                                backgroundColor: 'var(--color-surface-raised)',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--color-surface-raised)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-text-disabled)',
                              }}
                            >
                              <Package size={18} />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                              {p.title}
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>
                              SKU: PRD-#{String(p.id).padStart(5, '0')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Merchant */}
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Store size={13} style={{ color: 'var(--color-text-disabled)' }} />
                          {p.sellerName || 'Platform Merchant'}
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                          {p.categoryName || 'General'}
                        </span>
                      </td>

                      {/* Price */}
                      <td style={{ padding: '1rem 1.25rem', fontWeight: '600', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                        {formatCurrency(p.price)}
                      </td>

                      {/* Stock Quantity & Progress Bar */}
                      <td style={{ padding: '1rem 1.25rem', minWidth: '130px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                          <span style={{ fontWeight: '700', fontSize: '0.875rem', color: isOut ? 'var(--color-danger)' : (isLow ? '#f59e0b' : 'var(--color-text-primary)') }}>
                            {stock} units
                          </span>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: '6px',
                            backgroundColor: 'var(--color-surface-raised)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${barPercent}%`,
                              height: '100%',
                              backgroundColor: isOut ? 'var(--color-danger)' : (isLow ? '#f59e0b' : '#10b981'),
                              borderRadius: '3px',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </td>

                      {/* Health Status */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span className={`badge ${healthClass}`} style={{ fontSize: '0.75rem' }}>
                          {healthLabel}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => navigate('/admin/products')}
                          title="Manage in Moderation Center"
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <span>Manage</span>
                          <ExternalLink size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.875rem 1.25rem',
              borderTop: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              Showing {paginatedProducts.length} of {filteredProducts.length} items
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                disabled={page === 0 || loading}
                onClick={() => setPage((p) => p - 1)}
                style={{ padding: '0.35rem 0.65rem' }}
              >
                <ChevronLeft size={16} />
              </button>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 0.75rem',
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-primary)',
                  fontWeight: '600',
                }}
              >
                Page {page + 1} of {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={page >= totalPages - 1 || loading}
                onClick={() => setPage((p) => p + 1)}
                style={{ padding: '0.35rem 0.65rem' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Inventory

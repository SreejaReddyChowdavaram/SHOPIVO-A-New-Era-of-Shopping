/**
 * Inventory.jsx — Seller Stock Management
 * Route: /seller/inventory
 * Layout: SellerLayout
 *
 * Allows sellers to view and update stock quantities for all their products.
 * Uses PATCH /seller/products/{id}/stock — stock-only edits do NOT reset
 * the product status to PENDING.
 *
 * Low-stock threshold: < 5 units (shown with orange warning indicator)
 * Out-of-stock: 0 units (shown with red indicator, product hidden from buyers)
 */

import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  Search,
  AlertCircle,
  RotateCcw,
  Loader2,
  Edit,
  Check,
  X,
  TrendingUp,
  CheckCircle2,
  Boxes,
  AlertTriangle,
} from 'lucide-react'
import { getSellerProducts, updateProductStock } from '@/services/productService'
import { ROUTES } from '@/constants/routes'

// Stock badges
const STOCK_STATUS = {
  OUT:  { label: 'Out of Stock', color: 'var(--color-danger)',  bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)' },
  LOW:  { label: 'Low Stock',    color: 'var(--color-warning)', bg: 'rgba(234,179,8,0.1)',  border: 'rgba(234,179,8,0.3)' },
  OK:   { label: 'In Stock',     color: 'var(--color-success)', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.3)' },
}

const LOW_STOCK_THRESHOLD = 5

const getStockStatus = (qty) => {
  if (qty === 0)               return 'OUT'
  if (qty < LOW_STOCK_THRESHOLD) return 'LOW'
  return 'OK'
}

const Inventory = () => {
  const [products, setProducts]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [searchQuery, setSearchQuery]     = useState('')

  // Inline-edit state: productId → { value, saving, error }
  const [editState, setEditState] = useState({})

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await getSellerProducts()
      setProducts(list || [])
    } catch (err) {
      setError(err.message || 'Failed to load inventory data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // Summary counts
  const summary = useMemo(() => ({
    total:    products.length,
    outOfStock: products.filter((p) => p.stockQuantity === 0).length,
    lowStock:   products.filter((p) => p.stockQuantity > 0 && p.stockQuantity < LOW_STOCK_THRESHOLD).length,
    healthy:    products.filter((p) => p.stockQuantity >= LOW_STOCK_THRESHOLD).length,
  }), [products])

  // Filtered list
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return products
    const q = searchQuery.toLowerCase()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(q))
    )
  }, [products, searchQuery])

  // Begin inline edit
  const startEdit = (product) => {
    setEditState((prev) => ({
      ...prev,
      [product.id]: { value: String(product.stockQuantity), saving: false, error: null },
    }))
  }

  // Cancel inline edit
  const cancelEdit = (id) => {
    setEditState((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  // Save stock update
  const saveStock = async (product) => {
    const state = editState[product.id]
    if (!state) return

    const newQty = parseInt(state.value, 10)
    if (isNaN(newQty) || newQty < 0) {
      setEditState((prev) => ({
        ...prev,
        [product.id]: { ...prev[product.id], error: 'Must be 0 or greater' },
      }))
      return
    }

    setEditState((prev) => ({
      ...prev,
      [product.id]: { ...prev[product.id], saving: true, error: null },
    }))

    try {
      const updated = await updateProductStock(product.id, newQty)
      // Update the local products list
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, stockQuantity: updated.stockQuantity } : p))
      )
      cancelEdit(product.id)
    } catch (err) {
      setEditState((prev) => ({
        ...prev,
        [product.id]: {
          ...prev[product.id],
          saving: false,
          error: err.message || 'Failed to update stock',
        },
      }))
    }
  }

  return (
    <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Page Header ── */}
      <div style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        padding: '1.25rem 1.5rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
            Stock Management
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem', margin: 0 }}>
            Update stock levels for your products. Adjusting stock does not trigger admin re-review.
          </p>
        </div>
        <Link
          to={ROUTES.SELLER_ADD_PRODUCT}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.1rem', fontSize: '0.85rem', fontWeight: '600' }}
        >
          + Add Product
        </Link>
      </div>

      {/* ── Loading / Error ── */}
      {loading ? (
        <div style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          padding: '3.5rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          color: 'var(--color-text-secondary)',
        }}>
          <Loader2 size={28} className="animate-spin" color="var(--color-primary)" />
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Loading your inventory...</p>
        </div>
      ) : error ? (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-sm)',
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--color-danger)',
        }}>
          <AlertCircle size={28} style={{ margin: '0 auto 0.5rem' }} />
          <p style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</p>
          <button className="btn btn-secondary" onClick={fetchData} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
            <RotateCcw size={14} /> Retry
          </button>
        </div>
      ) : (
        <>
          {/* ── Summary Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Total SKUs',     value: summary.total,      icon: Boxes,        iconBg: 'rgba(4, 219, 126, 0.12)', iconColor: 'var(--color-primary)',   valueColor: 'var(--color-text-primary)' },
              { label: 'Healthy Stock',  value: summary.healthy,    icon: CheckCircle2, iconBg: 'rgba(34,197,94,0.1)',   iconColor: 'var(--color-success)',   valueColor: 'var(--color-success)' },
              { label: 'Low Stock',      value: summary.lowStock,   icon: AlertTriangle,iconBg: 'rgba(234,179,8,0.1)',   iconColor: 'var(--color-warning)',   valueColor: 'var(--color-warning)' },
              { label: 'Out of Stock',   value: summary.outOfStock, icon: AlertCircle,  iconBg: 'rgba(239,68,68,0.1)',   iconColor: 'var(--color-danger)',    valueColor: 'var(--color-danger)' },
            ].map((card) => {
              const Icon = card.icon
              return (
                <div key={card.label} style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.875rem',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  <div style={{
                    width: '42px', height: '42px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: card.iconBg,
                    color: card.iconColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                      {card.label}
                    </p>
                    <p style={{ fontSize: '1.4rem', fontWeight: '800', color: card.valueColor, margin: 0, lineHeight: 1.2 }}>
                      {card.value}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Search ── */}
          <div style={{ position: 'relative', maxWidth: '420px' }}>
            <Search size={16} style={{
              position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--color-text-disabled)', pointerEvents: 'none',
            }} />
            <input
              type="text"
              placeholder="Search by product name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.5rem', width: '100%', fontSize: '0.85rem' }}
            />
          </div>

          {/* ── Inventory Table ── */}
          {filtered.length === 0 ? (
            <div style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              padding: '3.5rem 2rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <Package size={32} style={{ margin: '0 auto 0.75rem', color: 'var(--color-text-disabled)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
                {products.length === 0 ? 'No products found' : 'No matching products'}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', maxWidth: '360px', margin: '0 auto' }}>
                {products.length === 0
                  ? 'Add your first product to start managing inventory.'
                  : 'Try clearing your search query.'}
              </p>
            </div>
          ) : (
            <div style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{
                      backgroundColor: 'var(--color-surface-raised)',
                      borderBottom: '1px solid var(--color-border)',
                      color: 'var(--color-text-secondary)',
                      fontWeight: '700',
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}>
                      <th style={{ padding: '0.875rem 1.25rem' }}>Product</th>
                      <th style={{ padding: '0.875rem 1rem' }}>Category</th>
                      <th style={{ padding: '0.875rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.875rem 1rem' }}>Current Stock</th>
                      <th style={{ padding: '0.875rem 1rem' }}>Stock Health</th>
                      <th style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>Update Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => {
                      const stockStatus = STOCK_STATUS[getStockStatus(p.stockQuantity)]
                      const editing = editState[p.id]

                      return (
                        <tr
                          key={p.id}
                          style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.1s' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          {/* Product info */}
                          <td style={{ padding: '0.875rem 1.25rem', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{
                                width: '42px', height: '42px',
                                borderRadius: 'var(--radius-xs)',
                                backgroundColor: 'var(--color-surface-raised)',
                                border: '1px solid var(--color-border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden', flexShrink: 0,
                              }}>
                                {p.imageUrl ? (
                                  <img
                                    src={p.imageUrl}
                                    alt={p.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    onError={(e) => { e.target.style.display = 'none' }}
                                  />
                                ) : (
                                  <Package size={18} color="var(--color-text-disabled)" />
                                )}
                              </div>
                              <div>
                                <p style={{ fontWeight: '700', color: 'var(--color-text-primary)', margin: 0, fontSize: '0.875rem' }}>
                                  {p.name}
                                </p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-disabled)', margin: 0 }}>
                                  ID: {p.id}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td style={{ padding: '0.875rem 1rem', verticalAlign: 'middle', color: 'var(--color-text-secondary)' }}>
                            <span style={{
                              backgroundColor: 'var(--color-surface-raised)',
                              border: '1px solid var(--color-border)',
                              padding: '0.18rem 0.45rem',
                              borderRadius: 'var(--radius-xs)',
                              fontSize: '0.73rem',
                              fontWeight: '500',
                            }}>
                              {p.categoryName || 'Uncategorized'}
                            </span>
                          </td>

                          {/* Product status */}
                          <td style={{ padding: '0.875rem 1rem', verticalAlign: 'middle' }}>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '999px',
                              backgroundColor:
                                p.status === 'APPROVED' ? 'rgba(34,197,94,0.1)'
                                : p.status === 'REJECTED' ? 'rgba(239,68,68,0.1)'
                                : 'rgba(234,179,8,0.1)',
                              color:
                                p.status === 'APPROVED' ? 'var(--color-success)'
                                : p.status === 'REJECTED' ? 'var(--color-danger)'
                                : 'var(--color-warning)',
                            }}>
                              {p.status}
                            </span>
                          </td>

                          {/* Current stock */}
                          <td style={{ padding: '0.875rem 1rem', verticalAlign: 'middle' }}>
                            <span style={{
                              fontWeight: '700',
                              fontSize: '0.9375rem',
                              color:
                                p.stockQuantity === 0 ? 'var(--color-danger)'
                                : p.stockQuantity < LOW_STOCK_THRESHOLD ? 'var(--color-warning)'
                                : 'var(--color-text-primary)',
                            }}>
                              {p.stockQuantity}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-disabled)', marginLeft: '0.3rem' }}>units</span>
                          </td>

                          {/* Stock health badge */}
                          <td style={{ padding: '0.875rem 1rem', verticalAlign: 'middle' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '999px',
                              backgroundColor: stockStatus.bg,
                              border: `1px solid ${stockStatus.border}`,
                              color: stockStatus.color,
                            }}>
                              {stockStatus.label}
                            </span>
                          </td>

                          {/* Inline stock edit */}
                          <td style={{ padding: '0.875rem 1.25rem', verticalAlign: 'middle', textAlign: 'right' }}>
                            {editing ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={editing.value}
                                  onChange={(e) =>
                                    setEditState((prev) => ({
                                      ...prev,
                                      [p.id]: { ...prev[p.id], value: e.target.value, error: null },
                                    }))
                                  }
                                  className="form-input"
                                  style={{
                                    width: '80px',
                                    padding: '0.3rem 0.5rem',
                                    fontSize: '0.85rem',
                                    textAlign: 'center',
                                    borderColor: editing.error ? 'var(--color-danger)' : undefined,
                                  }}
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveStock(p)
                                    if (e.key === 'Escape') cancelEdit(p.id)
                                  }}
                                  disabled={editing.saving}
                                />
                                <button
                                  onClick={() => saveStock(p)}
                                  disabled={editing.saving}
                                  className="btn btn-primary"
                                  style={{ padding: '0.3rem 0.55rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                  title="Save"
                                >
                                  {editing.saving
                                    ? <Loader2 size={13} className="animate-spin" />
                                    : <Check size={13} />
                                  }
                                </button>
                                <button
                                  onClick={() => cancelEdit(p.id)}
                                  disabled={editing.saving}
                                  className="btn btn-secondary"
                                  style={{ padding: '0.3rem 0.55rem', fontSize: '0.78rem' }}
                                  title="Cancel"
                                >
                                  <X size={13} />
                                </button>
                                {editing.error && (
                                  <p style={{ width: '100%', color: 'var(--color-danger)', fontSize: '0.72rem', margin: '0.2rem 0 0', textAlign: 'right' }}>
                                    {editing.error}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => startEdit(p)}
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                                title="Update stock quantity"
                              >
                                <Edit size={13} />
                                Update
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </>
      )}
    </div>
  )
}

export default Inventory

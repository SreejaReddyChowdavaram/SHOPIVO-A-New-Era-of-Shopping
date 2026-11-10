/**
 * SellerDetails.jsx — Admin Platform Seller Operational Overview
 * Route: /admin/sellers/:id
 * Layout: AdminLayout
 *
 * Provides deep platform oversight over a seller's account status,
 * catalog health (approved, pending, rejected products), order fulfillment
 * metrics (total, completed, cancelled), and administrative suspension controls.
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Store,
  Mail,
  Calendar,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Truck,
  AlertTriangle,
  AlertCircle,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Check,
  Ban
} from 'lucide-react'
import {
  getAdminSellerDetail,
  suspendSeller,
  activateSeller
} from '@/services/userService'

const SellerDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ open: false, action: null })

  const fetchDetail = async () => {
    try {
      setLoading(true)
      const data = await getAdminSellerDetail(id)
      setSeller(data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load seller platform detail')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [id])

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const handleToggleStatus = async () => {
    if (!seller) return
    try {
      setActionLoading(true)
      if (seller.enabled) {
        await suspendSeller(seller.id)
      } else {
        await activateSeller(seller.id)
      }
      await fetchDetail()
      setConfirmModal({ open: false, action: null })
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update seller account status')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', flexDirection: 'column', gap: '1rem', color: 'var(--color-text-secondary)' }}>
        <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
        <span>Loading seller operational record...</span>
      </div>
    )
  }

  if (error || !seller) {
    return (
      <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
        <button
          onClick={() => navigate('/admin/sellers')}
          className="btn btn-secondary"
          style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={16} /> Back to Sellers
        </button>
        <div className="card" style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.5rem' }}>
          <AlertCircle size={20} />
          <span>{error || 'Seller not found'}</span>
        </div>
      </div>
    )
  }

  const isSuspended = !seller.enabled

  return (
    <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/sellers')}
        className="btn btn-secondary"
        style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <ArrowLeft size={16} /> Back to Sellers
      </button>

      {/* Header Banner */}
      <div className="card" style={{
        padding: '1.75rem',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1.5rem',
        borderLeft: isSuspended ? '4px solid var(--color-danger)' : '4px solid var(--color-success)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: isSuspended ? 'rgba(239, 68, 68, 0.12)' : 'rgba(4, 219, 126, 0.12)',
            color: isSuspended ? 'var(--color-danger)' : 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Store size={28} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
                {seller.sellerName}
              </h1>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: isSuspended ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                color: isSuspended ? 'var(--color-danger)' : 'var(--color-success)',
                border: `1px solid ${isSuspended ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`
              }}>
                {isSuspended ? 'Suspended' : 'Active Seller'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.6rem', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Mail size={14} /> {seller.email}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={14} /> Registered: {formatDate(seller.createdAt)}
              </span>
              <span style={{ fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                Seller ID: #{seller.id}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {isSuspended ? (
            <button
              onClick={() => setConfirmModal({ open: true, action: 'activate' })}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'var(--color-success)',
                borderColor: 'var(--color-success)'
              }}
            >
              <Check size={16} /> Activate Seller Account
            </button>
          ) : (
            <button
              onClick={() => setConfirmModal({ open: true, action: 'suspend' })}
              className="btn btn-danger"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Ban size={16} /> Suspend Seller Account
            </button>
          )}
        </div>
      </div>

      {/* Suspension Alert if applicable */}
      {isSuspended && (
        <div className="card" style={{
          marginBottom: '2rem',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1.25rem 1.5rem'
        }}>
          <ShieldAlert size={28} color="var(--color-danger)" style={{ flexShrink: 0 }} />
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-danger)', margin: 0, marginBottom: '0.2rem' }}>
              Account Currently Suspended
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              This seller is blocked from signing in, listing new products, editing existing products, updating stock, and processing orders. Historical records, products, and customer orders remain safely preserved.
            </p>
          </div>
        </div>
      )}

      {/* Section: Catalog Summary */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={20} color="var(--color-primary)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
              Product Catalog Health
            </h2>
          </div>
          <Link
            to={`/admin/products`}
            style={{ fontSize: '0.8125rem', color: 'var(--color-primary-light)', textDecoration: 'none', fontWeight: '600' }}
          >
            Moderate catalog items →
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>
              Total Listings
            </span>
            <p style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: '0.35rem 0 0 0' }}>
              {seller.totalProducts}
            </p>
          </div>

          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>
              Approved (Live)
            </span>
            <p style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-success)', margin: '0.35rem 0 0 0' }}>
              {seller.approvedProducts}
            </p>
          </div>

          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>
              Pending Moderation
            </span>
            <p style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-warning)', margin: '0.35rem 0 0 0' }}>
              {seller.pendingProducts}
            </p>
          </div>

          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>
              Rejected Listings
            </span>
            <p style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-danger)', margin: '0.35rem 0 0 0' }}>
              {seller.rejectedProducts}
            </p>
          </div>
        </div>
      </div>

      {/* Section: Orders Fulfillment Summary */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={20} color="var(--color-primary)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
              Order Fulfillment Summary
            </h2>
          </div>
          <Link
            to="/admin/orders"
            style={{ fontSize: '0.8125rem', color: 'var(--color-primary-light)', textDecoration: 'none', fontWeight: '600' }}
          >
            Platform orders →
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>
              Total Orders with Seller Items
            </span>
            <p style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: '0.35rem 0 0 0' }}>
              {seller.totalOrders}
            </p>
          </div>

          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>
              Delivered (Completed)
            </span>
            <p style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-success)', margin: '0.35rem 0 0 0' }}>
              {seller.completedOrders}
            </p>
          </div>

          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>
              Cancelled Orders
            </span>
            <p style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-danger)', margin: '0.35rem 0 0 0' }}>
              {seller.cancelledOrders}
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: confirmModal.action === 'suspend' ? 'var(--color-danger)' : 'var(--color-success)' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
                {confirmModal.action === 'suspend' ? 'Suspend Seller Account' : 'Activate Seller Account'}
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {confirmModal.action === 'suspend' ? (
                <>Are you sure you want to suspend <strong>{seller.sellerName}</strong>? The seller will be unable to log in, create products, or process orders until reinstated. Existing products and orders will not be deleted.</>
              ) : (
                <>Reactivate seller account for <strong>{seller.sellerName}</strong>? The seller will regain access to their portal and fulfillment capabilities.</>
              )}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmModal({ open: false, action: null })}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={confirmModal.action === 'suspend' ? 'btn btn-danger' : 'btn btn-primary'}
                onClick={handleToggleStatus}
                disabled={actionLoading}
                style={confirmModal.action === 'activate' ? { backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' } : {}}
              >
                {actionLoading ? 'Processing...' : (confirmModal.action === 'suspend' ? 'Confirm Suspension' : 'Confirm Activation')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SellerDetails

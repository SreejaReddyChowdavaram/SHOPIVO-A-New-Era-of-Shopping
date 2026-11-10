/**
 * Dashboard.jsx — Admin Platform & Moderation Overview
 * Route: /admin/dashboard
 * Layout: AdminLayout
 *
 * Shows real backend platform metrics:
 *  - Product moderation counts (Total / Pending Review / Approved / Rejected)
 *  - Quick-action link to review pending submissions
 *  - Recent product catalog entries
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Boxes,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  Loader2,
  Eye,
  Store,
  TrendingUp,
  ShoppingCart,
  Truck,
  CreditCard,
  Users,
  UserCheck,
} from 'lucide-react'
import { getAdminProducts } from '@/services/productService'
import { getAdminOrderMetrics } from '@/services/orderService'
import { getAdminUserMetrics } from '@/services/userService'
import { ROUTES } from '@/constants/routes'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [orderMetrics, setOrderMetrics] = useState(null)
  const [userMetrics, setUserMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [productsData, metricsData, userMetricsData] = await Promise.all([
        getAdminProducts(),
        getAdminOrderMetrics().catch(() => null),
        getAdminUserMetrics().catch(() => null)
      ])
      setProducts(productsData || [])
      setOrderMetrics(metricsData || null)
      setUserMetrics(userMetricsData || null)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load platform data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const totalProducts = products.length
  const pendingProducts = products.filter(p => p.status === 'PENDING').length
  const approvedProducts = products.filter(p => p.status === 'APPROVED').length
  const rejectedProducts = products.filter(p => p.status === 'REJECTED').length

  const STAT_CARDS = [
    {
      label: 'Total Listings',
      value: totalProducts,
      icon: Boxes,
      iconBg: 'rgba(4, 219, 126, 0.12)',
      iconColor: 'var(--color-primary)',
      valueColor: 'var(--color-text-primary)',
    },
    {
      label: 'Pending Review',
      value: pendingProducts,
      icon: Clock,
      iconBg: 'rgba(234, 179, 8, 0.12)',
      iconColor: 'var(--color-warning)',
      valueColor: 'var(--color-warning)',
      highlight: pendingProducts > 0,
    },
    {
      label: 'Live in Store',
      value: approvedProducts,
      icon: CheckCircle2,
      iconBg: 'rgba(34, 197, 94, 0.12)',
      iconColor: 'var(--color-success)',
      valueColor: 'var(--color-success)',
    },
    {
      label: 'Rejected Listings',
      value: rejectedProducts,
      icon: XCircle,
      iconBg: 'rgba(239, 68, 68, 0.12)',
      iconColor: 'var(--color-danger)',
      valueColor: 'var(--color-danger)',
    },
  ]

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '3rem' }}>
      {/* ── Header ── */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
          Admin Console
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Platform overview: product moderation, catalog health, and system operations.
        </p>
      </div>

      {/* ── Loading / Error ── */}
      {loading ? (
        <div style={{
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
        }}>
          <Loader2 size={32} className="animate-spin" color="var(--color-primary)" />
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Loading platform overview...</p>
        </div>
      ) : error ? (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-sm)',
          padding: '1.5rem',
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
          {/* ── Product Moderation Stat Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {STAT_CARDS.map(card => {
              const Icon = card.icon
              return (
                <div
                  key={card.label}
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: `1px solid ${card.highlight ? 'rgba(234, 179, 8, 0.4)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: card.iconBg,
                    color: card.iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                      {card.label}
                    </p>
                    <p style={{ fontSize: '1.6rem', fontWeight: '800', color: card.valueColor, margin: 0, lineHeight: 1.15 }}>
                      {card.value}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Pending Review Banner (if any pending) ── */}
          {pendingProducts > 0 && (
            <div style={{
              backgroundColor: 'rgba(234, 179, 8, 0.08)',
              border: '1px solid rgba(234, 179, 8, 0.35)',
              borderRadius: 'var(--radius-sm)',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <Clock size={24} color="var(--color-warning)" style={{ flexShrink: 0 }} />
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-warning)', margin: 0 }}>
                    {pendingProducts} Product{pendingProducts !== 1 ? 's' : ''} Awaiting Moderation
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: 0, marginTop: '0.15rem' }}>
                    Seller listings must be reviewed and approved before appearing on the customer marketplace.
                  </p>
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => navigate('/admin/products?status=PENDING')}
                style={{
                  backgroundColor: 'var(--color-warning)',
                  borderColor: 'var(--color-warning)',
                  color: '#000',
                  fontWeight: '700',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <span>Review Pending Items</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* ── Quick Actions ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* Executive Analytics */}
            <Link to={ROUTES.ADMIN_ANALYTICS} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(126,217,87,0.25)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div style={{
                    width: '44px', height: '44px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-primary-subtle)',
                    color: 'var(--color-nav-active-text, var(--color-primary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <TrendingUp size={22} />
                  </div>
                  <div>
                    <p style={{ fontWeight: '700', color: 'var(--color-text-primary)', margin: 0, fontSize: '0.9375rem' }}>
                      Executive Analytics
                    </p>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.8rem', marginTop: '0.15rem' }}>
                      Real-time GMV, trends, cohorts &amp; payment rails
                    </p>
                  </div>
                </div>
                <ArrowRight size={18} color="var(--color-text-disabled)" />
              </div>
            </Link>

            {/* Products Moderation */}
            <Link to={ROUTES.ADMIN_PRODUCTS} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(4, 219, 126, 0.2)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div style={{
                    width: '44px', height: '44px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(4, 219, 126, 0.12)',
                    color: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Package size={22} />
                  </div>
                  <div>
                    <p style={{ fontWeight: '700', color: 'var(--color-text-primary)', margin: 0, fontSize: '0.9375rem' }}>
                      All Products
                    </p>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.8rem', marginTop: '0.15rem' }}>
                      Browse and moderate the complete platform catalog
                    </p>
                  </div>
                </div>
                <ArrowRight size={18} color="var(--color-text-disabled)" />
              </div>
            </Link>

            {/* Review Pending */}
            <Link to="/admin/products?status=PENDING" style={{ textDecoration: 'none' }}>
              <div
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--color-warning)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(234,179,8,0.12)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div style={{
                    width: '44px', height: '44px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(234, 179, 8, 0.12)',
                    color: 'var(--color-warning)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <p style={{ fontWeight: '700', color: 'var(--color-text-primary)', margin: 0, fontSize: '0.9375rem' }}>
                      Pending Submissions
                    </p>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.8rem', marginTop: '0.15rem' }}>
                      {pendingProducts} item{pendingProducts !== 1 ? 's' : ''} waiting for approval
                    </p>
                  </div>
                </div>
                <ArrowRight size={18} color="var(--color-text-disabled)" />
              </div>
            </Link>

            {/* Platform Orders */}
            <Link to="/admin/orders" style={{ textDecoration: 'none' }}>
              <div
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(4, 219, 126, 0.2)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div style={{
                    width: '44px', height: '44px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-primary-subtle)',
                    color: 'var(--color-nav-active-text, var(--color-primary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <ShoppingCart size={22} />
                  </div>
                  <div>
                    <p style={{ fontWeight: '700', color: 'var(--color-text-primary)', margin: 0, fontSize: '0.9375rem' }}>
                      Platform Orders
                    </p>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.8rem', marginTop: '0.15rem' }}>
                      {orderMetrics ? `${orderMetrics.totalOrders} orders across platform` : 'Manage platform fulfillment'}
                    </p>
                  </div>
                </div>
                <ArrowRight size={18} color="var(--color-text-disabled)" />
              </div>
            </Link>

            {/* Platform Users */}
            <Link to="/admin/users" style={{ textDecoration: 'none' }}>
              <div
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(4, 219, 126, 0.2)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div style={{
                    width: '44px', height: '44px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(0, 199, 122, 0.12)',
                    color: '#00C77A',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Users size={22} />
                  </div>
                  <div>
                    <p style={{ fontWeight: '700', color: 'var(--color-text-primary)', margin: 0, fontSize: '0.9375rem' }}>
                      User Accounts
                    </p>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.8rem', marginTop: '0.15rem' }}>
                      {userMetrics ? `${userMetrics.totalUsers} registered accounts` : 'Manage customer & seller accounts'}
                    </p>
                  </div>
                </div>
                <ArrowRight size={18} color="var(--color-text-disabled)" />
              </div>
            </Link>

            {/* Seller Management */}
            <Link to="/admin/sellers" style={{ textDecoration: 'none' }}>
              <div
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(4, 219, 126, 0.2)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div style={{
                    width: '44px', height: '44px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                    color: 'var(--color-success)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Store size={22} />
                  </div>
                  <div>
                    <p style={{ fontWeight: '700', color: 'var(--color-text-primary)', margin: 0, fontSize: '0.9375rem' }}>
                      Seller Management
                    </p>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.8rem', marginTop: '0.15rem' }}>
                      {userMetrics ? `${userMetrics.totalSellers} sellers (${userMetrics.activeSellers} active)` : 'Monitor seller operations'}
                    </p>
                  </div>
                </div>
                <ArrowRight size={18} color="var(--color-text-disabled)" />
              </div>
            </Link>
          </div>

          {/* ── Platform Users & Seller Ecosystem Overview ── */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Users size={20} color="var(--color-primary)" />
                <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
                  Platform Users & Seller Ecosystem
                </h2>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Link to="/admin/users" style={{ fontSize: '0.8125rem', color: 'var(--color-primary-light)', textDecoration: 'none', fontWeight: '600' }}>
                  Manage Users →
                </Link>
                <span style={{ color: 'var(--color-border)' }}>|</span>
                <Link to="/admin/sellers" style={{ fontSize: '0.8125rem', color: 'var(--color-primary-light)', textDecoration: 'none', fontWeight: '600' }}>
                  Manage Sellers →
                </Link>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div style={{
                backgroundColor: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem'
              }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>
                  Total Platform Users
                </span>
                <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: '0.35rem 0 0 0' }}>
                  {userMetrics?.totalUsers ?? '—'}
                </p>
              </div>

              <div style={{
                backgroundColor: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem'
              }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>
                  Active Customers
                </span>
                <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-primary)', margin: '0.35rem 0 0 0' }}>
                  {userMetrics?.totalCustomers ?? '—'}
                </p>
              </div>

              <div style={{
                backgroundColor: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem'
              }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>
                  Total Sellers
                </span>
                <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: '0.35rem 0 0 0' }}>
                  {userMetrics?.totalSellers ?? '—'}
                </p>
              </div>

              <div style={{
                backgroundColor: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem'
              }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>
                  Active Sellers
                </span>
                <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-success)', margin: '0.35rem 0 0 0' }}>
                  {userMetrics?.activeSellers ?? '—'}
                </p>
              </div>

              <div style={{
                backgroundColor: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem'
              }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>
                  Suspended Accounts
                </span>
                <p style={{ fontSize: '1.5rem', fontWeight: '800', color: userMetrics?.suspendedUsers > 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)', margin: '0.35rem 0 0 0' }}>
                  {userMetrics?.suspendedUsers ?? '—'}
                </p>
              </div>
            </div>
          </div>

          {/* ── Platform Orders & Operations Overview ── */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ShoppingCart size={20} color="var(--color-primary)" />
                <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
                  Platform Fulfillment & Order Operations
                </h2>
              </div>
              <Link to="/admin/orders" style={{ fontSize: '0.8125rem', color: 'var(--color-primary-light)', textDecoration: 'none', fontWeight: '600' }}>
                View all orders →
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div style={{
                backgroundColor: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem'
              }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>
                  Total Orders
                </span>
                <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: '0.35rem 0 0 0' }}>
                  {orderMetrics?.totalOrders ?? '—'}
                </p>
              </div>

              <div style={{
                backgroundColor: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem'
              }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>
                  Pending Orders
                </span>
                <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-warning)', margin: '0.35rem 0 0 0' }}>
                  {orderMetrics?.pendingOrders ?? '—'}
                </p>
              </div>

              <div style={{
                backgroundColor: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem'
              }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>
                  In Fulfillment
                </span>
                <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-primary)', margin: '0.35rem 0 0 0' }}>
                  {orderMetrics ? (orderMetrics.processingOrders + orderMetrics.shippedOrders) : '—'}
                </p>
              </div>

              <div style={{
                backgroundColor: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem'
              }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>
                  Delivered
                </span>
                <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-success)', margin: '0.35rem 0 0 0' }}>
                  {orderMetrics?.deliveredOrders ?? '—'}
                </p>
              </div>

              <div style={{
                backgroundColor: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem'
              }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>
                  Total Order Value
                </span>
                <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-primary-light)', margin: '0.35rem 0 0 0' }}>
                  {orderMetrics ? formatPrice(orderMetrics.totalOrderValue) : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* ── Recent Submissions ── */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
                Recent Product Submissions
              </h2>
              <Link to={ROUTES.ADMIN_PRODUCTS} style={{ fontSize: '0.8125rem', color: 'var(--color-primary-light)', textDecoration: 'none', fontWeight: '600' }}>
                View all →
              </Link>
            </div>

            {products.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>No products listed yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {products.slice(0, 5).map(p => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-surface-raised)',
                      gap: '1rem',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={p.imageUrl || 'https://placehold.co/40x40/1a1d2e/818cf8?text=P'}
                        alt={p.name}
                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                        onError={e => { e.target.src = 'https://placehold.co/40x40/1a1d2e/818cf8?text=P' }}
                      />
                      <div>
                        <p style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--color-text-primary)', margin: 0 }}>
                          {p.name}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                          Seller: {p.sellerName || 'ID #' + p.sellerId} • {formatPrice(p.price)}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: p.status === 'APPROVED' ? 'rgba(34, 197, 94, 0.12)' : p.status === 'PENDING' ? 'rgba(234, 179, 8, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: p.status === 'APPROVED' ? 'var(--color-success)' : p.status === 'PENDING' ? 'var(--color-warning)' : 'var(--color-danger)',
                        border: `1px solid ${p.status === 'APPROVED' ? 'rgba(34, 197, 94, 0.3)' : p.status === 'PENDING' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                      }}>
                        {p.status}
                      </span>
                      <button
                        className="btn btn-secondary"
                        onClick={() => navigate('/admin/products')}
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default AdminDashboard

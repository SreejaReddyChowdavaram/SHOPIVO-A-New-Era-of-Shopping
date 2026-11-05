/**
 * Dashboard.jsx — Seller Dashboard
 * Route: /seller/dashboard
 * Layout: SellerLayout
 *
 * Shows a real-data overview of the seller's product catalog:
 *  - Summary metric cards (total / approved / pending / rejected)
 *  - Quick-action cards (Add Product, View Orders)
 *  - Product lifecycle guide
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  Plus,
  ShoppingBag,
  CheckCircle2,
  Clock,
  XCircle,
  Boxes,
  ArrowRight,
  AlertCircle,
  RotateCcw,
  Loader2,
  TrendingUp,
  DollarSign,
  BarChart3,
  ChevronRight,
  Star,
} from 'lucide-react'
import { getSellerProducts } from '@/services/productService'
import { getSellerOrders } from '@/services/orderService'
import { getSellerAnalyticsSummary } from '@/services/analyticsService'
import { getSellerReviews } from '@/services/reviewService'
import { ROUTES } from '@/constants/routes'

const Dashboard = () => {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    unitsSold: 0,
    grossSales: 0,
  })
  const [reviewSummary, setReviewSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [productList, orderList, analyticsData, reviewData] = await Promise.all([
        getSellerProducts(),
        getSellerOrders().catch(() => []),
        getSellerAnalyticsSummary('all').catch(() => null),
        getSellerReviews().catch(() => null),
      ])
      setProducts(productList || [])
      setOrders(orderList || [])
      if (analyticsData) {
        setAnalytics(analyticsData)
      }
      if (reviewData) {
        setReviewSummary({
          averageRating: reviewData.averageRating || 0,
          totalReviews: reviewData.totalReviews || 0,
        })
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const metrics = {
    total:    products.length,
    approved: products.filter((p) => p.status === 'APPROVED').length,
    pending:  products.filter((p) => p.status === 'PENDING').length,
    rejected: products.filter((p) => p.status === 'REJECTED').length,
  }

  const lowStock  = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity < 5).length
  const outOfStock = products.filter((p) => p.stockQuantity === 0).length

  const STAT_CARDS = [
    {
      label: 'Total Listings',
      value: metrics.total,
      icon: Boxes,
      iconBg: 'rgba(99, 102, 241, 0.12)',
      iconColor: 'var(--color-primary)',
      valueColor: 'var(--color-text-primary)',
    },
    {
      label: 'Live in Store',
      value: metrics.approved,
      icon: CheckCircle2,
      iconBg: 'rgba(34, 197, 94, 0.12)',
      iconColor: 'var(--color-success)',
      valueColor: 'var(--color-success)',
    },
    {
      label: 'Pending Review',
      value: metrics.pending,
      icon: Clock,
      iconBg: 'rgba(234, 179, 8, 0.12)',
      iconColor: 'var(--color-warning)',
      valueColor: 'var(--color-warning)',
    },
    {
      label: 'Needs Revision',
      value: metrics.rejected,
      icon: XCircle,
      iconBg: 'rgba(239, 68, 68, 0.12)',
      iconColor: 'var(--color-danger)',
      valueColor: 'var(--color-danger)',
    },
  ]

  return (
    <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Page Header ── */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
          Seller Dashboard
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Overview of your listings, review status, and inventory health.
        </p>
      </div>

      {/* ── Loading / Error States ── */}
      {loading ? (
        <div style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          padding: '3rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          color: 'var(--color-text-secondary)',
        }}>
          <Loader2 size={28} className="animate-spin" color="var(--color-primary)" />
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Loading your dashboard...</p>
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
          {/* ── Listings Metric Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {STAT_CARDS.map((card) => {
              const Icon = card.icon
              return (
                <div
                  key={card.label}
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1.25rem',
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

          {/* ── Sales & Revenue Quick Overview ── */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.25rem 1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
                  Sales & Order Performance
                </h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '0.15rem 0 0' }}>
                  Real-time metrics for products sold by your store
                </p>
              </div>
              <Link
                to={ROUTES.SELLER_ANALYTICS}
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  color: 'var(--color-primary)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                View Full Analytics <ChevronRight size={15} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '0.85rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>
                  Gross Sales
                </span>
                <p style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-success)', margin: '0.35rem 0 0' }}>
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(analytics.grossSales || 0)}
                </p>
              </div>

              <div style={{ padding: '0.85rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>
                  Completed Orders
                </span>
                <p style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-primary)', margin: '0.35rem 0 0' }}>
                  {analytics.completedOrders}
                </p>
              </div>

              <div style={{ padding: '0.85rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>
                  Units Sold
                </span>
                <p style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-warning)', margin: '0.35rem 0 0' }}>
                  {analytics.unitsSold}
                </p>
              </div>

              <div style={{ padding: '0.85rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>
                  Total Orders
                </span>
                <p style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: '0.35rem 0 0' }}>
                  {analytics.totalOrders}
                </p>
              </div>

              <Link
                to={ROUTES.SELLER_REVIEWS}
                style={{
                  textDecoration: 'none',
                  padding: '0.85rem',
                  backgroundColor: 'var(--color-bg)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-warning)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: '600', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Star size={13} fill="#f59e0b" color="#f59e0b" /> Store Rating
                  </span>
                  <ChevronRight size={14} color="var(--color-text-disabled)" />
                </div>
                <div style={{ margin: '0.35rem 0 0' }}>
                  <p style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {reviewSummary.totalReviews > 0 ? (
                      <>
                        <span>{reviewSummary.averageRating}</span>
                        <span style={{ fontSize: '0.85rem', color: '#f59e0b' }}>★</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>/ 5.0</span>
                      </>
                    ) : (
                      <span style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', fontWeight: '600' }}>No ratings yet</span>
                    )}
                  </p>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                    {reviewSummary.totalReviews} verified {reviewSummary.totalReviews === 1 ? 'review' : 'reviews'}
                  </span>
                </div>
              </Link>
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* Add Product */}
            <Link
              to={ROUTES.SELLER_ADD_PRODUCT}
              style={{ textDecoration: 'none' }}
            >
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
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.12)'
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
                    backgroundColor: 'rgba(99, 102, 241, 0.12)',
                    color: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Plus size={22} />
                  </div>
                  <div>
                    <p style={{ fontWeight: '700', color: 'var(--color-text-primary)', margin: 0, fontSize: '0.9375rem' }}>
                      Add New Product
                    </p>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.8rem', marginTop: '0.15rem' }}>
                      Create a product listing for review
                    </p>
                  </div>
                </div>
                <ArrowRight size={18} color="var(--color-text-disabled)" />
              </div>
            </Link>

            {/* My Products */}
            <Link
              to={ROUTES.SELLER_PRODUCTS}
              style={{ textDecoration: 'none' }}
            >
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
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.12)'
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
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    color: 'var(--color-success)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Package size={22} />
                  </div>
                  <div>
                    <p style={{ fontWeight: '700', color: 'var(--color-text-primary)', margin: 0, fontSize: '0.9375rem' }}>
                      Manage Products
                    </p>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.8rem', marginTop: '0.15rem' }}>
                      View, edit, and filter your catalog
                    </p>
                  </div>
                </div>
                <ArrowRight size={18} color="var(--color-text-disabled)" />
              </div>
            </Link>

            {/* Inventory */}
            <Link
              to={ROUTES.SELLER_INVENTORY}
              style={{ textDecoration: 'none' }}
            >
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
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.12)'
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
                    backgroundColor: 'rgba(234, 179, 8, 0.1)',
                    color: 'var(--color-warning)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <TrendingUp size={22} />
                  </div>
                  <div>
                    <p style={{ fontWeight: '700', color: 'var(--color-text-primary)', margin: 0, fontSize: '0.9375rem' }}>
                      Stock Management
                    </p>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.8rem', marginTop: '0.15rem' }}>
                      {outOfStock > 0
                        ? `${outOfStock} item${outOfStock !== 1 ? 's' : ''} out of stock`
                        : lowStock > 0
                        ? `${lowStock} item${lowStock !== 1 ? 's' : ''} running low`
                        : 'All stock levels healthy'}
                    </p>
                  </div>
                </div>
                <ArrowRight size={18} color="var(--color-text-disabled)" />
              </div>
            </Link>

            {/* Orders */}
            <Link
              to={ROUTES.SELLER_ORDERS}
              style={{ textDecoration: 'none' }}
            >
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
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.12)'
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
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    color: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <ShoppingBag size={22} />
                  </div>
                  <div>
                    <p style={{ fontWeight: '700', color: 'var(--color-text-primary)', margin: 0, fontSize: '0.9375rem' }}>
                      View Orders
                    </p>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.8rem', marginTop: '0.15rem' }}>
                      {orders.length > 0
                        ? `${orders.length} order${orders.length !== 1 ? 's' : ''}${orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED' || o.status === 'PROCESSING').length > 0 ? ` (${orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED' || o.status === 'PROCESSING').length} pending)` : ''}`
                        : 'Track and manage customer orders'}
                    </p>
                  </div>
                </div>
                <ArrowRight size={18} color="var(--color-text-disabled)" />
              </div>
            </Link>

            {/* Customer Reviews */}
            <Link
              to={ROUTES.SELLER_REVIEWS}
              style={{ textDecoration: 'none' }}
            >
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
                  e.currentTarget.style.borderColor = '#f59e0b'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(245,158,11,0.12)'
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
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    color: '#f59e0b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Star size={22} fill="#f59e0b" color="#f59e0b" />
                  </div>
                  <div>
                    <p style={{ fontWeight: '700', color: 'var(--color-text-primary)', margin: 0, fontSize: '0.9375rem' }}>
                      Customer Reviews
                    </p>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.8rem', marginTop: '0.15rem' }}>
                      {reviewSummary.totalReviews > 0
                        ? `${reviewSummary.averageRating} ★ average across ${reviewSummary.totalReviews} review${reviewSummary.totalReviews !== 1 ? 's' : ''}`
                        : 'Inspect buyer ratings & verified reviews'}
                    </p>
                  </div>
                </div>
                <ArrowRight size={18} color="var(--color-text-disabled)" />
              </div>
            </Link>
          </div>

          {/* ── Stock Alerts ── */}
          {(outOfStock > 0 || lowStock > 0) && (
            <div style={{
              backgroundColor: outOfStock > 0 ? 'rgba(239, 68, 68, 0.06)' : 'rgba(234, 179, 8, 0.07)',
              border: `1px solid ${outOfStock > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.3)'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.875rem',
              fontSize: '0.8375rem',
            }}>
              <AlertCircle size={18} color={outOfStock > 0 ? 'var(--color-danger)' : 'var(--color-warning)'} style={{ flexShrink: 0 }} />
              <span style={{ color: 'var(--color-text-primary)' }}>
                <strong style={{ color: outOfStock > 0 ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                  {outOfStock > 0 ? 'Stock Alert:' : 'Low Stock Warning:'}
                </strong>{' '}
                {outOfStock > 0
                  ? `${outOfStock} product${outOfStock !== 1 ? 's are' : ' is'} out of stock and hidden from buyers.`
                  : `${lowStock} product${lowStock !== 1 ? 's are' : ' is'} running low (fewer than 5 units).`}
                {' '}
                <Link to={ROUTES.SELLER_INVENTORY} style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
                  Update stock →
                </Link>
              </span>
            </div>
          )}

        </>
      )}
    </div>
  )
}

export default Dashboard

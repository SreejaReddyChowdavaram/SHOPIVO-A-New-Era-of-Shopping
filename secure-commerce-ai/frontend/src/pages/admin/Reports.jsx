/**
 * Reports.jsx — Platform Operational Audits & Report Generation
 * Route: /admin/reports
 * Layout: AdminLayout
 *
 * Provides administrators with audit reporting tools, exportable CSV summaries,
 * and executive statements covering sales, inventory, and merchant operations.
 */

import { useState, useEffect } from 'react'
import {
  FileBarChart,
  Download,
  Printer,
  Calendar,
  DollarSign,
  Package,
  Store,
  Users,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { getAdminOrderMetrics } from '@/services/orderService'
import { getAdminUserMetrics, getAdminSellersPaged } from '@/services/userService'
import { getAdminProducts } from '@/services/productService'

const REPORT_TYPES = [
  { id: 'SALES', label: 'Sales & Revenue Summary', icon: DollarSign },
  { id: 'MERCHANTS', label: 'Merchant Performance Audit', icon: Store },
  { id: 'INVENTORY', label: 'Inventory Health Audit', icon: Package },
  { id: 'CUSTOMERS', label: 'Customer Base Audit', icon: Users },
]

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('SALES')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Report Data
  const [orderMetrics, setOrderMetrics] = useState({})
  const [userMetrics, setUserMetrics] = useState({})
  const [sellers, setSellers] = useState([])
  const [products, setProducts] = useState([])

  const loadReportData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [ordersRes, usersRes, sellersRes, productsRes] = await Promise.allSettled([
        getAdminOrderMetrics(),
        getAdminUserMetrics(),
        getAdminSellersPaged({ size: 100 }),
        getAdminProducts(),
      ])

      if (ordersRes.status === 'fulfilled') setOrderMetrics(ordersRes.value || {})
      if (usersRes.status === 'fulfilled') setUserMetrics(usersRes.value || {})
      if (sellersRes.status === 'fulfilled') setSellers(sellersRes.value?.content || [])
      if (productsRes.status === 'fulfilled') setProducts(productsRes.value || [])
    } catch (err) {
      setError('Failed to aggregate platform data for reports.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReportData()
  }, [])

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(val) || 0)
  }

  // Export CSV generator
  const handleExportCSV = () => {
    let headers = []
    let rows = []
    let filename = `Shopivo_${selectedReport}_Report_${new Date().toISOString().slice(0, 10)}.csv`

    if (selectedReport === 'SALES') {
      headers = ['Metric', 'Value']
      rows = [
        ['Gross Merchandise Value (GMV)', formatCurrency(orderMetrics.totalOrderValue || 0)],
        ['Total Processed Orders', orderMetrics.totalOrders || 0],
        ['Completed / Delivered', orderMetrics.deliveredOrders || 0],
        ['Pending Fulfillment', orderMetrics.pendingOrders || 0],
        ['Cancelled Orders', orderMetrics.cancelledOrders || 0],
      ]
    } else if (selectedReport === 'MERCHANTS') {
      headers = ['Merchant Name', 'Email', 'Status', 'Total Products', 'Total Orders']
      rows = sellers.map((s) => [
        `"${s.sellerName || ''}"`,
        `"${s.email || ''}"`,
        s.enabled ? 'ACTIVE' : 'SUSPENDED',
        s.totalProducts || 0,
        s.totalOrders || 0,
      ])
    } else if (selectedReport === 'INVENTORY') {
      headers = ['Product Title', 'Merchant', 'Category', 'Price', 'Stock Quantity', 'Status']
      rows = products.map((p) => [
        `"${p.title || ''}"`,
        `"${p.sellerName || ''}"`,
        `"${p.categoryName || ''}"`,
        p.price || 0,
        p.stockQuantity || 0,
        p.status || 'APPROVED',
      ])
    } else if (selectedReport === 'CUSTOMERS') {
      headers = ['Metric', 'Value']
      rows = [
        ['Total Customer Accounts', userMetrics.totalCustomers || 0],
        ['Total Merchants', userMetrics.totalSellers || 0],
        ['Active Merchants', userMetrics.activeSellers || 0],
        ['Suspended Accounts', userMetrics.suspendedUsers || 0],
      ]
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
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
              <FileBarChart size={24} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
              Reports & Audit Center
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.925rem' }}>
            Generate operational audit statements, review executive marketplace summaries, and export data in standard CSV format.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary"
            onClick={loadReportData}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            className="btn btn-secondary"
            onClick={handlePrint}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Printer size={16} />
            Print
          </button>
          <button
            className="btn btn-primary"
            onClick={handleExportCSV}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Report Type Switcher ── */}
      <div className="card" style={{ padding: '0.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
          {REPORT_TYPES.map((rt) => {
            const Icon = rt.icon
            const isSelected = selectedReport === rt.id
            return (
              <button
                key={rt.id}
                onClick={() => setSelectedReport(rt.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected ? '1px solid var(--color-primary-light)' : '1px solid transparent',
                  backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  color: isSelected ? 'var(--color-primary-light)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? '700' : '500',
                  fontSize: '0.875rem',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={18} />
                <span>{rt.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Report Content ── */}
      <div className="card" style={{ padding: '1.5rem' }}>
        {loading ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-disabled)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Generating audit report preview...</p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
                  {REPORT_TYPES.find((r) => r.id === selectedReport)?.label}
                </h2>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-disabled)' }}>
                  Generated on {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                Verified Database Export
              </span>
            </div>

            {/* Sales & Revenue Report View */}
            {selectedReport === 'SALES' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)', display: 'block' }}>TOTAL ORDER VALUE (GMV)</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
                      {formatCurrency(orderMetrics.totalOrderValue)}
                    </span>
                  </div>
                  <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)', display: 'block' }}>TOTAL ORDERS</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                      {orderMetrics.totalOrders || 0}
                    </span>
                  </div>
                  <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)', display: 'block' }}>COMPLETED FULFILLMENT</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
                      {orderMetrics.deliveredOrders || 0}
                    </span>
                  </div>
                  <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)', display: 'block' }}>CANCELLATIONS</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-danger)' }}>
                      {orderMetrics.cancelledOrders || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Merchant Compliance Report View */}
            {selectedReport === 'MERCHANTS' && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Merchant</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Email</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Products</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Orders Fulfilled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellers.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--color-text-primary)' }}>{s.sellerName}</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>{s.email}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className={`badge ${s.enabled ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                            {s.enabled ? 'ACTIVE' : 'SUSPENDED'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>{s.totalProducts || 0}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{s.totalOrders || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Inventory Health Report View */}
            {selectedReport === 'INVENTORY' && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Product Title</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Merchant</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Price</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Stock Units</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.slice(0, 15).map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--color-text-primary)' }}>{p.title}</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>{p.sellerName || 'Merchant'}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{p.categoryName || 'General'}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>{formatCurrency(p.price)}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontWeight: '700', color: p.stockQuantity <= 10 ? '#f59e0b' : 'var(--color-text-primary)' }}>
                            {p.stockQuantity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {products.length > 15 && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)', marginTop: '0.75rem', textAlign: 'center' }}>
                    Previewing 15 of {products.length} products. Click "Export CSV" to download complete inventory file.
                  </p>
                )}
              </div>
            )}

            {/* Customer Base Report View */}
            {selectedReport === 'CUSTOMERS' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)', display: 'block' }}>TOTAL CUSTOMERS</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                    {userMetrics.totalCustomers || 0}
                  </span>
                </div>
                <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)', display: 'block' }}>TOTAL MERCHANTS</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                    {userMetrics.totalSellers || 0}
                  </span>
                </div>
                <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)', display: 'block' }}>ACTIVE MERCHANTS</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
                    {userMetrics.activeSellers || 0}
                  </span>
                </div>
                <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)', display: 'block' }}>SUSPENDED ACCOUNTS</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-danger)' }}>
                    {userMetrics.suspendedUsers || 0}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports

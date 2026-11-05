/**
 * SellerLayout.jsx — Shell for all seller dashboard pages
 *
 * STRUCTURE:
 *   Sticky Navbar (logo + notifications + profile)
 *   └── Sidebar (260px, seller nav links)
 *   └── <Outlet /> (page content, scrollable)
 *
 * VISUAL IDENTITY:
 *   Same design tokens as customer but with the sidebar-based layout
 *   that signals "you are managing, not shopping".
 *   The sidebar uses the generic Sidebar component with seller-specific links.
 */

import { Outlet, Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck, Bell, ChevronDown, LogOut,
  LayoutDashboard, Package, Archive, ShoppingBag,
  DollarSign, Star, User, PlusSquare, TrendingUp, BarChart3,
} from 'lucide-react'
import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { selectCurrentUser, logout } from '@/store/authSlice'
import { ROUTES } from '@/constants/routes'
import Navbar from '@/components/common/Navbar'
import Sidebar from '@/components/common/Sidebar'
import BrandLogo from '@/components/common/BrandLogo'
import ThemeToggle from '@/components/common/ThemeToggle'

// ─── Seller Sidebar Navigation ───────────────────────────────
const SELLER_NAV = [
  { label: 'Dashboard',   icon: LayoutDashboard, path: ROUTES.SELLER_DASHBOARD },
  { label: 'My Products', icon: Package,         path: ROUTES.SELLER_PRODUCTS },
  { label: 'Add Product', icon: PlusSquare,      path: ROUTES.SELLER_ADD_PRODUCT },
  { label: 'Inventory',   icon: Archive,         path: ROUTES.SELLER_INVENTORY },
  { label: 'Orders',      icon: ShoppingBag,     path: ROUTES.SELLER_ORDERS },
  { label: 'Analytics',   icon: BarChart3,       path: ROUTES.SELLER_ANALYTICS },
  { label: 'Reviews',     icon: Star,            path: ROUTES.SELLER_REVIEWS },
]

// ─── Logo ─────────────────────────────────────────────────────
const Logo = () => (
  <BrandLogo
    size="md"
    subtitle="Seller Portal"
    to={ROUTES.SELLER_DASHBOARD}
    ariaLabel="Shopivo Seller Dashboard"
  />
)

// ─── Right Actions ────────────────────────────────────────────
const SellerActions = ({ user, onLogout }) => {
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <ThemeToggle />

      <button className="btn btn-secondary" style={{ padding: '0.5rem', width: '38px', height: '38px', position: 'relative' }}
        title="Notifications" onClick={() => navigate(ROUTES.SELLER_NOTIFICATIONS)}>
        <Bell size={18} />
        <span style={{
          position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px',
          borderRadius: '50%', background: 'var(--color-warning)', border: '2px solid var(--color-surface)',
        }} />
      </button>

      <div style={{ position: 'relative' }}>
        <button className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', gap: '0.5rem' }}
          onClick={() => setProfileOpen(!profileOpen)}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #8b5cf6, var(--color-primary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', fontWeight: '700', color: '#fff',
          }}>
            {user?.name?.charAt(0).toUpperCase() || 'S'}
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{user?.name || 'Seller'}</span>
          <ChevronDown size={14} />
        </button>

        {profileOpen && (
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 0.5rem)',
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
            minWidth: '180px', zIndex: 200, overflow: 'hidden',
          }}>
            <button onClick={() => { navigate(ROUTES.SELLER_PROFILE); setProfileOpen(false) }}
              style={{ width: '100%', padding: '0.625rem 1rem', textAlign: 'left', background: 'none', border: 'none', color: 'var(--color-text-primary)', fontSize: '0.875rem', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-raised)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              My Profile
            </button>
            <div className="divider" style={{ margin: 0 }} />
            <button onClick={() => { onLogout(); setProfileOpen(false) }}
              style={{ width: '100%', padding: '0.625rem 1rem', textAlign: 'left', background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Layout ──────────────────────────────────────────────
const SellerLayout = () => {
  const user = useSelector(selectCurrentUser)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(logout())
    navigate(ROUTES.LOGIN)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
      <Navbar
        logo={<Logo />}
        actions={<SellerActions user={user} onLogout={handleLogout} />}
      />

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar navItems={SELLER_NAV} />

        <main className="fade-in" style={{ flex: 1, padding: '2rem', overflowY: 'auto', minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default SellerLayout

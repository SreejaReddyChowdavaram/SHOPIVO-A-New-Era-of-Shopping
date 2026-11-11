/**
 * AdminLayout.jsx — Shell for all admin dashboard pages
 *
 * STRUCTURE:
 *   Sticky Navbar (logo + notifications + profile)
 *   └── Sidebar (280px, grouped nav links)
 *   └── <Outlet /> (page content)
 *
 * SIDEBAR GROUPS:
 *   Overview     → Dashboard, Analytics, Reports
 *   Users        → All Users, Customers, Sellers, Seller Verification
 *   Catalog      → Products, Orders, Payments, Inventory, Reviews
 *
 * VISUAL IDENTITY:
 *   Red/rose accent for the admin avatar — signals elevated authority.
 *   The sidebar is wider (280px) to accommodate grouped labels.
 */

import { Outlet, Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck, Bell, ChevronDown, LogOut,
  LayoutDashboard, Users, UserCheck, Store,
  Package, ShoppingBag, CreditCard, Archive,
  Star, FileBarChart, BarChart2,
  User, Boxes,
} from 'lucide-react'
import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { selectCurrentUser, logout } from '@/store/authSlice'
import { ROUTES } from '@/constants/routes'
import Navbar from '@/components/common/Navbar'
import Sidebar from '@/components/common/Sidebar'
import BrandLogo from '@/components/common/BrandLogo'
import ThemeToggle from '@/components/common/ThemeToggle'

// ─── Admin Sidebar Navigation (Grouped) ───────────────────────
const ADMIN_NAV = [
  {
    group: 'Overview',
    items: [
      { label: 'Dashboard',  icon: LayoutDashboard, path: ROUTES.ADMIN_DASHBOARD },
      { label: 'Analytics',  icon: BarChart2,       path: ROUTES.ADMIN_ANALYTICS },
      { label: 'Reports',    icon: FileBarChart,    path: ROUTES.ADMIN_REPORTS },
    ],
  },
  {
    group: 'Users',
    items: [
      { label: 'All Users',     icon: Users,       path: ROUTES.ADMIN_USERS },
      { label: 'Customers',     icon: User,        path: ROUTES.ADMIN_CUSTOMERS },
      { label: 'Sellers',       icon: Store,       path: ROUTES.ADMIN_SELLERS },
      { label: 'Verification',  icon: UserCheck,   path: ROUTES.ADMIN_SELLER_VERIFICATION },
      { label: 'Login History', icon: ShieldCheck, path: ROUTES.ADMIN_LOGIN_HISTORY },
    ],
  },
  {
    group: 'Catalog & Commerce',
    items: [
      { label: 'Products',   icon: Package,    path: ROUTES.ADMIN_PRODUCTS },
      { label: 'Orders',     icon: ShoppingBag, path: ROUTES.ADMIN_ORDERS },
      { label: 'Payments',   icon: CreditCard, path: ROUTES.ADMIN_PAYMENTS },
      { label: 'Inventory',  icon: Boxes,      path: ROUTES.ADMIN_INVENTORY },
      { label: 'Reviews',    icon: Star,       path: ROUTES.ADMIN_REVIEWS },
    ],
  },
]

// ─── Logo ─────────────────────────────────────────────────────
const Logo = () => (
  <BrandLogo
    size="md"
    subtitle="Admin Console"
    subtitleStyle={{ color: 'var(--color-danger)' }}
    to={ROUTES.ADMIN_DASHBOARD}
    ariaLabel="Shopivo Admin Dashboard"
  />
)

// ─── Right Actions ────────────────────────────────────────────
const AdminActions = ({ user, onLogout }) => {
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <ThemeToggle />

      {/* Admin role badge */}
      <div className="badge badge-danger" style={{ fontSize: '0.7rem', cursor: 'default' }}>
        ADMIN
      </div>

      <button className="btn btn-secondary"
        style={{ padding: '0.5rem', width: '38px', height: '38px', position: 'relative' }}
        title="Notifications" onClick={() => navigate(ROUTES.ADMIN_NOTIFICATIONS)}>
        <Bell size={18} />
        <span style={{
          position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px',
          borderRadius: '50%', background: 'var(--color-danger)', border: '2px solid var(--color-surface)',
        }} />
      </button>

      <div style={{ position: 'relative' }}>
        <button className="btn btn-secondary"
          style={{ padding: '0.375rem 0.75rem', gap: '0.5rem' }}
          onClick={() => setProfileOpen(!profileOpen)}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #ef4444, #f97316)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', fontWeight: '700', color: '#fff',
          }}>
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{user?.name || 'Admin'}</span>
          <ChevronDown size={14} />
        </button>

        {profileOpen && (
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 0.5rem)',
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
            minWidth: '180px', zIndex: 200, overflow: 'hidden',
          }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                {user?.name}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>
                {user?.email}
              </p>
            </div>
            <button onClick={() => { navigate(ROUTES.ADMIN_PROFILE); setProfileOpen(false) }}
              style={{
                width: '100%', padding: '0.625rem 1rem', textAlign: 'left',
                background: 'none', border: 'none', color: 'var(--color-text-primary)',
                fontSize: '0.875rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-raised)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <User size={14} /> My Profile
            </button>
            <div className="divider" style={{ margin: 0 }} />
            <button onClick={() => { onLogout(); setProfileOpen(false) }}
              style={{
                width: '100%', padding: '0.625rem 1rem', textAlign: 'left',
                background: 'none', border: 'none', color: 'var(--color-danger)',
                fontSize: '0.875rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}
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
const AdminLayout = () => {
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
        actions={<AdminActions user={user} onLogout={handleLogout} />}
      />

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar navItems={ADMIN_NAV} width={280} />

        <main className="fade-in" style={{
          flex: 1, padding: '2rem', overflowY: 'auto',
          minHeight: 'calc(100vh - 64px)',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout

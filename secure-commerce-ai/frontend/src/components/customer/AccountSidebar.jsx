/**
 * AccountSidebar.jsx — Minimal Fixed Customer Sidebar
 * Pinned on desktop under the top navbar (top: 64px, height: calc(100vh - 64px)).
 * Continuous navigation list without section headings or user profile block.
 */

import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { LogOut } from 'lucide-react'
import { logout } from '@/store/authSlice'
import { CUSTOMER_NAV_ITEMS } from './AccountNavigation'
import { ROUTES } from '@/constants/routes'
import { isNavItemActive } from '@/utils/navigation'

const allCustomerPaths = CUSTOMER_NAV_ITEMS.map((i) => i.path)

const AccountSidebar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    dispatch(logout())
    navigate(ROUTES.LOGIN)
  }

  return (
    <aside
      className="customer-global-sidebar"
      style={{
        position: 'fixed',
        top: 'var(--header-height, 64px)',
        left: 0,
        width: 'var(--sidebar-width, 250px)',
        height: 'calc(100vh - var(--header-height, 64px))',
        backgroundColor: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        zIndex: 50,
        transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
      }}
    >
      {/* ── Continuous Navigation List ── */}
      <nav style={{ padding: '0.75rem 0', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {CUSTOMER_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = isNavItemActive(item.path, location.pathname, allCustomerPaths)

          return (
            <NavLink
              key={item.label}
              to={item.path}
              end
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.7rem 1.25rem',
                minHeight: '44px',
                fontSize: '0.84rem',
                fontWeight: isActive ? '700' : '500',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-primary)',
                backgroundColor: isActive ? 'var(--color-primary-subtle)' : 'transparent',
                borderLeft: `3px solid ${isActive ? 'var(--color-primary)' : 'transparent'}`,
                textDecoration: 'none',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <Icon size={17} color={isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)'} />
              <span style={{ flex: 1 }}>{item.label}</span>
            </NavLink>
          )
        })}

        <div style={{ margin: 'auto 0 0.5rem', borderTop: '1px solid var(--color-border)' }} />

        {/* ── Logout Section ── */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1.25rem',
            minHeight: '44px',
            fontSize: '0.84rem',
            fontWeight: '600',
            color: 'var(--color-danger)',
            backgroundColor: 'transparent',
            border: 'none',
            borderLeft: '3px solid transparent',
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-danger-subtle)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <LogOut size={17} color="var(--color-danger)" />
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  )
}

export default AccountSidebar

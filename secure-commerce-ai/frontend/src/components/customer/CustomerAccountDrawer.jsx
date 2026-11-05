/**
 * CustomerAccountDrawer.jsx — Minimal Mobile/Tablet Navigation Drawer
 * Continuous navigation list matching the desktop sidebar.
 */

import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { X, LogOut, Shield } from 'lucide-react'
import { logout } from '@/store/authSlice'
import { CUSTOMER_NAV_ITEMS } from './AccountNavigation'
import { ROUTES } from '@/constants/routes'
import { isNavItemActive } from '@/utils/navigation'
import BrandLogo from '@/components/common/BrandLogo'

const allCustomerPaths = CUSTOMER_NAV_ITEMS.map((i) => i.path)

const CustomerAccountDrawer = ({ isOpen, onClose }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  if (!isOpen) return null

  const handleLogout = () => {
    dispatch(logout())
    onClose()
    navigate(ROUTES.LOGIN)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
      }}
      onClick={onClose}
    >
      <div
        className="fade-in"
        style={{
          width: '270px',
          maxWidth: '85%',
          height: '100%',
          backgroundColor: 'var(--color-surface)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          overflowY: 'auto',
          transition: 'background-color var(--transition-normal)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.15rem 1.25rem',
            backgroundColor: 'var(--color-surface-raised)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <BrandLogo size="sm" to={ROUTES.HOME} />

          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '0.35rem' }}
          >
            <X size={19} />
          </button>
        </div>

        {/* Nav List */}
        <nav style={{ padding: '0.75rem 0', display: 'flex', flexDirection: 'column', flex: 1 }}>
          {CUSTOMER_NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = isNavItemActive(item.path, location.pathname, allCustomerPaths)

            return (
              <NavLink
                key={item.label}
                to={item.path}
                end
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1.25rem',
                  minHeight: '44px',
                  fontSize: '0.86rem',
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  backgroundColor: isActive ? 'var(--color-primary-subtle)' : 'transparent',
                  borderLeft: `3px solid ${isActive ? 'var(--color-primary)' : 'transparent'}`,
                  textDecoration: 'none',
                  transition: 'background-color var(--transition-fast)',
                }}
              >
                <Icon size={18} color={isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)'} />
                <span style={{ flex: 1 }}>{item.label}</span>
              </NavLink>
            )
          })}

          <div style={{ margin: 'auto 0 0.5rem', borderTop: '1px solid var(--color-border)' }} />

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1.25rem',
              minHeight: '44px',
              fontSize: '0.86rem',
              fontWeight: '600',
              color: 'var(--color-danger)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'background-color var(--transition-fast)',
            }}
          >
            <LogOut size={18} color="var(--color-danger)" />
            <span>Logout</span>
          </button>
        </nav>
      </div>
    </div>
  )
}

export default CustomerAccountDrawer

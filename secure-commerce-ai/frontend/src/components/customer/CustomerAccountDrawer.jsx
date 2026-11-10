/**
 * CustomerAccountDrawer.jsx — Premium Mobile & Tablet Navigation Drawer
 * Smooth off-canvas navigation with grouped customer routes, active indicators,
 * backdrop lock, keyboard Escape handling, and touch-optimized controls (>= 44px).
 */

import { useEffect, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  X,
  LogOut,
  ShieldCheck,
  ShoppingCart,
  Heart,
  Bell,
  User,
  ChevronRight,
} from 'lucide-react'
import { selectCurrentUser, logout } from '@/store/authSlice'
import { selectCartItemCount } from '@/store/cartSlice'
import { CUSTOMER_NAV_SECTIONS, CUSTOMER_NAV_ITEMS } from './AccountNavigation'
import { ROUTES } from '@/constants/routes'
import { isNavItemActive } from '@/utils/navigation'
import BrandLogo from '@/components/common/BrandLogo'
import ThemeToggle from '@/components/common/ThemeToggle'

const allCustomerPaths = CUSTOMER_NAV_ITEMS.map((i) => i.path)

const CustomerAccountDrawer = ({ isOpen, onClose, unreadNotifications = 0 }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useSelector(selectCurrentUser)
  const cartCount = useSelector(selectCartItemCount) || 0
  const drawerRef = useRef(null)

  // ── 1. Prevent background page scrolling while drawer is active ──
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  // ── 2. Keyboard Accessibility: Close on Escape key ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleLogout = () => {
    dispatch(logout())
    onClose()
    navigate(ROUTES.LOGIN)
  }

  const userInitial = (user?.firstName?.[0] || user?.email?.[0] || 'C').toUpperCase()
  const fullName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Valued Customer'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Customer Navigation Drawer"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(11, 16, 14, 0.7)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        ref={drawerRef}
        style={{
          width: '300px',
          maxWidth: '86vw',
          height: '100%',
          backgroundColor: 'var(--color-surface)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          overflowY: 'auto',
          animation: 'slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          transition: 'background-color var(--transition-normal)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: '0.85rem 1rem',
            backgroundColor: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <BrandLogo size="sm" to={ROUTES.CUSTOMER_DASHBOARD} />

          <button
            onClick={onClose}
            aria-label="Close navigation drawer"
            style={{
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              transition: 'background-color var(--transition-fast), color var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'
              e.currentTarget.style.color = 'var(--color-text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--color-text-secondary)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── User Profile Banner ── */}
        <div
          style={{
            padding: '1rem 1.15rem',
            backgroundColor: 'var(--color-surface-raised)',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: '700',
                color: 'var(--color-primary-contrast, #050505)',
                boxShadow: '0 2px 6px rgba(4, 219, 126, 0.35)',
                flexShrink: 0,
              }}
            >
              {userInitial}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  color: 'var(--color-text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {fullName}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginTop: '1px',
                }}
              >
                {user?.email || 'customer@shopivo.com'}
              </div>
            </div>
          </div>

          {/* Quick shortcuts row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              marginTop: '0.85rem',
            }}
          >
            <button
              onClick={() => {
                navigate(ROUTES.CUSTOMER_CART)
                onClose()
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem 0.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
                fontSize: '0.725rem',
                fontWeight: '600',
                gap: '0.25rem',
                position: 'relative',
              }}
            >
              <ShoppingCart size={16} color="var(--color-primary)" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-primary-contrast, #050505)',
                    fontSize: '0.625rem',
                    fontWeight: '800',
                    borderRadius: 'var(--radius-full)',
                    padding: '0 4px',
                    minWidth: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                navigate(ROUTES.CUSTOMER_WISHLIST)
                onClose()
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem 0.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
                fontSize: '0.725rem',
                fontWeight: '600',
                gap: '0.25rem',
              }}
            >
              <Heart size={16} color="var(--color-deal)" />
              <span>Wishlist</span>
            </button>

            <button
              onClick={() => {
                navigate(ROUTES.CUSTOMER_NOTIFICATIONS)
                onClose()
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem 0.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
                fontSize: '0.725rem',
                fontWeight: '600',
                gap: '0.25rem',
                position: 'relative',
              }}
            >
              <Bell size={16} color="var(--color-text-secondary)" />
              <span>Alerts</span>
              {unreadNotifications > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-primary-contrast, #050505)',
                    fontSize: '0.625rem',
                    fontWeight: '800',
                    borderRadius: 'var(--radius-full)',
                    padding: '0 4px',
                    minWidth: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Sectioned Navigation Links ── */}
        <nav style={{ padding: '0.85rem 0.75rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '1.15rem' }}>
          {CUSTOMER_NAV_SECTIONS.map((section) => (
            <div key={section.title} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--color-text-muted)',
                }}
              >
                {section.title}
              </div>

              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = isNavItemActive(item.path, location.pathname, allCustomerPaths)
                
                let badgeCount = 0
                if (item.badgeKey === 'cart') badgeCount = cartCount
                if (item.badgeKey === 'notifications') badgeCount = unreadNotifications

                return (
                  <NavLink
                    key={item.label}
                    to={item.path}
                    end={item.path === ROUTES.CUSTOMER_DASHBOARD}
                    onClick={onClose}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: '0.7rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      minHeight: '44px',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? '700' : '500',
                      color: isActive ? 'var(--color-nav-active-text, var(--color-primary))' : 'var(--color-text-primary)',
                      backgroundColor: isActive ? 'var(--color-nav-active-bg, var(--color-primary-subtle))' : 'transparent',
                      borderLeft: `3px solid ${isActive ? 'var(--color-nav-active-border, var(--color-primary))' : 'transparent'}`,
                      textDecoration: 'none',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2.25 : 1.75}
                      color={isActive ? 'var(--color-nav-active-text, var(--color-primary))' : 'var(--color-text-secondary)'}
                      style={{ flexShrink: 0 }}
                    />
                    <span style={{ flex: 1 }}>{item.label}</span>

                    {badgeCount > 0 && (
                      <span
                        style={{
                          backgroundColor: 'var(--color-primary)',
                          color: 'var(--color-primary-contrast, #172117)',
                          fontSize: '0.65rem',
                          fontWeight: '800',
                          borderRadius: 'var(--radius-full)',
                          padding: '0.1rem 0.45rem',
                          minWidth: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1,
                        }}
                      >
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        {/* ── Drawer Footer ── */}
        <div
          style={{
            marginTop: 'auto',
            padding: '1rem',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 0.75rem',
              backgroundColor: 'var(--color-surface-raised)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-primary)' }}>
              Appearance
            </span>
            <ThemeToggle />
          </div>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              minHeight: '44px',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'var(--color-danger)',
              backgroundColor: 'var(--color-danger-subtle)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              cursor: 'pointer',
              width: '100%',
              transition: 'background-color var(--transition-fast)',
            }}
          >
            <LogOut size={17} color="var(--color-danger)" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default CustomerAccountDrawer

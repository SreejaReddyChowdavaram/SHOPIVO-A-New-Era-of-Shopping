/**
 * AccountSidebar.jsx — Desktop Customer Sidebar Navigation Area
 * Pinned below top navbar (position: fixed; top: var(--customer-header-height); height: calc(100vh - var(--customer-header-height))).
 * Supports Expanded (250px) and Collapsed (68px) states.
 * Brand header and toggle button are permanently located in the fixed brand row above.
 * Displays only grouped navigation links, icons, and badge counters with clean independent scroll.
 * Customer identity and Sign Out are located in the top navbar.
 */

import { NavLink, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectCartItemCount } from '@/store/cartSlice'
import { CUSTOMER_NAV_SECTIONS, CUSTOMER_NAV_ITEMS } from './AccountNavigation'
import { ROUTES } from '@/constants/routes'
import { isNavItemActive } from '@/utils/navigation'

const allCustomerPaths = CUSTOMER_NAV_ITEMS.map((i) => i.path)

const AccountSidebar = ({ unreadNotifications = 0, isCollapsed = false }) => {
  const location = useLocation()
  const cartCount = useSelector(selectCartItemCount) || 0

  return (
    <aside
      className={`customer-global-sidebar ${isCollapsed ? 'is-collapsed' : ''}`}
      aria-label="Customer account navigation"
    >
      {/* ── Sectioned Navigation Links with Independent Internal Scroll ── */}
      <nav
        className="customer-sidebar-nav"
        style={{
          padding: isCollapsed ? '0.75rem 0.35rem 2rem' : '0.75rem 0.65rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: isCollapsed ? '0.35rem' : '1rem',
        }}
      >
        {CUSTOMER_NAV_SECTIONS.map((section, idx) => (
          <div key={section.title} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {/* Section Header or Divider */}
            {isCollapsed ? (
              idx > 0 && (
                <div
                  style={{
                    height: '1px',
                    backgroundColor: 'var(--color-sidebar-border, var(--color-border-subtle))',
                    margin: '0.45rem 0.5rem',
                    opacity: 0.6,
                  }}
                  aria-hidden="true"
                />
              )
            ) : (
              <div
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.6875rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--color-sidebar-text-secondary, var(--color-text-muted))',
                }}
              >
                {section.title}
              </div>
            )}

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
                  title={item.label}
                  aria-label={item.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    gap: isCollapsed ? 0 : '0.75rem',
                    padding: isCollapsed ? '0.65rem 0' : '0.6rem 0.85rem',
                    borderRadius: 'var(--radius-md, 0.75rem)',
                    minHeight: isCollapsed ? '44px' : '40px',
                    margin: isCollapsed ? '2px 4px' : '2px 0',
                    fontSize: '0.84rem',
                    fontWeight: isActive ? '600' : '500',
                    color: isActive ? 'var(--color-sidebar-active-text, #FFFFFF)' : 'var(--color-sidebar-text-primary, var(--color-text-primary))',
                    backgroundColor: isActive ? 'var(--color-sidebar-active-bg, var(--color-primary))' : 'transparent',
                    borderLeft: 'none',
                    borderRight: 'none',
                    textDecoration: 'none',
                    position: 'relative',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--color-sidebar-hover-bg, var(--color-nav-hover-bg))'
                      e.currentTarget.style.color = 'var(--color-sidebar-text-primary, var(--color-text-primary))'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = 'var(--color-sidebar-text-primary, var(--color-text-primary))'
                    }
                  }}
                >
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon
                      size={20}
                      strokeWidth={isActive ? 2.25 : 1.75}
                      color={isActive ? 'var(--color-sidebar-active-text, #FFFFFF)' : 'var(--color-sidebar-icon, var(--color-text-secondary))'}
                      style={{ flexShrink: 0, transition: 'color var(--transition-fast)' }}
                    />
                    {isCollapsed && badgeCount > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-8px',
                          backgroundColor: 'var(--color-sidebar-active-bg, var(--color-primary))',
                          color: '#FFFFFF',
                          fontSize: '0.6rem',
                          fontWeight: '800',
                          borderRadius: 'var(--radius-full)',
                          padding: '0 4px',
                          minWidth: '15px',
                          height: '15px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                          border: '1.5px solid var(--color-surface)',
                          zIndex: 2,
                        }}
                      >
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </div>

                  {!isCollapsed && (
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isActive ? 'var(--color-sidebar-active-text, #FFFFFF)' : 'inherit' }}>
                      {item.label}
                    </span>
                  )}

                  {!isCollapsed && badgeCount > 0 && (
                    <span
                      style={{
                        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.22)' : 'var(--color-sidebar-active-bg, var(--color-primary))',
                        color: 'var(--color-sidebar-active-text, #FFFFFF)',
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
    </aside>
  )
}

export default AccountSidebar

/**
 * Sidebar.jsx — Generic Navigation Sidebar
 *
 * PROPS:
 *   title       → Sidebar header text (e.g., "Seller Portal", "Admin Panel")
 *   navItems    → Array of nav items — two supported shapes:
 *
 *     Flat item:
 *     { label: 'Dashboard', icon: LayoutDashboard, path: '/seller/dashboard' }
 *
 *     Grouped items:
 *     { group: 'Catalog', items: [{ label, icon, path }, ...] }
 *
 *   width       → Optional number, default 260 (pixels)
 *
 * ACTIVE STATE:
 *   Uses NavLink from React Router. When the current URL matches `path`,
 *   NavLink's isActive prop is true. We use a callback className:
 *     className={({ isActive }) => isActive ? 'active' : ''}
 *   This is React Router's built-in pattern — no manual pathname comparison.
 *
 * DESIGN:
 *   Width: 260px
 *   Background: --color-surface
 *   Active item: left border highlight + background tint
 *   Groups: small uppercase label with a horizontal rule
 *
 * HOW SELLERL AYOUT AND ADMINLAYOUT USE THIS:
 *   Both import Sidebar and pass their specific navItems.
 *   The component is fully reusable — one implementation serves both.
 */

import { useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { isNavItemActive } from '@/utils/navigation'

const SidebarItem = ({ item, allPaths = [] }) => {
  const Icon = item.icon
  const location = useLocation()
  const isActive = isNavItemActive(item.path, location.pathname, allPaths)

  return (
    <NavLink
      to={item.path}
      end
      className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.625rem 1rem',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.875rem',
        fontWeight: isActive ? '600' : '400',
        color: isActive ? 'var(--color-sidebar-active-text, #FFFFFF)' : 'var(--color-sidebar-text-primary, var(--color-text-primary))',
        backgroundColor: isActive ? 'var(--color-sidebar-active-bg, var(--color-primary))' : 'transparent',
        borderLeft: 'none',
        textDecoration: 'none',
        transition: 'all var(--transition-fast)',
        cursor: 'pointer',
        marginBottom: '2px',
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
      {Icon && (
        <Icon
          size={18}
          strokeWidth={isActive ? 2.25 : 1.75}
          color={isActive ? 'var(--color-sidebar-active-text, #FFFFFF)' : 'var(--color-sidebar-icon, var(--color-text-secondary))'}
          style={{ flexShrink: 0, transition: 'color var(--transition-fast)' }}
        />
      )}
      <span style={{ flex: 1, color: isActive ? 'var(--color-sidebar-active-text, #FFFFFF)' : 'inherit' }}>{item.label}</span>
      {item.badge && (
        <span
          style={{
            background: isActive ? 'rgba(255, 255, 255, 0.22)' : 'var(--color-sidebar-active-bg, var(--color-primary))',
            color: 'var(--color-sidebar-active-text, #FFFFFF)',
            fontSize: '0.65rem',
            fontWeight: '700',
            borderRadius: 'var(--radius-full)',
            padding: '0.1rem 0.4rem',
            minWidth: '18px',
            textAlign: 'center',
          }}
        >
          {item.badge}
        </span>
      )}
    </NavLink>
  )
}

const SidebarGroup = ({ group, allPaths = [] }) => (
  <div style={{ marginBottom: '0.5rem' }}>
    <p style={{
      fontSize: '0.65rem',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: 'var(--color-sidebar-text-secondary, var(--color-text-muted))',
      padding: '0.75rem 1rem 0.375rem',
    }}>
      {group.group}
    </p>
    {group.items.map((item) => (
      <SidebarItem key={item.path} item={item} allPaths={allPaths} />
    ))}
  </div>
)

const Sidebar = ({ title, navItems = [], width = 260 }) => {
  const isGrouped = navItems.length > 0 && navItems[0].group !== undefined

  const allPaths = useMemo(() => {
    return navItems.flatMap((item) => {
      if (item.items && Array.isArray(item.items)) {
        return item.items.map((sub) => sub.path)
      }
      return item.path ? [item.path] : []
    })
  }, [navItems])

  return (
    <aside
      style={{
        width: `${width}px`,
        minWidth: `${width}px`,
        background: 'var(--color-sidebar-bg, var(--color-sidebar))',
        borderRight: '1px solid var(--color-sidebar-border, var(--color-border))',
        height: 'calc(100vh - 64px)',  // Full height minus navbar
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem 0.75rem',
        position: 'sticky',
        top: '64px',   // Stick just below the navbar
      }}
    >
      <nav style={{ flex: 1 }}>
        {isGrouped
          ? navItems.map((group, i) => (
              <SidebarGroup key={i} group={group} allPaths={allPaths} />
            ))
          : navItems.map((item) => (
              <SidebarItem key={item.path} item={item} allPaths={allPaths} />
            ))
        }
      </nav>
    </aside>
  )
}

export default Sidebar

/**
 * CustomerLayout.jsx — Polished, Premium E-Commerce Marketplace Shell
 *
 * ARCHITECTURAL SPECIFICATION:
 * ┌────────────────────────────────────────────────────────────────────────────────────────────┐
 * │ Universal Fixed Marketplace Navbar (Permanent Top: position: fixed; top: 0; z-index: 100) │
 * │ [Shopivo Logo | Search Bar | Wishlist | Cart | Alerts | SidebarToggle | Theme | Name/Email Avatar ▼]│
 * ├────────────────────────────────────────────────────────────────────────────────────────────┤
 * │ Mobile Search Sub-Bar (Displays only on screens < 768px, fixed under navbar)               │
 * ├────────────────────────────────────────────────────────────────────────────────────────────┤
 * │ Desktop Fixed Sidebar (top: 64px, calc(100vh - 64px)) │ Main Scrollable Viewport           │
 * │  • Expanded (250px) / Collapsed (68px)                │  • Margin-top: 64px (or 104px mob) │
 * │  • Pinned in viewport below header                    │  • Margin-left: 250px (or 68px)    │
 * │  • Independent scroll if menu overflows               │  • Smooth fluid scrolling          │
 * └───────────────────────────────────────────────────────┴────────────────────────────────────┘
 */

import { useState, useEffect, useRef } from 'react'
import { Outlet, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  Menu,
  Search,
  ShoppingCart,
  Heart,
  Bell,
  LogOut,
  X,
  History,
  Tag,
} from 'lucide-react'
import { selectCurrentUser, logout } from '@/store/authSlice'
import { selectCartItemCount, updateCartSummary } from '@/store/cartSlice'
import { getCart } from '@/services/cartService'
import { getCategories } from '@/services/productService'
import { getUnreadCount } from '@/services/notificationService'
import { ROUTES } from '@/constants/routes'
import AccountSidebar from '@/components/customer/AccountSidebar'
import CustomerAccountDrawer from '@/components/customer/CustomerAccountDrawer'
import BrandLogo from '@/components/common/BrandLogo'
import ThemeToggle from '@/components/common/ThemeToggle'

const DEFAULT_CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: '1', name: 'Mobiles' },
  { id: '2', name: 'Electronics' },
  { id: '3', name: 'Fashion' },
  { id: '4', name: 'Home & Kitchen' },
  { id: '5', name: 'Appliances' },
  { id: '6', name: 'Beauty & Personal Care' },
  { id: '7', name: 'Books' },
  { id: '8', name: 'Sports & Fitness' },
  { id: '9', name: 'Toys' },
]

/**
 * Modern Sidebar Toggle Icons matching user specification:
 * - 3 horizontal lines
 * - Collapse indicator on middle line for expanded state
 * - Expand indicator on middle line for collapsed state
 * - Clean geometric proportions & dark black/green-compatible stroke
 */
const SidebarCollapseIcon = ({ size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M8 9L5 12L8 15" />
    <line x1="5" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

const SidebarExpandIcon = ({ size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 9L19 12L16 15" />
    <line x1="3" y1="12" x2="19" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

const CustomerLayout = () => {
  const user = useSelector(selectCurrentUser)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const cartCount = useSelector(selectCartItemCount) || 0

  // ── Desktop Sidebar Collapse State (persisted in localStorage) ──
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sc_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('sc_sidebar_collapsed', String(next))
      } catch {}
      return next
    })
  }

  // Search & Suggestions State
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const searchInputRef = useRef(null)

  // ── Sync Cart Summary on Mount ──
  useEffect(() => {
    getCart()
      .then((data) => {
        if (data) {
          dispatch(updateCartSummary({ itemCount: data.totalItems, subtotal: data.subtotal }))
        }
      })
      .catch(() => {})
  }, [dispatch])

  // ── Sync Categories for Auto-Matching ──
  useEffect(() => {
    getCategories()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories([{ id: 'all', name: 'All' }, ...data])
        }
      })
      .catch(() => {})
  }, [])

  // ── Sync Notifications Count ──
  useEffect(() => {
    if (user) {
      getUnreadCount()
        .then((count) => setUnreadNotifications(typeof count === 'number' ? count : 0))
        .catch(() => setUnreadNotifications(0))
    }
  }, [user])

  // ── Keyboard Accessibility: Close Suggestions on Escape ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isSearchFocused) setIsSearchFocused(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSearchFocused])

  // ── Recent Searches in localStorage ──
  const loadRecentSearches = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('sc_recent_searches') || '[]')
      setRecentSearches(Array.isArray(stored) ? stored.slice(0, 6) : [])
    } catch {
      setRecentSearches([])
    }
  }

  useEffect(() => {
    loadRecentSearches()
  }, [])

  const saveRecentSearch = (query) => {
    if (!query || !query.trim()) return
    const trimmed = query.trim()
    try {
      const existing = JSON.parse(localStorage.getItem('sc_recent_searches') || '[]')
      const filtered = existing.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())
      const updated = [trimmed, ...filtered].slice(0, 6)
      localStorage.setItem('sc_recent_searches', JSON.stringify(updated))
      setRecentSearches(updated)
    } catch {
      // ignore storage errors
    }
  }

  const removeRecentSearch = (e, itemToRemove) => {
    e.stopPropagation()
    try {
      const updated = recentSearches.filter((item) => item !== itemToRemove)
      localStorage.setItem('sc_recent_searches', JSON.stringify(updated))
      setRecentSearches(updated)
    } catch {
      // ignore
    }
  }

  const clearAllRecentSearches = (e) => {
    e.stopPropagation()
    try {
      localStorage.removeItem('sc_recent_searches')
      setRecentSearches([])
    } catch {
      // ignore
    }
  }

  // ── Category Matching Suggestions ──
  const matchingCategories = searchValue.trim().length > 0
    ? categories.filter(
        (c) => c.id !== 'all' && c.name.toLowerCase().includes(searchValue.trim().toLowerCase())
      ).slice(0, 3)
    : []

  const activeSuggestions = searchValue.trim().length > 0
    ? matchingCategories.map((c) => ({ type: 'category', value: c.name, categoryId: c.id }))
    : recentSearches.map((s) => ({ type: 'recent', value: s }))

  const handleSearchSubmit = (e, customQuery = null, categoryId = null) => {
    if (e && e.preventDefault) e.preventDefault()
    const query = customQuery !== null ? customQuery : searchValue
    setIsSearchFocused(false)
    setHighlightedIndex(-1)

    if (query && query.trim()) {
      saveRecentSearch(query.trim())
      if (categoryId) {
        navigate(`${ROUTES.CUSTOMER_PRODUCTS}?search=${encodeURIComponent(query.trim())}&category=${categoryId}`)
      } else {
        navigate(`${ROUTES.CUSTOMER_PRODUCTS}?search=${encodeURIComponent(query.trim())}`)
      }
    } else if (categoryId) {
      navigate(`${ROUTES.CUSTOMER_PRODUCTS}?category=${categoryId}`)
    } else {
      navigate(ROUTES.CUSTOMER_PRODUCTS)
    }
  }

  const handleKeyDown = (e) => {
    if (!isSearchFocused || activeSuggestions.length === 0) {
      if (e.key === 'Escape') setIsSearchFocused(false)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev < activeSuggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : activeSuggestions.length - 1))
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < activeSuggestions.length) {
        e.preventDefault()
        const selected = activeSuggestions[highlightedIndex]
        if (selected.type === 'category') {
          handleSearchSubmit(e, searchValue, selected.categoryId)
        } else {
          setSearchValue(selected.value)
          handleSearchSubmit(e, selected.value)
        }
      }
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false)
      setHighlightedIndex(-1)
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate(ROUTES.LOGIN)
  }

  const userInitial = (user?.firstName?.[0] || user?.email?.[0] || 'C').toUpperCase()
  const fullName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : (user?.email ? user.email.split('@')[0] : 'Customer Account')

  // Render search suggestions dropdown
  const renderSearchDropdown = () => {
    if (!isSearchFocused) return null

    const hasMatchingCategories = matchingCategories.length > 0
    const hasRecentSearches = searchValue.trim().length === 0 && recentSearches.length > 0
    const hasQuery = searchValue.trim().length > 0

    if (!hasMatchingCategories && !hasRecentSearches && !hasQuery) {
      return null
    }

    return (
      <>
        <div
          onMouseDown={() => setIsSearchFocused(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 140,
          }}
        />
        <div
          className="fade-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 150,
            maxHeight: 'min(360px, 60vh)',
            overflowY: 'auto',
          }}
        >
          {hasMatchingCategories && (
            <div style={{ padding: '0.4rem 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <div
                style={{
                  padding: '0.35rem 0.95rem',
                  fontSize: '0.6875rem',
                  fontWeight: '700',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Suggested Categories
              </div>
              {matchingCategories.map((cat, idx) => {
                const isHighlighted = highlightedIndex === idx
                return (
                  <div
                    key={cat.id}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleSearchSubmit(null, searchValue, cat.id)
                    }}
                    style={{
                      padding: '0.55rem 0.95rem',
                      fontSize: '0.8125rem',
                      color: 'var(--color-text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.55rem',
                      backgroundColor: isHighlighted ? 'var(--color-surface-raised)' : 'transparent',
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                  >
                    <Tag size={13} color="var(--color-primary)" />
                    <span>
                      In <strong>{cat.name}</strong>
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {hasRecentSearches && (
            <div style={{ padding: '0.4rem 0' }}>
              <div
                style={{
                  padding: '0.35rem 0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.6875rem',
                  fontWeight: '700',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                <span>Recent Searches</span>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    clearAllRecentSearches(e)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.7rem',
                    color: 'var(--color-primary)',
                    cursor: 'pointer',
                    padding: 0,
                    fontWeight: '600',
                  }}
                >
                  Clear All
                </button>
              </div>

              {recentSearches.map((item, idx) => {
                const isHighlighted = highlightedIndex === idx
                return (
                  <div
                    key={item}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setSearchValue(item)
                      handleSearchSubmit(null, item)
                    }}
                    style={{
                      padding: '0.55rem 0.95rem',
                      fontSize: '0.8125rem',
                      color: 'var(--color-text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isHighlighted ? 'var(--color-surface-raised)' : 'transparent',
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                      <History size={13} color="var(--color-text-muted)" />
                      <span>{item}</span>
                    </span>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        removeRecentSearch(e, item)
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Remove from history"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {hasQuery && (
            <div
              onMouseDown={(e) => {
                e.preventDefault()
                handleSearchSubmit(null, searchValue)
              }}
              style={{
                padding: '0.65rem 0.95rem',
                fontSize: '0.8125rem',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                fontWeight: '600',
                backgroundColor: 'var(--color-surface-raised)',
                borderTop: hasMatchingCategories ? '1px solid var(--color-border-subtle)' : 'none',
              }}
            >
              <Search size={14} />
              <span>Search for "{searchValue}"</span>
            </div>
          )}
        </div>
      </>
    )
  }

  return (
    <div className="customer-layout-shell">
      {/* ── 1. Top Universal Fixed Header (Permamently visible at top: 0) ── */}
      <header className="customer-top-header">
        <div className="customer-navbar-inner">
          {/* Left: Sidebar Brand Header [SHOPIVO LOGO + TEXT] ... [TOGGLE ICON] in the SAME ROW */}
          <div className={`customer-sidebar-brand-header ${isSidebarCollapsed ? 'is-collapsed' : ''}`}>
            {/* Mobile Menu Toggle (displayed only on mobile/tablet <= 1024px) */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="customer-mobile-menu-btn"
              aria-label="Open navigation menu"
              title="Menu"
            >
              <Menu size={22} />
            </button>

            {/* SHOPIVO Brand Logo (Icon + Wordmark) — Hidden completely when collapsed */}
            {!isSidebarCollapsed && (
              <div className="customer-brand-logo-container">
                <BrandLogo
                  size="md"
                  showWordmark={true}
                  to={ROUTES.CUSTOMER_DASHBOARD}
                  imgStyle={{ width: '28px', height: '28px' }}
                  textStyle={{ fontSize: '1.15rem' }}
                />
              </div>
            )}

            {/* Desktop Modern Sidebar Toggle Button (centered in collapsed strip, right-aligned when expanded) */}
            <button
              type="button"
              onClick={handleSidebarToggle}
              className="customer-sidebar-brand-toggle"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? <SidebarExpandIcon size={18} /> : <SidebarCollapseIcon size={18} />}
            </button>
          </div>

          {/* Center: Desktop Responsive Search Bar */}
          <div className="customer-desktop-search">
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', width: '100%', position: 'relative' }}>
              <input
                ref={searchInputRef}
                className="input"
                placeholder="Search products, brands, categories..."
                style={{
                  height: '40px',
                  fontSize: '0.875rem',
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRight: 'none',
                  borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
                  paddingLeft: '1rem',
                  paddingRight: '2.25rem',
                  width: '100%',
                  color: 'var(--color-text-primary)',
                  boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.03)',
                }}
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value)
                  setHighlightedIndex(-1)
                  setIsSearchFocused(true)
                }}
                onFocus={() => {
                  loadRecentSearches()
                  setIsSearchFocused(true)
                }}
                onKeyDown={handleKeyDown}
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchValue('')
                    setHighlightedIndex(-1)
                    searchInputRef.current?.focus()
                  }}
                  style={{
                    position: 'absolute',
                    right: '48px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    zIndex: 2,
                  }}
                  aria-label="Clear search input"
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="submit"
                aria-label="Submit search"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '0 1.15rem',
                  borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-primary)')}
              >
                <Search size={16} strokeWidth={2.25} />
              </button>
            </form>

            {renderSearchDropdown()}
          </div>

          {/* Right: Actions in strict required order:
              WISHLIST | CART | NOTIFICATIONS | THEME TOGGLE | CUSTOMER NAME + EMAIL | STANDALONE SIGN OUT */}
          <div className="customer-navbar-actions">
            {/* 1. Wishlist */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.CUSTOMER_WISHLIST)}
              className="customer-action-btn customer-nav-wishlist"
              title="Saved Wishlist"
              aria-label="View saved wishlist items"
            >
              <Heart size={19} />
            </button>

            {/* 2. Cart with Live Badge */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.CUSTOMER_CART)}
              className="customer-action-btn customer-nav-cart"
              title="Shopping Cart"
              aria-label="View shopping cart"
            >
              <ShoppingCart size={19} />
              {cartCount > 0 && (
                <span className="customer-badge">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {/* 3. Notifications with Live Badge */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.CUSTOMER_NOTIFICATIONS)}
              className="customer-action-btn customer-nav-notifications"
              title="Notifications"
              aria-label="View customer notifications"
            >
              <Bell size={19} />
              {unreadNotifications > 0 && (
                <span className="customer-badge">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </button>

            {/* 4. Theme Toggle */}
            <div className="customer-nav-theme">
              <ThemeToggle />
            </div>

            {/* 5. Customer Full Name & Email Block (Directly displayed in navbar, non-interactive, no dropdown) */}
            <div className="customer-user-identity" aria-label="Authenticated customer profile">
              <div className="customer-user-avatar" aria-hidden="true">
                {userInitial}
              </div>
              <div className="customer-user-identity-text">
                <span className="customer-user-identity-name" title={fullName}>
                  {fullName}
                </span>
                <span className="customer-user-identity-email" title={user?.email || ''}>
                  {user?.email || ''}
                </span>
              </div>
            </div>

            {/* 6. Standalone Sign Out Icon Button (Far right of customer identity) */}
            <button
              type="button"
              onClick={handleLogout}
              className="customer-action-btn customer-nav-logout-btn"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={19} />
            </button>
          </div>
        </div>

        {/* ── Sub-Bar: Mobile Full-Width Search (< 768px) ── */}
        <div className="customer-mobile-search-bar">
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', width: '100%', position: 'relative' }}>
            <input
              className="input"
              placeholder="Search products, brands, categories..."
              style={{
                height: '38px',
                fontSize: '0.84rem',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRight: 'none',
                borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
                paddingLeft: '0.85rem',
                paddingRight: '2rem',
                width: '100%',
                color: 'var(--color-text-primary)',
              }}
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value)
                setHighlightedIndex(-1)
                setIsSearchFocused(true)
              }}
              onFocus={() => {
                loadRecentSearches()
                setIsSearchFocused(true)
              }}
              onKeyDown={handleKeyDown}
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => {
                  setSearchValue('')
                  setHighlightedIndex(-1)
                }}
                style={{
                  position: 'absolute',
                  right: '44px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  zIndex: 2,
                }}
                aria-label="Clear mobile search input"
              >
                <X size={13} />
              </button>
            )}
            <button
              type="submit"
              aria-label="Submit search"
              style={{
                backgroundColor: 'var(--color-primary)',
                border: 'none',
                color: '#ffffff',
                padding: '0 1rem',
                borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Search size={15} strokeWidth={2.25} />
            </button>
          </form>

          {renderSearchDropdown()}
        </div>
      </header>

      {/* ── 2. App Shell: Fixed Sidebar + Main Scrollable Viewport ── */}
      <div className={`customer-app-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <AccountSidebar
          isCollapsed={isSidebarCollapsed}
          unreadNotifications={unreadNotifications}
        />

        <div className="customer-main-content">
          <main className="customer-main-viewport fade-in">
            <Outlet />
          </main>
        </div>
      </div>

      {/* ── 3. Mobile Navigation Drawer ── */}
      <CustomerAccountDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        unreadNotifications={unreadNotifications}
      />
    </div>
  )
}

export default CustomerLayout

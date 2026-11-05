/**
 * CustomerLayout.jsx — Clean, Dense E-Commerce Marketplace Shell
 *
 * LAYOUT ARCHITECTURE:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ Universal Marketplace Navbar (Sticky Top)                              │
 * │   [ ☰ Shopivo | Centered Search | 🔔 Unread Count | Sreeja ▼ ]         │
 * ├────────────────────────────────────────────────────────────────────────┤
 * Fixed Left Sidebar:
 *   [ Minimal Continuous Navigation List: Overview -> My Orders -> ... -> Logout ]
 * Main Viewport:
 *   [ Scrollable Page Content ]
 */

import { Outlet, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import {
  Shield,
  Search,
  Bell,
  ShoppingCart,
  ChevronDown,
  LogOut,
  X,
  Menu,
  User,
  ShieldCheck,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { selectCurrentUser, logout } from '@/store/authSlice'
import { selectCartItemCount, updateCartSummary } from '@/store/cartSlice'
import { getCart } from '@/services/cartService'
import { getCategories } from '@/services/productService'
import { getUnreadCount } from '@/services/notificationService'
import { ROUTES } from '@/constants/routes'
import { useTheme } from '@/context/ThemeContext'
import Navbar from '@/components/common/Navbar'
import AccountSidebar from '@/components/customer/AccountSidebar'
import CustomerAccountDrawer from '@/components/customer/CustomerAccountDrawer'
import BrandLogo from '@/components/common/BrandLogo'
import ThemeToggle from '@/components/common/ThemeToggle'

// Default categories fallback for search auto-match
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
  { id: '10', name: 'Deals' },
]

const CustomerLayout = () => {
  const user = useSelector(selectCurrentUser)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const cartCount = useSelector(selectCartItemCount) || 0
  const { theme, toggleTheme } = useTheme()

  // Fetch live cart summary on mount to initialize badge
  useEffect(() => {
    getCart()
      .then((data) => {
        if (data) {
          dispatch(updateCartSummary({ itemCount: data.totalItems, subtotal: data.subtotal }))
        }
      })
      .catch(() => {})
  }, [dispatch])

  // Search Suggestions & Recent Searches State
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  // Load Recent Searches from localStorage
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

  // Save new search to localStorage
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
      // ignore
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

  // Live Matching Category Suggestions
  const matchingCategories = searchValue.trim().length > 0
    ? categories.filter(
        (c) => c.id !== 'all' && c.name.toLowerCase().includes(searchValue.trim().toLowerCase())
      ).slice(0, 3)
    : []

  // Combined suggestions list for keyboard navigation
  const activeSuggestions = searchValue.trim().length > 0
    ? matchingCategories.map((c) => ({ type: 'category', value: c.name, categoryId: c.id }))
    : recentSearches.map((s) => ({ type: 'recent', value: s }))

  // Fetch live categories from API for search auto-match
  useEffect(() => {
    getCategories()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories([{ id: 'all', name: 'All' }, ...data])
        }
      })
      .catch(() => {})
  }, [])

  // Fetch live unread notification count on mount & route change
  useEffect(() => {
    getUnreadCount()
      .then((count) => setUnreadNotifications(typeof count === 'number' ? count : 0))
      .catch(() => {})
  }, [location.pathname])

  // Sync search input if URL changes
  useEffect(() => {
    setSearchValue(searchParams.get('search') || '')
  }, [searchParams])

  // Close dropdowns on navigation
  useEffect(() => {
    setProfileOpen(false)
    setIsSearchFocused(false)
    setHighlightedIndex(-1)
  }, [location.pathname])

  const handleLogout = () => {
    dispatch(logout())
    navigate(ROUTES.LOGIN)
  }

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

  // Keyboard navigation for search suggestions
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

  const userInitial = (user?.firstName?.[0] || user?.email?.[0] || 'C').toUpperCase()
  const displayName = user?.firstName ? `${user.firstName}` : 'Customer'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg)' }}>
      {/* ── 1. Top Fixed Navbar ── */}
      <Navbar
        logo={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* Mobile menu toggle button */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="customer-mobile-menu-btn"
              aria-label="Open navigation menu"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-primary)',
                padding: '0.25rem',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Menu size={22} />
            </button>

            {/* Brand Logo */}
            <BrandLogo size="md" to={ROUTES.CUSTOMER_DASHBOARD} />
          </div>
        }
        center={
          <div style={{ position: 'relative', width: '100%' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', width: '100%', position: 'relative' }}>
              <input
                className="input"
                placeholder="Search products, brands and more..."
                style={{
                  height: '40px',
                  fontSize: '0.875rem',
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRight: 'none',
                  borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)',
                  paddingLeft: '1rem',
                  paddingRight: '2rem',
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
                    right: '48px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    zIndex: 2,
                  }}
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="submit"
                aria-label="Search"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '0 1.15rem',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-primary)')}
              >
                <Search size={16} />
              </button>
            </form>

            {/* ── Search Suggestions Dropdown ── */}
            {isSearchFocused && (
              <>
                <div
                  onClick={() => setIsSearchFocused(false)}
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
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 150,
                    overflow: 'hidden',
                  }}
                >
                  {matchingCategories.length > 0 && (
                    <div style={{ padding: '0.4rem 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <div
                        style={{
                          padding: '0.35rem 0.95rem',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          color: 'var(--color-text-disabled)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Categories
                      </div>
                      {matchingCategories.map((cat, idx) => {
                        const isHighlighted = highlightedIndex === idx
                        return (
                          <div
                            key={cat.id}
                            onClick={() => handleSearchSubmit(null, searchValue, cat.id)}
                            style={{
                              padding: '0.6rem 0.95rem',
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
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Search size={14} color="var(--color-primary)" />
                              <strong>{searchValue}</strong> in{' '}
                              <span style={{ color: 'var(--color-primary)', fontWeight: '600' }}>{cat.name}</span>
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-disabled)' }}>Category</span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {searchValue.trim().length === 0 && recentSearches.length > 0 && (
                    <div>
                      <div
                        style={{
                          padding: '0.55rem 0.95rem 0.3rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            color: 'var(--color-text-disabled)',
                            textTransform: 'uppercase',
                          }}
                        >
                          Recent Searches
                        </span>
                        <button
                          type="button"
                          onClick={clearAllRecentSearches}
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
                            onClick={() => {
                              setSearchValue(item)
                              handleSearchSubmit(null, item)
                            }}
                            style={{
                              padding: '0.6rem 0.95rem',
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
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Search size={13} color="var(--color-text-disabled)" />
                              <span>{item}</span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => removeRecentSearch(e, item)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-text-disabled)',
                                cursor: 'pointer',
                                padding: '2px',
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

                  {searchValue.trim().length > 0 && (
                    <div
                      onClick={() => handleSearchSubmit(null, searchValue)}
                      style={{
                        padding: '0.6rem 0.95rem',
                        fontSize: '0.8125rem',
                        color: 'var(--color-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: '600',
                        borderTop: matchingCategories.length > 0 ? '1px solid var(--color-border-subtle)' : 'none',
                      }}
                    >
                      <Search size={14} /> Search for "{searchValue}"
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        }
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* ── Shopping Cart with Live Badge ── */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.CUSTOMER_CART)}
              title="Shopping Cart"
              aria-label="View shopping cart"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.45rem',
                borderRadius: 'var(--radius-sm)',
                position: 'relative',
                color: 'var(--color-text-primary)',
                transition: 'background-color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <ShoppingCart size={20} color="var(--color-text-secondary)" />
              {cartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    backgroundColor: 'var(--color-primary)',
                    color: '#ffffff',
                    fontSize: '0.65rem',
                    fontWeight: '800',
                    borderRadius: 'var(--radius-full)',
                    padding: '0 4px',
                    minWidth: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '1',
                    border: '2px solid var(--color-surface)',
                  }}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {/* ── Notification Bell with Live Unread Count ── */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.CUSTOMER_NOTIFICATIONS)}
              title="Notifications"
              aria-label="View notifications"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.45rem',
                borderRadius: 'var(--radius-sm)',
                position: 'relative',
                color: 'var(--color-text-primary)',
                transition: 'background-color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Bell size={20} color="var(--color-text-secondary)" />
              {unreadNotifications > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    backgroundColor: 'var(--color-primary)',
                    color: '#ffffff',
                    fontSize: '0.65rem',
                    fontWeight: '800',
                    borderRadius: 'var(--radius-full)',
                    padding: '0 4px',
                    minWidth: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '1',
                    border: '2px solid var(--color-surface)',
                  }}
                >
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </button>

            {/* ── Permanent Theme Toggle Button ── */}
            <ThemeToggle />

            {/* ── Customer Name Dropdown (Minimal Account Menu) ── */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.4rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid transparent',
                  backgroundColor: profileOpen ? 'var(--color-surface-raised)' : 'transparent',
                  cursor: 'pointer',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  transition: 'background-color var(--transition-fast)',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: '#ffffff',
                  }}
                >
                  {userInitial}
                </div>
                <span>{displayName}</span>
                <ChevronDown
                  size={14}
                  style={{
                    transition: 'transform 0.2s',
                    transform: profileOpen ? 'rotate(180deg)' : 'none',
                  }}
                />
              </button>

              {profileOpen && (
                <div
                  className="fade-in"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 0.45rem)',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    minWidth: '200px',
                    zIndex: 200,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface-raised)',
                    }}
                  >
                    <p style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
                      {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Customer Account'}
                    </p>
                    <p
                      style={{
                        fontSize: '0.725rem',
                        color: 'var(--color-text-secondary)',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {user?.email}
                    </p>
                  </div>

                  <div style={{ padding: '0.35rem 0', display: 'flex', flexDirection: 'column' }}>
                    <button
                      onClick={() => {
                        navigate(ROUTES.CUSTOMER_PROFILE)
                        setProfileOpen(false)
                      }}
                      style={{
                        width: '100%',
                        padding: '0.55rem 1rem',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-primary)',
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        transition: 'background-color var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <User size={15} color="var(--color-text-secondary)" />
                      <span>View Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        navigate('/customer/profile#security')
                        setProfileOpen(false)
                      }}
                      style={{
                        width: '100%',
                        padding: '0.55rem 1rem',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-primary)',
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        transition: 'background-color var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <ShieldCheck size={15} color="var(--color-text-secondary)" />
                      <span>Security Settings</span>
                    </button>
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-border)', padding: '0.35rem 0' }}>
                    <button
                      onClick={() => {
                        handleLogout()
                        setProfileOpen(false)
                      }}
                      style={{
                        width: '100%',
                        padding: '0.55rem 1rem',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-danger)',
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        fontWeight: '600',
                        transition: 'background-color var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-danger-subtle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <LogOut size={15} color="var(--color-danger)" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        }
      />

      {/* ── 2. Global Shell: Fixed Left Sidebar + Scrollable Content ── */}
      <div className="customer-app-shell" style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - var(--header-height, 64px))' }}>
        {/* Fixed Desktop Sidebar */}
        <AccountSidebar />

        {/* Scrollable Main Content Area */}
        <div className="customer-main-content" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <main
            className="fade-in"
            style={{
              flex: 1,
              padding: '1.75rem',
              maxWidth: '1440px',
              width: '100%',
              margin: '0 auto',
            }}
          >
            <Outlet />
          </main>

          {/* Minimal Footer */}
          <footer
            style={{
              backgroundColor: 'var(--color-surface)',
              borderTop: '1px solid var(--color-border)',
              padding: '1.25rem 1.75rem',
              marginTop: 'auto',
              color: 'var(--color-text-secondary)',
              fontSize: '0.8125rem',
            }}
          >
            <div
              style={{
                maxWidth: '1440px',
                margin: '0 auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <BrandLogo size="sm" to={ROUTES.CUSTOMER_DASHBOARD} />
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                © 2026 Shopivo · Customer Platform
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* ── 3. Mobile Navigation Drawer ── */}
      <CustomerAccountDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />
    </div>
  )
}

export default CustomerLayout

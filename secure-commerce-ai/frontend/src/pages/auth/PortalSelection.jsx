/**
 * PortalSelection.jsx — Role-Based Portal Selection Experience
 *
 * Inspired by the AI-ATS multi-portal layout and fully adapted to SHOPIVO's
 * SHOPIVO – Role-Based Authentication Portal Selection
 * CodeChatura-inspired green identity: Refined Green (#0F8F6B),
 * Theme-aware Surfaces, Crisp Borders, and Crisp Typography.
 *
 * Provides distinct access paths for:
 * 1. Customer Portal  — Shopping, Orders, Wishlists, Reviews
 * 2. Seller Portal    — Inventory, Order Fulfilment, Analytics
 * 3. Administrator    — System Oversight, User Audits, Payment Controls (Strictly Authorized)
 */

import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  ShoppingBag,
  Store,
  ShieldCheck,
  Check,
  ArrowRight,
  Lock,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Package,
  Layers,
  Activity,
  Users,
} from 'lucide-react'
import BrandLogo from '@/components/common/BrandLogo'
import ThemeToggle from '@/components/common/ThemeToggle'
import AuthAnimatedBackground from '@/components/auth/AuthAnimatedBackground'
import { ROUTES } from '@/constants/routes'

export default function PortalSelection() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      if (user.role === 'ADMIN') {
        navigate(ROUTES.ADMIN_DASHBOARD, { replace: true })
      } else if (user.role === 'SELLER') {
        navigate(ROUTES.SELLER_DASHBOARD, { replace: true })
      } else {
        navigate(ROUTES.CUSTOMER_DASHBOARD, { replace: true })
      }
    }
  }, [isAuthenticated, user, navigate])

  const portals = [
    {
      id: 'customer',
      title: 'Customer',
      tagline: 'Personal Shopping Workspace',
      description:
        'Discover products, shop your favourite brands, manage orders, track deliveries and enjoy a personalized shopping experience.',
      icon: ShoppingBag,
      accentColor: 'var(--color-primary)',
      badge: 'Shopper Hub',
      primaryAction: {
        label: 'CONTINUE AS CUSTOMER',
        route: ROUTES.CUSTOMER_AUTH,
      },
      features: [
        'Explore Products & Categories',
        'Smart Shopping Experience',
        'Order Tracking & History',
        'Wishlist & Spending Analytics',
      ],
      quickLinks: [
        { label: 'Sign In', to: `${ROUTES.CUSTOMER_AUTH}?mode=signin` },
        { label: 'Sign Up', to: `${ROUTES.CUSTOMER_AUTH}?mode=signup` },
      ],
      showGoogle: true,
      googleRole: 'CUSTOMER',
      isAdmin: false,
    },
    {
      id: 'seller',
      title: 'Seller',
      tagline: 'Merchant Commerce Hub',
      description:
        'Showcase products, manage inventory, process customer orders, track sales revenue and grow your business with advanced analytics.',
      icon: Store,
      accentColor: 'var(--color-primary)',
      badge: 'Merchant Center',
      primaryAction: {
        label: 'CONTINUE AS SELLER',
        route: ROUTES.SELLER_AUTH,
      },
      features: [
        'Product & Inventory Management',
        'Order Management & Fulfilment',
        'Sales & Revenue Analytics',
        'Customer Reviews & Ratings',
      ],
      quickLinks: [
        { label: 'Sign In', to: `${ROUTES.SELLER_AUTH}?mode=signin` },
        { label: 'Sign Up', to: `${ROUTES.SELLER_AUTH}?mode=signup` },
      ],
      showGoogle: true,
      googleRole: 'SELLER',
      isAdmin: false,
    },
    {
      id: 'admin',
      title: 'Administrator',
      tagline: 'Platform Governance & Control',
      description:
        'Comprehensive administration dashboard to oversee marketplace operations, manage users and sellers, and monitor platform activity.',
      icon: ShieldCheck,
      accentColor: 'var(--color-primary)',
      badge: 'Restricted Access',
      primaryAction: {
        label: 'ADMINISTRATOR SIGN IN',
        route: ROUTES.ADMIN_AUTH,
      },
      features: [
        'User & Seller Management',
        'Product & Order Monitoring',
        'Payment & Refund Management',
        'Marketplace Analytics & Audits',
      ],
      quickLinks: [],
      showGoogle: false,
      isAdmin: true,
    },
  ]

  return (
    <div
      className="portal-selection-page"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text-primary)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Background ambient lighting */}
      <AuthAnimatedBackground />

      {/* Top Navigation Bar */}
      <header
        style={{
          width: '100%',
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '1.25rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <BrandLogo size="lg" to="/" ariaLabel="Shopivo Home" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeToggle />
          <Link
            to="/"
            style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
              padding: '0.5rem 0.875rem',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-primary)'
              e.currentTarget.style.borderColor = 'var(--color-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-secondary)'
              e.currentTarget.style.borderColor = 'var(--color-border)'
            }}
          >
            ← Back to Store
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '1.5rem 1.5rem 3.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Header Block */}
        <div style={{ textAlign: 'center', maxWidth: '720px', marginBottom: '2.75rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              backgroundColor: 'var(--color-primary-subtle)',
              border: '1px solid rgba(15, 143, 107, 0.3)',
              marginBottom: '1rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--color-primary)',
            }}
          >
            <Sparkles size={13} />
            <span>Role-Based Secure Access</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              color: 'var(--color-text-primary)',
              marginBottom: '0.75rem',
            }}
          >
            Welcome to <span style={{ color: 'var(--color-primary)' }}>SHOPIVO</span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(0.95rem, 1.8vw, 1.125rem)',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.5,
              margin: '0 auto',
            }}
          >
            Choose your portal to access your personalized shopping workspace.
          </p>
        </div>

        {/* 3 Portal Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.75rem',
            width: '100%',
            maxWidth: '1200px',
            alignItems: 'stretch',
          }}
        >
          {portals.map((portal) => {
            const IconComponent = portal.icon
            return (
              <div
                key={portal.id}
                className="portal-card"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  padding: '2rem 1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease, box-shadow 0.25s ease',
                  boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.35)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.borderColor = 'var(--color-primary)'
                  e.currentTarget.style.boxShadow = '0 12px 30px -4px rgba(15, 143, 107, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                  e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0, 0, 0, 0.35)'
                }}
              >
                {/* Top Section */}
                <div>
                  {/* Icon & Badge Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '12px',
                        backgroundColor: 'var(--color-primary-subtle)',
                        border: '1px solid rgba(15, 143, 107, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-primary)',
                      }}
                    >
                      <IconComponent size={26} strokeWidth={2.2} />
                    </div>

                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.25rem 0.65rem',
                        borderRadius: '9999px',
                        backgroundColor: portal.isAdmin ? 'rgba(239, 68, 68, 0.12)' : 'var(--color-surface-raised)',
                        color: portal.isAdmin ? '#f87171' : 'var(--color-text-secondary)',
                        border: portal.isAdmin ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--color-border)',
                      }}
                    >
                      {portal.badge}
                    </span>
                  </div>

                  {/* Title & Tagline */}
                  <h2
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: 'var(--color-text-primary)',
                      marginBottom: '0.25rem',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {portal.title}
                  </h2>
                  <p
                    style={{
                      fontSize: '0.8125rem',
                      color: 'var(--color-primary)',
                      fontWeight: 500,
                      marginBottom: '1rem',
                    }}
                  >
                    {portal.tagline}
                  </p>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.55,
                      marginBottom: '1.75rem',
                      minHeight: '64px',
                    }}
                  >
                    {portal.description}
                  </p>

                  {/* Features Divider */}
                  <div
                    style={{
                      height: '1px',
                      backgroundColor: 'var(--color-border)',
                      marginBottom: '1.5rem',
                    }}
                  />

                  {/* Features List */}
                  <div style={{ marginBottom: '2rem' }}>
                    <p
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--color-text-muted)',
                        marginBottom: '0.75rem',
                      }}
                    >
                      Key Capabilities
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      {portal.features.map((feature, idx) => (
                        <li
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.625rem',
                            fontSize: '0.875rem',
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          <div
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--color-primary-subtle)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--color-primary)',
                              flexShrink: 0,
                            }}
                          >
                            <Check size={11} strokeWidth={3} />
                          </div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Bottom Action Area */}
                <div>
                  {/* Primary Button */}
                  <Link
                    to={portal.primaryAction.route}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      padding: '0.875rem 1.25rem',
                      borderRadius: '10px',
                      backgroundColor: 'var(--color-primary)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      letterSpacing: '0.04em',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 2px 10px rgba(15, 143, 107, 0.25)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-primary-hover, #0B7A5B)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(15, 143, 107, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-primary)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 10px rgba(15, 143, 107, 0.25)'
                    }}
                  >
                    <span>{portal.primaryAction.label}</span>
                    <ArrowRight size={16} strokeWidth={2.5} />
                  </Link>

                  {/* Quick Links or Admin Notice */}
                  {portal.isAdmin ? (
                    <div
                      style={{
                        marginTop: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.375rem',
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      <Lock size={12} color="#f87171" />
                      <span>Authorized credentials only · Self-registration disabled</span>
                    </div>
                  ) : (
                    <div
                      style={{
                        marginTop: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem',
                        fontSize: '0.8125rem',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      <Link
                        to={`${portal.primaryAction.route}?mode=signin`}
                        style={{
                          color: 'var(--color-primary)',
                          textDecoration: 'none',
                          fontWeight: 600,
                        }}
                      >
                        Sign In
                      </Link>
                      <span style={{ color: 'var(--color-border)' }}>•</span>
                      <Link
                        to={`${portal.primaryAction.route}?mode=signup`}
                        style={{
                          color: 'var(--color-text-secondary)',
                          textDecoration: 'none',
                          fontWeight: 500,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
                      >
                        Sign Up
                      </Link>
                      <span style={{ color: 'var(--color-border)' }}>•</span>
                      <Link
                        to={`${portal.primaryAction.route}?mode=signin`}
                        style={{
                          color: 'var(--color-text-secondary)',
                          textDecoration: 'none',
                          fontWeight: 500,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
                      >
                        Google
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Security and Trust Footer */}
        <div
          style={{
            marginTop: '3.5rem',
            textAlign: 'center',
            fontSize: '0.8125rem',
            color: 'var(--color-text-muted)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '1.5rem',
              padding: '0.75rem 1.25rem',
              borderRadius: '9999px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={13} color="var(--color-primary)" /> 256-Bit SSL Encrypted
            </span>
            <span style={{ color: 'var(--color-border)' }}>|</span>
            <span>Role-Enforced JWT Authentication</span>
            <span style={{ color: 'var(--color-border)' }}>|</span>
            <span>PCI-DSS Compliant Payments</span>
          </div>
        </div>
      </main>
    </div>
  )
}

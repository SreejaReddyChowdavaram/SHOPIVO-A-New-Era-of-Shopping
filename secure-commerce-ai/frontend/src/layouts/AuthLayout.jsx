/**
 * AuthLayout.jsx — Modern Customer Authentication Layout
 * Supports dynamic Light/Dark Theme, subtle ambient background, and clean branding.
 */

import { Outlet } from 'react-router-dom'
import ThemeToggle from '@/components/common/ThemeToggle'
import AuthAnimatedBackground from '@/components/auth/AuthAnimatedBackground'
import BrandLogo from '@/components/common/BrandLogo'

const AuthLayout = () => {
  return (
    <div className="auth-page-wrapper">
      {/* Dynamic Animated Background (Floating AI & Security Orbs) */}
      <AuthAnimatedBackground />

      {/* Top bar with Theme Toggle */}
      <div className="auth-top-bar">
        <ThemeToggle />
      </div>

      {/* Centered Auth Container */}
      <div className="auth-card-entrance" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px' }}>
        
        {/* Brand Header */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.75rem' }}>
          <BrandLogo size="lg" to="/" ariaLabel="Shopivo Home" />
        </div>

        {/* Auth Card Content */}
        <div className="auth-card">
          <Outlet />
        </div>

        {/* Truthful Footer */}
        <p style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          color: 'var(--color-text-muted)',
          fontSize: '0.8125rem',
          fontWeight: '400',
        }}>
          © 2026 Shopivo · Customer Platform
        </p>
      </div>
    </div>
  )
}

export default AuthLayout

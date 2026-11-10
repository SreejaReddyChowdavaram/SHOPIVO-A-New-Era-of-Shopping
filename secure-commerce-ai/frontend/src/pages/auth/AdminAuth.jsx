/**
 * AdminAuth.jsx — Administrator Portal Authentication Experience
 *
 * STRICT SECURITY CONSTRAINTS:
 * - Single-mode: Sign In ONLY.
 * - NO Sign Up / Registration link or form.
 * - NO Google Sign-In or OAuth / Social login.
 * - Strict backend role verification: portalRole = 'ADMIN'.
 * - Non-admin accounts are rejected with security audit logging.
 * - Styled in CyberForge High-Security Aesthetic: Pure Black (#050505), Dark Card (#101010),
 *   Vibrant Emerald (#04DB7E), Crimson Notice (#EF4444).
 */

import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  ShieldAlert,
  KeyRound,
  FileText,
} from 'lucide-react'
import { login } from '@/store/authSlice'
import authService from '@/services/authService'
import BrandLogo from '@/components/common/BrandLogo'
import ThemeToggle from '@/components/common/ThemeToggle'
import AuthAnimatedBackground from '@/components/auth/AuthAnimatedBackground'
import { ROUTES } from '@/constants/routes'

export default function AdminAuth() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()

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

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!formData.email || !formData.password) {
      setError('Please provide both administrator email and password.')
      return
    }

    try {
      setLoading(true)
      const authData = await authService.login({
        email: formData.email,
        password: formData.password,
        portalRole: 'ADMIN',
      })

      dispatch(
        login({
          token: authData.accessToken,
          user: authData.user,
          role: authData.user.role,
        })
      )

      const from = location.state?.from?.pathname
      if (from && from.startsWith('/admin') && from !== ROUTES.FORBIDDEN) {
        navigate(from, { replace: true })
      } else {
        navigate(ROUTES.ADMIN_DASHBOARD, { replace: true })
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Authentication failed. Please verify administrator credentials.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="admin-auth-page"
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
      <AuthAnimatedBackground />

      {/* Top Navigation */}
      <header
        style={{
          width: '100%',
          maxWidth: '1200px',
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
            to={ROUTES.PORTAL_SELECTION}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
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
              e.currentTarget.style.color = '#04DB7E'
              e.currentTarget.style.borderColor = '#04DB7E'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-secondary)'
              e.currentTarget.style.borderColor = 'var(--color-border)'
            }}
          >
            <ArrowLeft size={15} />
            <span>Switch Portal</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem 1rem 3rem',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '440px',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '2.5rem 2rem',
            boxShadow: '0 8px 30px -4px rgba(0, 0, 0, 0.45)',
          }}
        >
          {/* Header Badge */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f87171',
                marginBottom: '1rem',
              }}
            >
              <ShieldAlert size={28} strokeWidth={2.2} />
            </div>

            <div
              style={{
                display: 'inline-block',
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '0.75rem',
              }}
            >
              Restricted Area
            </div>

            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.02em',
                marginBottom: '0.35rem',
              }}
            >
              Administrator Sign In
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
              Authorized system operators and compliance personnel only.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.625rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.85rem',
                marginBottom: '1.5rem',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label
                htmlFor="admin-email"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  marginBottom: '0.4rem',
                  color: 'var(--color-text-primary)',
                }}
              >
                Administrator Email / Username
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)',
                  }}
                />
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@shopivo.com"
                  autoComplete="username"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.875rem 0.75rem 2.5rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#04DB7E')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.4rem',
                }}
              >
                <label
                  htmlFor="admin-password"
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Password
                </label>
                <Link
                  to={`${ROUTES.FORGOT_PASSWORD}?portal=ADMIN`}
                  style={{
                    fontSize: '0.75rem',
                    color: '#04DB7E',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)',
                  }}
                />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    padding: '0.75rem 2.5rem 0.75rem 2.5rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#04DB7E')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.8125rem',
                borderRadius: '10px',
                backgroundColor: '#04DB7E',
                color: '#050505',
                fontWeight: 700,
                fontSize: '0.875rem',
                letterSpacing: '0.04em',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 10px rgba(4, 219, 126, 0.25)',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#00C77A')}
              onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#04DB7E')}
            >
              {loading ? <Loader2 size={18} className="spin" /> : <ShieldCheck size={18} strokeWidth={2.4} />}
              <span>{loading ? 'Authenticating...' : 'Sign In as Administrator'}</span>
            </button>
          </form>

          {/* Audit & Compliance Notice */}
          <div
            style={{
              marginTop: '1.75rem',
              padding: '0.85rem',
              borderRadius: '8px',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              lineHeight: 1.45,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>
              <KeyRound size={13} color="#04DB7E" />
              <span>Audit Logging Active</span>
            </div>
            All authentication attempts, IP addresses, and administrator interactions are cryptographically recorded in the platform audit log.
          </div>
        </div>
      </main>
    </div>
  )
}

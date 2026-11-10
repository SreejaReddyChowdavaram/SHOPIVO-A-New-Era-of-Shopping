/**
 * SellerAuth.jsx — Seller Portal Authentication Experience
 *
 * Provides dual-mode (Sign In & Sign Up) for Merchants, fully styled in SHOPIVO CyberForge:
 * - Pure/Near Black (#050505) & Dark Surface (#101010)
 * - Crisp Borders (#242424) & Vibrant Emerald (#04DB7E)
 * - Sign In mode: Email + Password + Google Sign-In with portalRole = 'SELLER'
 * - Sign Up mode: Full Name, Email, Store Name, Password, Confirm Password + Google Sign-In
 * - Enforces role compatibility: redirects to /seller/dashboard
 */

import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Store,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Building,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'
import { login } from '@/store/authSlice'
import authService from '@/services/authService'
import BrandLogo from '@/components/common/BrandLogo'
import ThemeToggle from '@/components/common/ThemeToggle'
import AuthAnimatedBackground from '@/components/auth/AuthAnimatedBackground'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import { ROUTES } from '@/constants/routes'

export default function SellerAuth() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()

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

  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  const [mode, setMode] = useState(initialMode)

  useEffect(() => {
    const urlMode = searchParams.get('mode')
    if (urlMode === 'signup' || urlMode === 'signin') {
      setMode(urlMode)
    }
  }, [searchParams])

  const switchMode = (newMode) => {
    setMode(newMode)
    setSearchParams({ mode: newMode })
    setError(null)
  }

  // Form State
  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  })

  const [signUpData, setSignUpData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    storeName: '',
    password: '',
    confirmPassword: '',
    agreeTerms: true,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Handle Sign In Submit
  const handleSignInSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!signInData.email || !signInData.password) {
      setError('Please provide both email and password.')
      return
    }

    try {
      setLoading(true)
      const authData = await authService.login({
        email: signInData.email,
        password: signInData.password,
        portalRole: 'SELLER',
      })

      dispatch(
        login({
          token: authData.accessToken,
          user: authData.user,
          role: authData.user.role,
        })
      )

      const from = location.state?.from?.pathname
      if (from && from.startsWith('/seller') && from !== ROUTES.FORBIDDEN) {
        navigate(from, { replace: true })
      } else {
        navigate(ROUTES.SELLER_DASHBOARD, { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to sign in. Please verify seller credentials.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Sign Up Submit
  const handleSignUpSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!signUpData.firstName.trim() || !signUpData.lastName.trim()) {
      setError('Please provide both your first and last name.')
      return
    }
    if (!signUpData.storeName.trim()) {
      setError('Please provide a Store or Business Name.')
      return
    }
    if (!signUpData.email.trim()) {
      setError('Please provide a valid business email address.')
      return
    }
    if (!signUpData.password || signUpData.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (!signUpData.agreeTerms) {
      setError('Please accept the Seller Agreement to continue.')
      return
    }

    try {
      setLoading(true)
      const authData = await authService.register({
        firstName: signUpData.firstName.trim(),
        lastName: signUpData.lastName.trim(),
        email: signUpData.email.trim(),
        password: signUpData.password,
        role: 'SELLER',
      })

      dispatch(
        login({
          token: authData.accessToken,
          user: authData.user,
          role: authData.user.role,
        })
      )

      navigate(ROUTES.SELLER_DASHBOARD, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to register seller. Email may already be registered.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Google Credential Callback
  const handleGoogleCredential = async (credential) => {
    setError(null)
    try {
      setLoading(true)
      const authData = await authService.googleAuth({
        credential,
        portalRole: 'SELLER',
        storeName: signUpData.storeName.trim() || 'My Shopivo Store',
      })

      dispatch(
        login({
          token: authData.accessToken,
          user: authData.user,
          role: authData.user.role,
        })
      )

      navigate(ROUTES.SELLER_DASHBOARD, { replace: true })
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Network connection error. Unable to reach authentication server.')
      } else {
        setError(err.response?.data?.message || err.message || 'Google sign-in failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="seller-auth-page"
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
            maxWidth: '480px',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '2.25rem 2rem',
            boxShadow: '0 8px 30px -4px rgba(0, 0, 0, 0.45)',
          }}
        >
          {/* Header Badge */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'var(--color-primary-subtle)',
                border: '1px solid rgba(4, 219, 126, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#04DB7E',
                marginBottom: '0.75rem',
              }}
            >
              <Store size={24} strokeWidth={2.2} />
            </div>

            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.02em',
                marginBottom: '0.25rem',
              }}
            >
              Seller Portal
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              {mode === 'signin'
                ? 'Sign in to manage your inventory, orders and store analytics.'
                : 'Register your store and start selling to verified customers.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              padding: '3px',
              marginBottom: '1.75rem',
            }}
          >
            <button
              type="button"
              onClick={() => switchMode('signin')}
              style={{
                flex: 1,
                padding: '0.625rem 0.5rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s ease',
                backgroundColor: mode === 'signin' ? '#04DB7E' : 'transparent',
                color: mode === 'signin' ? '#050505' : 'var(--color-text-secondary)',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              style={{
                flex: 1,
                padding: '0.625rem 0.5rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s ease',
                backgroundColor: mode === 'signup' ? '#04DB7E' : 'transparent',
                color: mode === 'signup' ? '#050505' : 'var(--color-text-secondary)',
              }}
            >
              Register Store
            </button>
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
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-In Button */}
          <div style={{ marginBottom: '1.5rem' }}>
            <GoogleSignInButton
              portalRole="SELLER"
              buttonText={mode === 'signin' ? 'Sign in with Google' : 'Register Store with Google'}
              onCredentialReceived={handleGoogleCredential}
              disabled={loading}
            />
          </div>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem',
              color: 'var(--color-text-muted)',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
            <span>or continue with email</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
          </div>

          {/* Sign In Form */}
          {mode === 'signin' ? (
            <form onSubmit={handleSignInSubmit}>
              <div style={{ marginBottom: '1.125rem' }}>
                <label
                  htmlFor="seller-email"
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    marginBottom: '0.4rem',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Seller Account Email
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
                    id="seller-email"
                    type="email"
                    required
                    value={signInData.email}
                    onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                    placeholder="merchant@example.com"
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

              <div style={{ marginBottom: '1.25rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.4rem',
                  }}
                >
                  <label
                    htmlFor="seller-password"
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    Password
                  </label>
                  <Link
                    to={ROUTES.FORGOT_PASSWORD}
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
                    id="seller-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={signInData.password}
                    onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                    placeholder="••••••••"
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
                  letterSpacing: '0.03em',
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
                {loading ? <Loader2 size={18} className="spin" /> : null}
                <span>{loading ? 'Signing In...' : 'Sign In as Seller'}</span>
              </button>
            </form>
          ) : (
            /* Register Store Form */
            <form onSubmit={handleSignUpSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.125rem' }}>
                <div>
                  <label
                    htmlFor="seller-fname"
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      marginBottom: '0.4rem',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    First Name
                  </label>
                  <input
                    id="seller-fname"
                    type="text"
                    required
                    value={signUpData.firstName}
                    onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                    placeholder="Raja"
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.875rem',
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
                <div>
                  <label
                    htmlFor="seller-lname"
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      marginBottom: '0.4rem',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    Last Name
                  </label>
                  <input
                    id="seller-lname"
                    type="text"
                    required
                    value={signUpData.lastName}
                    onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                    placeholder="Reddy"
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.875rem',
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

              <div style={{ marginBottom: '1.125rem' }}>
                <label
                  htmlFor="seller-store-name"
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    marginBottom: '0.4rem',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Store / Business Name
                </label>
                <div style={{ position: 'relative' }}>
                  <Building
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
                    id="seller-store-name"
                    type="text"
                    required
                    value={signUpData.storeName}
                    onChange={(e) => setSignUpData({ ...signUpData, storeName: e.target.value })}
                    placeholder="e.g. Reddy Electronics & Gadgets"
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

              <div style={{ marginBottom: '1.125rem' }}>
                <label
                  htmlFor="seller-signup-email"
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    marginBottom: '0.4rem',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Business Email
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
                    id="seller-signup-email"
                    type="email"
                    required
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    placeholder="merchant@example.com"
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

              <div style={{ marginBottom: '1.125rem' }}>
                <label
                  htmlFor="seller-signup-password"
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    marginBottom: '0.4rem',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Password (min 8 characters)
                </label>
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
                    id="seller-signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    placeholder="••••••••"
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

              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  htmlFor="seller-signup-confirm-password"
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    marginBottom: '0.4rem',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Confirm Password
                </label>
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
                    id="seller-signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={signUpData.confirmPassword}
                    onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
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
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Compliance Notice */}
              <div
                style={{
                  padding: '0.75rem 0.875rem',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-primary-subtle)',
                  border: '1px solid rgba(4, 219, 126, 0.25)',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                }}
              >
                <ShieldCheck size={16} color="#04DB7E" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-primary)', lineHeight: 1.4, margin: 0 }}>
                  Seller accounts undergo compliance verification before store activation.
                </p>
              </div>

              {/* Terms Checkbox */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input
                  id="agreeSellerTerms"
                  type="checkbox"
                  checked={signUpData.agreeTerms}
                  onChange={(e) => setSignUpData({ ...signUpData, agreeTerms: e.target.checked })}
                  style={{ accentColor: '#04DB7E', marginTop: '3px' }}
                />
                <label htmlFor="agreeSellerTerms" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  I agree to SHOPIVO's Merchant Terms, Fee Policy, and Privacy Agreement.
                </label>
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
                  letterSpacing: '0.03em',
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
                {loading ? <Loader2 size={18} className="spin" /> : null}
                <span>{loading ? 'Registering Store...' : 'Create Seller Account'}</span>
              </button>
            </form>
          )}

          {/* Quick Switch Link at Bottom */}
          <div
            style={{
              marginTop: '1.75rem',
              textAlign: 'center',
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            {mode === 'signin' ? (
              <span>
                Want to sell on SHOPIVO?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: '#04DB7E',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Register your store
                </button>
              </span>
            ) : (
              <span>
                Already a registered seller?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: '#04DB7E',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Sign in to your store
                </button>
              </span>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

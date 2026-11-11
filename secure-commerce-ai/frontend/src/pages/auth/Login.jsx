/**
 * Login.jsx — Premium Customer Login Experience
 * 
 * Features:
 * - Clean, modern, accessible design tokens with Light/Dark theme support
 * - Polish input fields with inline icons and focus transitions
 * - Password visibility toggle
 * - Smooth entrance animations & semantic error banners
 * - Strict schema validation with React Hook Form + Zod
 * - Preserves existing auth flow, Redux dispatch, and redirection logic
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, AlertCircle } from 'lucide-react'
import { login } from '@/store/authSlice'
import authService from '@/services/authService'
import { ROUTES } from '@/constants/routes'

// ─── Zod Validation Schema ────────────────────────────────────
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
})

// ─── Role → Dashboard Map ────────────────────────────────────
const ROLE_DASHBOARD = {
  CUSTOMER: ROUTES.CUSTOMER_DASHBOARD,
  SELLER: ROUTES.SELLER_DASHBOARD,
  ADMIN: ROUTES.ADMIN_DASHBOARD,
}

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()

  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data) => {
    setApiError(null)
    setIsLoading(true)

    try {
      const authData = await authService.login(data)

      dispatch(
        login({
          token: authData.accessToken,
          user: authData.user,
          role: authData.user.role,
        })
      )

      const from = location.state?.from?.pathname
      let destination = ROLE_DASHBOARD[authData.user.role] || ROUTES.CUSTOMER_DASHBOARD

      if (from && from !== ROUTES.UNAUTHORIZED && from !== '/forbidden' && from !== ROUTES.LOGIN && from !== ROUTES.REGISTER) {
        const userRole = authData.user.role
        const isCompatible =
          (userRole === 'ADMIN' && from.startsWith('/admin')) ||
          (userRole === 'SELLER' && from.startsWith('/seller')) ||
          (userRole === 'CUSTOMER' && !from.startsWith('/admin') && !from.startsWith('/seller'))

        if (isCompatible) {
          destination = from
        }
      }

      navigate(destination, { replace: true })
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'Unable to sign in. Please check your email and password.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fade-in">
      {/* Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.02em',
          marginBottom: '0.375rem',
        }}>
          Welcome back
        </h1>
        <p style={{
          color: 'var(--color-text-secondary)',
          fontSize: '0.875rem',
          lineHeight: '1.4',
        }}>
          Sign in to continue to your account
        </p>
      </div>

      {/* Semantic Error Alert */}
      {apiError && (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
            backgroundColor: 'var(--color-danger-subtle)',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 0.875rem',
            color: 'var(--color-danger)',
            fontSize: '0.8125rem',
            marginBottom: '1.25rem',
            lineHeight: '1.4',
            animation: 'fadeIn 0.2s ease-out forwards',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{apiError}</span>
          </div>
          {apiError.includes('registered with Google') && (
            <div style={{ marginTop: '0.25rem' }}>
              <Link
                to={ROUTES.CUSTOMER_AUTH}
                className="btn btn-primary"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  fontSize: '0.8125rem',
                  padding: '0.45rem 0.85rem',
                  textDecoration: 'none',
                }}
              >
                Continue with Google Sign-In
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Email Field */}
        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Email address
          </label>
          <div className="auth-input-wrapper">
            <Mail size={16} className="input-icon-left" />
            <input
              id="email"
              type="email"
              className={`input ${errors.email ? 'input-error' : ''}`}
              placeholder="name@example.com"
              autoComplete="email"
              disabled={isLoading}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="form-error">
              <AlertCircle size={13} />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="form-group">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.375rem',
          }}>
            <label className="form-label" htmlFor="password" style={{ margin: 0 }}>
              Password
            </label>
            <Link
              to={ROUTES.FORGOT_PASSWORD}
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-primary)',
                fontWeight: '500',
                textDecoration: 'none',
              }}
              tabIndex={0}
            >
              Forgot password?
            </Link>
          </div>
          <div className="auth-input-wrapper">
            <Lock size={16} className="input-icon-left" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className={`input ${errors.password ? 'input-error' : ''}`}
              placeholder="••••••••••••"
              autoComplete="current-password"
              disabled={isLoading}
              style={{ paddingRight: '2.5rem' }}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="form-error">
              <AlertCircle size={13} />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit Primary CTA */}
        <button
          type="submit"
          className="auth-btn-primary"
          disabled={isLoading}
          style={{ marginTop: '0.5rem' }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="spin" />
              <span>Signing in…</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Register Navigation */}
      <div style={{
        textAlign: 'center',
        marginTop: '1.5rem',
        paddingTop: '1.25rem',
        borderTop: '1px solid var(--color-border)',
        fontSize: '0.875rem',
        color: 'var(--color-text-secondary)',
      }}>
        <span>Don't have an account? </span>
        <Link
          to={ROUTES.REGISTER}
          style={{
            color: 'var(--color-primary)',
            fontWeight: '600',
            textDecoration: 'none',
          }}
        >
          Create one
        </Link>
      </div>
    </div>
  )
}

export default Login

/**
 * Register.jsx — Real Registration Form
 *
 * FIELDS:
 *   firstName, lastName → greeting + display in Navbar
 *   email               → unique, validated format
 *   password            → min 8 chars, at least one number or special char
 *   confirmPassword     → must match password (Zod .refine())
 *   role                → CUSTOMER or SELLER (not ADMIN — admins are created by admins)
 *
 * ZOD REFINEMENT:
 *   .refine() adds cross-field validation — checking confirmPassword matches
 *   password requires reading two fields at once, which basic field rules can't do.
 *   path: ['confirmPassword'] ensures the error appears on the right field.
 *
 * LAYOUT:
 *   firstName + lastName on one row (side by side on wider cards).
 *   Role select with visual explanation of each role's meaning.
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react'
import { login } from '@/store/authSlice'
import authService from '@/services/authService'
import { ROUTES } from '@/constants/routes'

// ─── Validation Schema ────────────────────────────────────────
const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName:  z.string().min(1, 'Last name is required').max(50),
  email:     z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password:  z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[0-9!@#$%^&*]/, 'Password must contain at least one number or special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: z.enum(['CUSTOMER', 'SELLER'], { message: 'Please select a role' }),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],  // Error appears on the confirmPassword field
  }
)

const ROLE_DASHBOARD = {
  CUSTOMER: ROUTES.CUSTOMER_DASHBOARD,
  SELLER: ROUTES.SELLER_DASHBOARD,
}

const Register = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [showPassword, setShowPassword]     = useState(false)
  const [showConfirm, setShowConfirm]       = useState(false)
  const [apiError, setApiError]             = useState(null)
  const [isLoading, setIsLoading]           = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema), defaultValues: { role: 'CUSTOMER' } })

  const onSubmit = async (data) => {
    setApiError(null)
    setIsLoading(true)

    // Don't send confirmPassword to the backend
    const { confirmPassword: _, ...payload } = data

    try {
      const authData = await authService.register(payload)

      dispatch(login({
        token: authData.accessToken,
        user: authData.user,
        role: authData.user.role,
      }))

      navigate(ROLE_DASHBOARD[authData.user.role] || ROUTES.CUSTOMER_DASHBOARD, { replace: true })

    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
          Create your account
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Join Shopivo — A New Era of Shopping
        </p>
      </div>

      {apiError && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
          color: 'var(--color-danger)', fontSize: '0.875rem', marginBottom: '1.25rem',
        }}>
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>

        {/* First + Last name row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="firstName">First name</label>
            <input id="firstName" type="text" className={`input ${errors.firstName ? 'input-error' : ''}`}
              placeholder="Jane" autoComplete="given-name" {...register('firstName')} />
            {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="lastName">Last name</label>
            <input id="lastName" type="text" className={`input ${errors.lastName ? 'input-error' : ''}`}
              placeholder="Smith" autoComplete="family-name" {...register('lastName')} />
            {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
          </div>
        </div>

        {/* Email */}
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email address</label>
          <input id="email" type="email" className={`input ${errors.email ? 'input-error' : ''}`}
            placeholder="you@example.com" autoComplete="email" {...register('email')} />
          {errors.email && <p className="form-error">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="form-group">
          <label className="form-label" htmlFor="password">Password</label>
          <div style={{ position: 'relative' }}>
            <input id="password" type={showPassword ? 'text' : 'password'}
              className={`input ${errors.password ? 'input-error' : ''}`}
              placeholder="Min. 8 characters" autoComplete="new-password"
              style={{ paddingRight: '2.75rem' }} {...register('password')} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-disabled)', padding: '0.25rem' }}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="form-error">{errors.password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div className="form-group">
          <label className="form-label" htmlFor="confirmPassword">Confirm password</label>
          <div style={{ position: 'relative' }}>
            <input id="confirmPassword" type={showConfirm ? 'text' : 'password'}
              className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
              placeholder="Repeat your password" autoComplete="new-password"
              style={{ paddingRight: '2.75rem' }} {...register('confirmPassword')} />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-disabled)', padding: '0.25rem' }}>
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
        </div>

        {/* Role */}
        <div className="form-group">
          <label className="form-label" htmlFor="role">I want to</label>
          <select id="role" className={`input ${errors.role ? 'input-error' : ''}`} {...register('role')}>
            <option value="CUSTOMER">Shop as a Customer</option>
            <option value="SELLER">Sell as a Merchant</option>
          </select>
          {errors.role && <p className="form-error">{errors.role.message}</p>}
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-disabled)', marginTop: '0.375rem' }}>
            {watch('role') === 'SELLER'
              ? '🏪 As a Seller, you can list products and manage your store.'
              : '🛍️ As a Customer, you can browse and purchase products.'}
          </p>
        </div>

        {/* Submit */}
        <button type="submit" className="btn btn-primary"
          disabled={isLoading}
          style={{ width: '100%', marginTop: '0.25rem', gap: '0.5rem' }}>
          {isLoading ? (
            <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating account…</>
          ) : (
            <><UserPlus size={16} /> Create Account</>
          )}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} style={{ color: 'var(--color-primary-light)', fontWeight: '600', textDecoration: 'none' }}>
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default Register

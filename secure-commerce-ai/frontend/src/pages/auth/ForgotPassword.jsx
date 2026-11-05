/**
 * ForgotPassword.jsx
 * Route: /auth/...
 * Layout: AuthLayout
 *
 * STATUS: Placeholder — will be implemented in its dedicated module phase.
 * DESCRIPTION: Enter your email and we'll send you a reset link.
 */

import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ROUTES } from '@/constants/routes'

const ForgotPassword = () => {
  return (
    <div className="fade-in">
      <h1 style={{
        fontSize: '1.75rem', fontWeight: '700',
        color: 'var(--color-text-primary)', marginBottom: '0.5rem',
      }}>
        Forgot Password
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
        Enter your email and we'll send you a reset link.
      </p>
      <div className="card" style={{ maxWidth: '480px' }}>
        <p style={{ color: 'var(--color-text-disabled)', fontSize: '0.875rem' }}>
          🚧 This page will be implemented in the <strong style={{ color: 'var(--color-primary-light)' }}>auth</strong> module phase.
          The layout, navigation, and routing are fully wired.
        </p>
        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
          <Link
            to={ROUTES.LOGIN}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--color-primary)',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '0.875rem',
            }}
          >
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword

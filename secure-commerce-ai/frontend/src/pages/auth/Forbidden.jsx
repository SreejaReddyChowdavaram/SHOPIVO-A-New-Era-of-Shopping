import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ShieldX, ArrowLeft, LogOut, LayoutDashboard, LogIn } from 'lucide-react'
import { selectCurrentUser, selectIsAuthenticated, logout } from '@/store/authSlice'
import { ROUTES } from '@/constants/routes'

const ROLE_DASHBOARD = {
  CUSTOMER: ROUTES.CUSTOMER_DASHBOARD,
  SELLER: ROUTES.SELLER_DASHBOARD,
  ADMIN: ROUTES.ADMIN_DASHBOARD,
}

/**
 * Forbidden.jsx — 403 Authorization Error Page
 *
 * Shown when an authenticated user tries to access a route they don't
 * have the correct role for (e.g., CUSTOMER accessing /admin/*).
 */
const Forbidden = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const currentUser = useSelector(selectCurrentUser)

  const handleLogoutAndLogin = () => {
    dispatch(logout())
    navigate(ROUTES.LOGIN, { replace: true })
  }

  const handleGoDashboard = () => {
    const target = (currentUser?.role && ROLE_DASHBOARD[currentUser.role]) || ROUTES.HOME
    navigate(target, { replace: true })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)',
        padding: '2rem',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '460px', width: '100%' }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}
        >
          <ShieldX size={36} color="var(--color-danger)" strokeWidth={1.5} />
        </div>

        <h1
          style={{
            fontSize: '4.5rem',
            fontWeight: '800',
            lineHeight: 1,
            color: 'var(--color-danger)',
            marginBottom: '0.5rem',
          }}
        >
          403
        </h1>

        <h2
          style={{
            fontSize: '1.35rem',
            fontWeight: '700',
            marginBottom: '0.75rem',
            color: 'var(--color-text-primary)',
          }}
        >
          Access Denied
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6, fontSize: '0.9rem' }}>
          You don't have the required role privileges to access this administrative portal.
        </p>

        {isAuthenticated && currentUser && (
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              marginBottom: '1.5rem',
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Currently signed in as:</span>
              <span
                style={{
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--color-danger)',
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                }}
              >
                {currentUser.role}
              </span>
            </div>
            <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', marginTop: '4px', wordBreak: 'break-all' }}>
              {currentUser.email}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {isAuthenticated ? (
            <>
              <button
                className="btn btn-primary"
                onClick={handleGoDashboard}
                style={{ width: '100%', justifyContent: 'center', gap: '0.5rem', padding: '0.625rem' }}
              >
                <LayoutDashboard size={16} />
                Go to My Dashboard ({currentUser?.role})
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleLogoutAndLogin}
                style={{ width: '100%', justifyContent: 'center', gap: '0.5rem', padding: '0.625rem', color: 'var(--color-danger)' }}
              >
                <LogOut size={16} />
                Sign Out &amp; Switch Account
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => navigate(ROUTES.LOGIN, { replace: true })}
              style={{ width: '100%', justifyContent: 'center', gap: '0.5rem', padding: '0.625rem' }}
            >
              <LogIn size={16} />
              Sign In with an Authorized Account
            </button>
          )}

          <button
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
            style={{ width: '100%', justifyContent: 'center', gap: '0.5rem', padding: '0.625rem' }}
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}

export default Forbidden

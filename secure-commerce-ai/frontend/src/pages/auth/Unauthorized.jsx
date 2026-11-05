/**
 * Unauthorized.jsx
 * Route: /auth/...
 * Layout: AuthLayout
 *
 * STATUS: Placeholder — will be implemented in its dedicated module phase.
 * DESCRIPTION: You do not have permission to view this page.
 */

const Unauthorized = () => {
  return (
    <div className="fade-in">
      <h1 style={{
        fontSize: '1.75rem', fontWeight: '700',
        color: 'var(--color-text-primary)', marginBottom: '0.5rem',
      }}>
        Access Denied
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
        You do not have permission to view this page.
      </p>
      <div className="card" style={{ maxWidth: '480px' }}>
        <p style={{ color: 'var(--color-text-disabled)', fontSize: '0.875rem' }}>
          🚧 This page will be implemented in the <strong style={{ color: 'var(--color-primary-light)' }}>auth</strong> module phase.
          The layout, navigation, and routing are fully wired.
        </p>
      </div>
    </div>
  )
}

export default Unauthorized

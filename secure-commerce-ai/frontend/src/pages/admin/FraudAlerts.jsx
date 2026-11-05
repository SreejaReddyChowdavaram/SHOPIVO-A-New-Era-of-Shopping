/**
 * FraudAlerts.jsx
 * Route: /admin/...
 * Layout: AdminLayout
 *
 * STATUS: Placeholder — will be implemented in its dedicated module phase.
 * DESCRIPTION: [Semester 2] Real-time fraud alerts powered by CSGAD.
 */

const FraudAlerts = () => {
  return (
    <div className="fade-in">
      <span className="badge badge-info" style={{ fontSize: '0.7rem', marginBottom: '1rem', display: 'inline-flex' }}>Semester 2 — Not Yet Implemented</span>
      <h1 style={{
        fontSize: '1.75rem', fontWeight: '700',
        color: 'var(--color-text-primary)', marginBottom: '0.5rem',
      }}>
        Fraud Alerts
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
        [Semester 2] Real-time fraud alerts powered by CSGAD.
      </p>
      <div className="card" style={{ maxWidth: '480px' }}>
        <p style={{ color: 'var(--color-text-disabled)', fontSize: '0.875rem' }}>
          🚧 This page will be implemented in the <strong style={{ color: 'var(--color-primary-light)' }}>admin</strong> module phase.
          The layout, navigation, and routing are fully wired.
        </p>
      </div>
    </div>
  )
}

export default FraudAlerts

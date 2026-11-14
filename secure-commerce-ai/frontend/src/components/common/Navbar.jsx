/**
 * Navbar.jsx — Universal Marketplace Top Navigation Bar
 */

const Navbar = ({ logo, location, center, actions, borderless = false, flush = false }) => {
  return (
    <header
      style={{
        height: 'var(--header-height, 64px)',
        backgroundColor: 'var(--color-header, var(--color-surface))',
        borderBottom: borderless ? 'none' : '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: flush ? '0 1.5rem 0 0' : '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-xs)',
        gap: flush ? '0.75rem' : '1.25rem',
        transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
      }}
    >
      {/* Left — Brand / Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: flush ? 0 : '1.25rem', flexShrink: 0 }}>
        {logo}
        {location && <div className="navbar-location-widget">{location}</div>}
      </div>

      {/* Center — Prominent Search Bar */}
      {center && (
        <div style={{ flex: 1, maxWidth: '640px', margin: '0 auto' }}>
          {center}
        </div>
      )}

      {/* Right — Actions / Account / Cart */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        {actions}
      </div>
    </header>
  )
}

export default Navbar

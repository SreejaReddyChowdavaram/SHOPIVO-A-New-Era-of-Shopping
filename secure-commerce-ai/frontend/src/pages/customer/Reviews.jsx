/**
 * Reviews.jsx — Customer Product Reviews (Light Marketplace Style)
 */

import { Star } from 'lucide-react'

const CustomerReviews = () => {
  return (
    <div className="fade-in">
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          marginBottom: '1rem',
          boxShadow: 'var(--shadow-sm)',
          transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
        }}
      >
        <h1 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
          My Reviews &amp; Ratings
        </h1>
      </div>

      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          padding: '3rem 1.5rem',
          textAlign: 'center',
          transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
        }}
      >
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-warning-subtle)', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <Star size={24} />
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.25rem', color: 'var(--color-text-primary)' }}>No Reviews Submitted</h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', maxWidth: '440px', margin: '0 auto' }}>
          Once your orders are delivered, you can rate items and share feedback with other customers.
        </p>
      </div>
    </div>
  )
}

export default CustomerReviews

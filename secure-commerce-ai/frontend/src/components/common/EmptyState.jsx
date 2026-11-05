/**
 * EmptyState.jsx — Standardized Empty State Component
 */

import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionLink,
  onAction,
  actionIcon: ActionIcon = ArrowRight,
}) => {
  return (
    <div
      className="card fade-in"
      style={{
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        margin: '0 auto',
        maxWidth: '560px',
        width: '100%',
        transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
      }}
    >
      {Icon && (
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-subtle)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}
        >
          <Icon size={28} />
        </div>
      )}

      <h3
        style={{
          fontSize: '1.125rem',
          fontWeight: '700',
          color: 'var(--color-text-primary)',
          marginBottom: '0.4rem',
        }}
      >
        {title}
      </h3>

      {description && (
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
            maxWidth: '380px',
            lineHeight: 1.5,
            marginBottom: actionLabel ? '1.5rem' : 0,
          }}
        >
          {description}
        </p>
      )}

      {actionLabel && actionLink && (
        <Link to={actionLink} className="btn btn-primary" style={{ gap: '0.5rem' }}>
          <span>{actionLabel}</span>
          <ActionIcon size={15} />
        </Link>
      )}

      {actionLabel && onAction && !actionLink && (
        <button onClick={onAction} className="btn btn-primary" style={{ gap: '0.5rem' }}>
          <span>{actionLabel}</span>
          <ActionIcon size={15} />
        </button>
      )}
    </div>
  )
}

export default EmptyState

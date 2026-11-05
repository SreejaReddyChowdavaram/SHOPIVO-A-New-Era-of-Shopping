/**
 * StatusBadge.jsx — Standardized Semantic Status Badge
 * Supports Order, Payment, Return, and Refund lifecycle statuses with consistent styling.
 */

const STATUS_CONFIGS = {
  // Order statuses
  PENDING:    { label: 'Pending',    variant: 'warning' },
  CONFIRMED:  { label: 'Confirmed',  variant: 'success' },
  PROCESSING: { label: 'Processing', variant: 'warning' },
  SHIPPED:    { label: 'Shipped',    variant: 'info' },
  DELIVERED:  { label: 'Delivered',  variant: 'success' },
  CANCELLED:  { label: 'Cancelled',  variant: 'danger' },

  // Payment statuses
  INITIATED:  { label: 'Initiated',  variant: 'info' },
  SUCCESS:    { label: 'Success',    variant: 'success' },
  FAILED:     { label: 'Failed',     variant: 'danger' },
  REFUNDED:   { label: 'Refunded',   variant: 'info' },

  // Return statuses
  REQUESTED:  { label: 'Requested',  variant: 'warning' },
  APPROVED:   { label: 'Approved',   variant: 'info' },
  REJECTED:   { label: 'Rejected',   variant: 'danger' },
  COMPLETED:  { label: 'Completed',  variant: 'success' },
}

const StatusBadge = ({ status, size = 'normal' }) => {
  if (!status) return null

  const normalizedKey = String(status).toUpperCase()
  const config = STATUS_CONFIGS[normalizedKey] || { label: status, variant: 'info' }

  return (
    <span className={`badge badge-${config.variant}`} style={{ fontSize: size === 'small' ? '0.7rem' : '0.75rem' }}>
      {config.label}
    </span>
  )
}

export default StatusBadge

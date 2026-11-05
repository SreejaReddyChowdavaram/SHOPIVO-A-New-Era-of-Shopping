/**
 * Notifications.jsx — Customer Notification Center (Phase C9)
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCircle2,
  Package,
  PackageCheck,
  Truck,
  CreditCard,
  AlertCircle,
  XCircle,
  RotateCcw,
  RefreshCw,
  CheckCheck,
  Check,
  ArrowRight,
  RefreshCw as SpinnerIcon,
  Inbox,
} from 'lucide-react'
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '@/services/notificationService'
import { ROUTES } from '@/constants/routes'

// Map NotificationType to icon & theme colors
const getNotificationMeta = (type) => {
  switch (type) {
    case 'ORDER_PLACED':
      return {
        icon: Package,
        color: '#2563eb',
        bg: '#eff6ff',
        label: 'Order Placed',
      }
    case 'ORDER_CONFIRMED':
      return {
        icon: CheckCircle2,
        color: '#059669',
        bg: '#ecfdf5',
        label: 'Order Confirmed',
      }
    case 'ORDER_SHIPPED':
      return {
        icon: Truck,
        color: '#0284c7',
        bg: '#f0f9ff',
        label: 'Shipped',
      }
    case 'ORDER_DELIVERED':
      return {
        icon: PackageCheck,
        color: '#16a34a',
        bg: '#f0fdf4',
        label: 'Delivered',
      }
    case 'ORDER_CANCELLED':
      return {
        icon: XCircle,
        color: '#dc2626',
        bg: '#fef2f2',
        label: 'Cancelled',
      }
    case 'PAYMENT_SUCCESS':
      return {
        icon: CreditCard,
        color: '#059669',
        bg: '#ecfdf5',
        label: 'Payment Success',
      }
    case 'PAYMENT_FAILED':
      return {
        icon: AlertCircle,
        color: '#dc2626',
        bg: '#fef2f2',
        label: 'Payment Failed',
      }
    case 'RETURN_REQUESTED':
      return {
        icon: RotateCcw,
        color: '#d97706',
        bg: '#fffbeb',
        label: 'Return Requested',
      }
    case 'RETURN_APPROVED':
      return {
        icon: CheckCircle2,
        color: '#059669',
        bg: '#ecfdf5',
        label: 'Return Approved',
      }
    case 'RETURN_REJECTED':
      return {
        icon: XCircle,
        color: '#dc2626',
        bg: '#fef2f2',
        label: 'Return Rejected',
      }
    case 'RETURN_COMPLETED':
      return {
        icon: CheckCheck,
        color: '#059669',
        bg: '#ecfdf5',
        label: 'Return Completed',
      }
    case 'REFUND_SUCCESS':
      return {
        icon: RefreshCw,
        color: '#7c3aed',
        bg: '#f5f3ff',
        label: 'Refund Processed',
      }
    default:
      return {
        icon: Bell,
        color: '#4b5563',
        bg: '#f3f4f6',
        label: 'Notification',
      }
  }
}

const formatTimestamp = (isoDate) => {
  if (!isoDate) return ''
  try {
    const d = new Date(isoDate)
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoDate
  }
}

const CustomerNotifications = () => {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('ALL') // 'ALL' | 'UNREAD'
  const [markingAll, setMarkingAll] = useState(false)

  const fetchNotifications = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getNotifications()
      setNotifications(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const handleMarkAsRead = async (item) => {
    if (!item.read) {
      try {
        await markAsRead(item.id)
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
        )
      } catch (err) {
        console.error('Failed to mark read', err)
      }
    }

    // Navigate to reference if available
    if (item.referenceType === 'ORDER' && item.referenceId) {
      navigate(`/customer/orders/${item.referenceId}`)
    } else if (item.referenceType === 'RETURN') {
      navigate(ROUTES.CUSTOMER_RETURNS)
    } else if (item.referenceType === 'REFUND') {
      navigate(ROUTES.CUSTOMER_REFUNDS)
    } else if (item.referenceType === 'PAYMENT') {
      navigate(ROUTES.CUSTOMER_PAYMENTS)
    }
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await markAllAsRead()
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() }))
      )
    } catch (err) {
      console.error('Failed to mark all read', err)
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length
  const displayedNotifications =
    activeTab === 'UNREAD' ? notifications.filter((n) => !n.read) : notifications

  return (
    <div className="fade-in">
      {/* ── Top Header Card ── */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1
              style={{
                fontSize: '1.25rem',
                fontWeight: '800',
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              Notification Center
            </h1>
            {unreadCount > 0 && (
              <span
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '12px',
                }}
              >
                {unreadCount} new
              </span>
            )}
          </div>
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              margin: '0.25rem 0 0',
            }}
          >
            Real-time updates on your orders, payments, returns, and refunds.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.8125rem',
              padding: '0.5rem 0.9rem',
            }}
          >
            <Check size={15} color="var(--color-primary)" />
            <span>{markingAll ? 'Marking...' : 'Mark all as read'}</span>
          </button>
        )}
      </div>

      {/* ── Tabs Filter ── */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1rem',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '0.5rem',
        }}
      >
        <button
          onClick={() => setActiveTab('ALL')}
          style={{
            padding: '0.45rem 0.9rem',
            border: 'none',
            background: 'none',
            fontSize: '0.8125rem',
            fontWeight: activeTab === 'ALL' ? '700' : '500',
            color: activeTab === 'ALL' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'ALL' ? '2px solid var(--color-primary)' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setActiveTab('UNREAD')}
          style={{
            padding: '0.45rem 0.9rem',
            border: 'none',
            background: 'none',
            fontSize: '0.8125rem',
            fontWeight: activeTab === 'UNREAD' ? '700' : '500',
            color: activeTab === 'UNREAD' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'UNREAD' ? '2px solid var(--color-primary)' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* ── Content States ── */}
      {loading ? (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '3rem 1.5rem',
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
          }}
        >
          <SpinnerIcon className="animate-spin" size={20} />
          <span>Loading notifications...</span>
        </div>
      ) : error ? (
        <div
          style={{
            backgroundColor: 'var(--color-danger-subtle)',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            textAlign: 'center',
          }}
        >
          <AlertCircle size={24} color="var(--color-danger)" style={{ margin: '0 auto 0.5rem' }} />
          <p style={{ color: 'var(--color-danger)', fontWeight: '600', margin: '0 0 0.75rem' }}>{error}</p>
          <button
            onClick={fetchNotifications}
            className="btn btn-secondary"
            style={{ fontSize: '0.8125rem', padding: '0.4rem 0.9rem' }}
          >
            Retry
          </button>
        </div>
      ) : displayedNotifications.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
            transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-surface-raised)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            <Inbox size={28} />
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: '0 0 0.35rem' }}>
            {activeTab === 'UNREAD' ? 'No unread notifications' : "You're all caught up!"}
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            {activeTab === 'UNREAD'
              ? 'All notifications have been marked as read.'
              : 'When updates happen on your orders or refunds, you will see them here.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {displayedNotifications.map((item) => {
            const meta = getNotificationMeta(item.type)
            const Icon = meta.icon
            const isUnread = !item.read

            return (
              <div
                key={item.id}
                onClick={() => handleMarkAsRead(item)}
                style={{
                  backgroundColor: isUnread ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
                  border: isUnread ? '1px solid var(--color-primary-light)' : '1px solid var(--color-border)',
                  borderLeft: isUnread ? '4px solid var(--color-primary)' : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'background-color var(--transition-fast), transform 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isUnread ? 'var(--color-primary-subtle)' : 'var(--color-surface)')}
              >
                {/* Type Icon Badge */}
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: meta.bg,
                    color: meta.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={19} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      gap: '0.5rem',
                      marginBottom: '0.25rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: isUnread ? '700' : '600',
                          color: 'var(--color-text-primary)',
                          margin: 0,
                        }}
                      >
                        {item.title}
                      </h3>
                      {isUnread && (
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-primary)',
                            display: 'inline-block',
                          }}
                          title="Unread"
                        />
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '0.725rem',
                        color: 'var(--color-text-disabled)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatTimestamp(item.createdAt)}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '0.8125rem',
                      color: isUnread ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      margin: '0 0 0.4rem',
                      lineHeight: '1.45',
                    }}
                  >
                    {item.message}
                  </p>

                  {/* Reference indicator / Action hint */}
                  {item.referenceType && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: 'var(--color-primary)',
                      }}
                    >
                      <span>View {item.referenceType.toLowerCase()} details</span>
                      <ArrowRight size={13} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CustomerNotifications

/**
 * Notifications.jsx — Admin Notification Center & System Alerts
 * Route: /admin/notifications
 * Layout: AdminLayout
 *
 * Dedicated admin notification center for platform alerts, order events,
 * seller verification submissions, and operational notices.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCircle2,
  Package,
  Truck,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  CheckCheck,
  Check,
  Inbox,
  ShieldCheck,
  Loader2,
  Calendar,
} from 'lucide-react'
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '@/services/notificationService'

const Notifications = () => {
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('ALL') // 'ALL' | 'UNREAD'
  const [actionLoading, setActionLoading] = useState(false)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getNotifications()
      setNotifications(data || [])
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load notifications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
    } catch (err) {
      // Failed silently
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true)
      await markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (err) {
      setError('Failed to mark all as read.')
    } finally {
      setActionLoading(false)
    }
  }

  const filtered = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.read
    return true
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  const formatDate = (isoString) => {
    if (!isoString) return '—'
    return new Date(isoString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                color: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={24} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
              Admin Notifications
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.925rem' }}>
            Operational system broadcasts, platform audit logs, and account lifecycle alerts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary"
            onClick={fetchNotifications}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          {unreadCount > 0 && (
            <button
              className="btn btn-primary"
              onClick={handleMarkAllAsRead}
              disabled={actionLoading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <CheckCheck size={16} />
              Mark All as Read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* ── Error Alert ── */}
      {error && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.9rem',
          }}
        >
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Filter Tabs ── */}
      <div className="card" style={{ padding: '0.75rem 1.25rem', display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => setFilter('ALL')}
          className={`btn ${filter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.8125rem', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-full)' }}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`btn ${filter === 'UNREAD' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.8125rem', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-full)' }}
        >
          Unread Only ({unreadCount})
        </button>
      </div>

      {/* ── Notifications List ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-disabled)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Loading notifications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <Inbox size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.35 }} />
            <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-text-primary)' }}>
              No notifications
            </p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--color-text-disabled)' }}>
              {filter === 'UNREAD' ? 'You have caught up with all notifications.' : 'No alerts have been recorded yet.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((n) => {
              const isUnread = !n.read

              return (
                <div
                  key={n.id}
                  style={{
                    padding: '1.25rem',
                    borderBottom: '1px solid var(--color-border)',
                    backgroundColor: isUnread ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isUnread) e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isUnread) e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isUnread ? 'rgba(59, 130, 246, 0.12)' : 'var(--color-surface-raised)',
                        color: isUnread ? 'var(--color-primary-light)' : 'var(--color-text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Bell size={18} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: isUnread ? '700' : '600', color: 'var(--color-text-primary)', fontSize: '0.925rem' }}>
                          {n.title || 'Platform Notice'}
                        </span>
                        {isUnread && (
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--color-primary-light)',
                              display: 'inline-block',
                            }}
                          />
                        )}
                      </div>

                      <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                        {n.message}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>
                        <Calendar size={12} />
                        <span>{formatDate(n.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {isUnread && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleMarkAsRead(n.id)}
                      title="Mark as Read"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Check size={14} />
                      <span>Read</span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications

/**
 * LoginHistory.jsx — Platform Authentication Audit and Security Telemetry
 * Route: /admin/login-history
 * Layout: AdminLayout
 */

import { useState, useEffect } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  RotateCcw,
  Clock,
  MapPin,
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  Filter,
} from 'lucide-react'
import {
  getAdminLoginEvents,
  getAdminLoginStats,
  cleanupAdminLoginEvents,
} from '@/services/loginActivityService'

const ROLE_OPTIONS = [
  { value: 'ALL', label: 'All Roles' },
  { value: 'CUSTOMER', label: 'Customers' },
  { value: 'SELLER', label: 'Sellers' },
  { value: 'ADMIN', label: 'Administrators' },
]

const RESULT_OPTIONS = [
  { value: 'ALL', label: 'All Results' },
  { value: 'SUCCESS', label: 'Success Only' },
  { value: 'FAILED', label: 'Failed Attempts' },
]

const METHOD_OPTIONS = [
  { value: 'ALL', label: 'All Auth Methods' },
  { value: 'PASSWORD', label: 'Password' },
  { value: 'GOOGLE_OAUTH', label: 'Google OAuth' },
]

const LoginHistory = () => {
  const [events, setEvents] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Pagination
  const [page, setPage] = useState(0)
  const [pageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  // Filters
  const [selectedRole, setSelectedRole] = useState('ALL')
  const [selectedResult, setSelectedResult] = useState('ALL')
  const [selectedMethod, setSelectedMethod] = useState('ALL')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Cleanup Modal
  const [cleanupModalOpen, setCleanupModalOpen] = useState(false)
  const [retentionDays, setRetentionDays] = useState(365)
  const [cleaningUp, setCleaningUp] = useState(false)
  const [cleanupResult, setCleanupResult] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [eventsRes, statsRes] = await Promise.all([
        getAdminLoginEvents({
          page,
          size: pageSize,
          role: selectedRole !== 'ALL' ? selectedRole : undefined,
          result: selectedResult !== 'ALL' ? selectedResult : undefined,
          authMethod: selectedMethod !== 'ALL' ? selectedMethod : undefined,
          search: searchQuery || undefined,
        }),
        getAdminLoginStats().catch(() => null),
      ])

      const totalP = eventsRes.page?.totalPages ?? eventsRes.totalPages ?? 1
      const totalE = eventsRes.page?.totalElements ?? eventsRes.totalElements ?? 0

      setEvents(eventsRes.content || [])
      setTotalPages(totalP)
      setTotalElements(totalE)
      if (statsRes) setStats(statsRes)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load authentication events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, selectedRole, selectedResult, selectedMethod, searchQuery])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(0)
    setSearchQuery(searchInput.trim())
  }

  const handleResetFilters = () => {
    setSelectedRole('ALL')
    setSelectedResult('ALL')
    setSelectedMethod('ALL')
    setSearchInput('')
    setSearchQuery('')
    setPage(0)
  }

  const handleExecuteCleanup = async () => {
    try {
      setCleaningUp(true)
      const res = await cleanupAdminLoginEvents(retentionDays)
      setCleanupResult(res.deletedCount ?? 0)
      setTimeout(() => {
        setCleanupModalOpen(false)
        setCleanupResult(null)
        fetchData()
      }, 1500)
    } catch (err) {
      alert('Failed to cleanup old records: ' + (err.response?.data?.message || err.message))
    } finally {
      setCleaningUp(false)
    }
  }

  const formatDateParts = (ts) => {
    if (!ts) return { date: '—', time: '' }
    const d = new Date(ts)
    const dateStr = d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    return { date: dateStr, time: timeStr }
  }

  const isLocalIp = (ip) => {
    if (!ip) return true
    const trimmed = ip.trim()
    return trimmed === '0:0:0:0:0:0:0:1' || trimmed === '::1' || trimmed === '127.0.0.1'
  }

  const formatIpAddress = (ip) => {
    if (!ip) return '127.0.0.1'
    const trimmed = ip.trim()
    if (trimmed === '0:0:0:0:0:0:0:1' || trimmed === '::1') {
      return '127.0.0.1'
    }
    return trimmed
  }

  const renderDeviceIcon = (deviceType) => {
    const d = (deviceType || '').toUpperCase()
    if (d === 'MOBILE') return <Smartphone size={14} className="text-muted" />
    if (d === 'TABLET') return <Tablet size={14} className="text-muted" />
    return <Laptop size={14} className="text-muted" />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] flex items-center gap-2">
              <ShieldCheck className="text-[var(--color-primary)]" size={28} />
              Login Activity & Audit Trail
            </h1>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Enterprise authentication telemetry, Render proxy IP resolution, and geolocation security logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCleanupModalOpen(true)}
            className="btn btn-secondary text-xs flex items-center gap-1.5 py-2 px-3 border border-red-500/30 text-red-400 hover:bg-red-500/10"
            title="Retention Purge"
          >
            <Trash2 size={14} />
            Data Retention
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="btn btn-secondary text-xs flex items-center gap-1.5 py-2 px-3"
            title="Refresh Logs"
          >
            <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-[var(--color-text-secondary)] text-xs font-medium">
              <span>SUCCESSFUL LOGINS</span>
              <CheckCircle2 size={16} className="text-[var(--color-primary)]" />
            </div>
            <div className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
              {stats.totalSuccessLogins?.toLocaleString() ?? 0}
            </div>
            <div className="text-[11px] text-[var(--color-primary)] mt-1 font-mono">
              Count incremented on authentications
            </div>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-[var(--color-text-secondary)] text-xs font-medium">
              <span>FAILED ATTEMPTS</span>
              <XCircle size={16} className="text-[var(--color-danger)]" />
            </div>
            <div className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
              {stats.totalFailedLogins?.toLocaleString() ?? 0}
            </div>
            <div className="text-[11px] text-[var(--color-danger)] mt-1 font-mono">
              Separate failure telemetry
            </div>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-[var(--color-text-secondary)] text-xs font-medium">
              <span>SUCCESS RATE</span>
              <ShieldCheck size={16} className="text-[var(--color-primary)]" />
            </div>
            <div className="mt-2 text-2xl font-bold text-[var(--color-primary)]">
              {stats.loginSuccessRate ?? 100}%
            </div>
            <div className="text-[11px] text-[var(--color-text-muted)] mt-1 font-mono">
              Platform authentication health
            </div>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-[var(--color-text-secondary)] text-xs font-medium">
              <span>REGISTERED USERS</span>
              <Globe size={16} className="text-[var(--color-info)]" />
            </div>
            <div className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
              {stats.totalUsers?.toLocaleString() ?? 0}
            </div>
            <div className="text-[11px] text-[var(--color-text-muted)] mt-1 font-mono">
              Across Customer, Seller & Admin
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by email, IP address, or city..."
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg pl-9 pr-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--color-primary)] text-white font-semibold text-sm rounded-lg hover:bg-[var(--color-primary-hover,#0B7A5B)] transition"
            >
              Filter
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value)
                setPage(0)
              }}
              className="bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-[var(--color-primary)]"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={selectedResult}
              onChange={(e) => {
                setSelectedResult(e.target.value)
                setPage(0)
              }}
              className="bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-[var(--color-primary)]"
            >
              {RESULT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={selectedMethod}
              onChange={(e) => {
                setSelectedMethod(e.target.value)
                setPage(0)
              }}
              className="bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-[var(--color-primary)]"
            >
              {METHOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {(selectedRole !== 'ALL' ||
              selectedResult !== 'ALL' ||
              selectedMethod !== 'ALL' ||
              searchQuery) && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-2 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1 border border-dashed border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary)]"
              >
                <RotateCcw size={12} />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[var(--color-text-secondary)]">
            <Loader2 size={32} className="animate-spin text-[var(--color-primary)] mb-2" />
            <p className="text-sm">Querying authentication telemetry...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400">
            <AlertTriangle size={32} className="mx-auto mb-2 text-rose-500" />
            <p className="font-semibold">{error}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center text-[var(--color-text-muted)]">
            <ShieldAlert size={36} className="mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-[var(--color-text-primary)]">No authentication events found</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Try modifying search criteria or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-b border-[var(--color-border)] uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">User & Role</th>
                  <th className="py-3.5 px-4">Auth Method</th>
                  <th className="py-3.5 px-4">Result</th>
                  <th className="py-3.5 px-4">IP & Network</th>
                  <th className="py-3.5 px-4">Approx. Location</th>
                  <th className="py-3.5 px-4">Device & OS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text-primary)]">
                {events.map((evt) => {
                  const isSuccess = evt.loginResult === 'SUCCESS'
                  const dateParts = formatDateParts(evt.loginTimestamp)
                  return (
                    <tr key={evt.id} className="hover:bg-[var(--color-surface-raised)] transition">
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-[var(--color-text-primary)] font-medium text-xs">
                          {dateParts.date}
                        </div>
                        <div className="text-[11px] font-mono text-[var(--color-text-muted)] mt-0.5">
                          {dateParts.time}
                        </div>
                      </td>

                      {/* User & Role */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-[var(--color-text-primary)] truncate max-w-[200px]" title={evt.userEmail}>
                          {evt.userEmail}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                              evt.userRole === 'ADMIN'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : evt.userRole === 'SELLER'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : evt.userRole === 'CUSTOMER'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                : 'bg-gray-500/10 text-gray-400 border border-gray-500/30'
                            }`}
                          >
                            {evt.userRole || 'UNKNOWN'}
                          </span>
                          {evt.userId && (
                            <span className="text-[10px] text-[var(--color-text-muted)] font-mono">
                              #{evt.userId}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Method */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)]">
                          <KeyRound size={11} className="text-[var(--color-primary)]" />
                          {evt.authMethod === 'GOOGLE_OAUTH' ? 'Google OAuth' : 'Password'}
                        </span>
                      </td>

                      {/* Result */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/25">
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                            Success
                          </span>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-danger)]/10 text-[var(--color-danger)] border border-[var(--color-danger)]/25">
                              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-danger)]" />
                              Failed
                            </span>
                            {evt.failureReason && (
                              <div className="text-[10px] text-rose-400/80 font-mono mt-0.5">
                                {evt.failureReason}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* IP */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-xs text-[var(--color-text-primary)]">{formatIpAddress(evt.ipAddress)}</div>
                        <div className="text-[10px] text-[var(--color-text-muted)] font-mono">
                          {isLocalIp(evt.ipAddress) ? 'IPV4 (LOCAL)' : (evt.ipVersion || 'IPV4')}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-[var(--color-text-primary)]">
                          <MapPin size={12} className="text-[var(--color-primary)] shrink-0" />
                          <span className="truncate max-w-[150px]">
                            {evt.locationStatus === 'LOCAL_DEV' || isLocalIp(evt.ipAddress)
                              ? 'Localhost / Development Environment'
                              : evt.city
                              ? `${evt.city}, ${evt.country || 'India'}`
                              : evt.country || 'Location unavailable'}
                          </span>
                        </div>
                        {evt.stateRegion && (
                          <div className="text-[10px] text-[var(--color-text-muted)] pl-4">
                            {evt.stateRegion}
                          </div>
                        )}
                      </td>

                      {/* Device & OS */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[var(--color-text-primary)]">
                          {renderDeviceIcon(evt.deviceType)}
                          <span>{evt.browser || 'Browser'}</span>
                        </div>
                        <div className="text-[10px] text-[var(--color-text-muted)] pl-5">
                          {evt.operatingSystem || 'OS'} • {evt.deviceType || 'Desktop'}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div className="bg-[var(--color-bg)] border-t border-[var(--color-border)] px-4 py-3 flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
            <div>
              Showing {page * pageSize + 1} to{' '}
              {Math.min((page + 1) * pageSize, totalElements)} of {totalElements} events
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 font-mono text-[var(--color-text-secondary)]">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Retention Cleanup Modal */}
      {cleanupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto my-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">Data Retention Policy</h3>
                <p className="text-xs text-[var(--color-text-secondary)]">Purge old login events older than threshold</p>
              </div>
            </div>

            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              In accordance with data retention regulations and storage hygiene, you can purge
              historical authentication records. User account metrics (such as total login count)
              will be preserved.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs text-[var(--color-text-secondary)]">Retention threshold (days):</label>
              <select
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs rounded-lg p-2.5 focus:outline-none focus:border-[var(--color-primary)]"
              >
                <option value={90}>Older than 90 days (3 months)</option>
                <option value={180}>Older than 180 days (6 months)</option>
                <option value={365}>Older than 365 days (1 year)</option>
                <option value={730}>Older than 730 days (2 years)</option>
              </select>
            </div>

            {cleanupResult !== null && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-[var(--color-primary)] font-medium text-center">
                Successfully purged {cleanupResult} old authentication records.
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCleanupModalOpen(false)}
                disabled={cleaningUp}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteCleanup}
                disabled={cleaningUp}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition"
              >
                {cleaningUp && <Loader2 size={12} className="animate-spin" />}
                Purge Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LoginHistory


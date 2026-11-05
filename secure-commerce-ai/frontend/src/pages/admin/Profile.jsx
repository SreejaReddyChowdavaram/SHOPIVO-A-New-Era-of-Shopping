/**
 * Profile.jsx — Administrator Profile & Governance Security
 * Route: /admin/profile
 * Layout: AdminLayout
 */

import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  User,
  Shield,
  Mail,
  Calendar,
  Key,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Save,
  X,
  Edit2,
  ShieldAlert,
  Server,
  Activity,
  FileText,
} from 'lucide-react'
import { selectCurrentUser, setUser } from '@/store/authSlice'
import { getProfile, updateProfile, changePassword } from '@/services/userService'

const AdminProfile = () => {
  const dispatch = useDispatch()
  const reduxUser = useSelector(selectCurrentUser)

  // Profile State
  const [userProfile, setUserProfile] = useState(reduxUser)
  const [profileLoading, setProfileLoading] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    firstName: reduxUser?.firstName || '',
    lastName: reduxUser?.lastName || '',
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(null)
  const [profileError, setProfileError] = useState(null)

  // Security / Password State
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(null)
  const [passwordError, setPasswordError] = useState(null)

  // Fetch Latest Profile on Mount
  useEffect(() => {
    setProfileLoading(true)
    getProfile()
      .then((data) => {
        setUserProfile(data)
        setProfileForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
        })
        dispatch(setUser(data))
      })
      .catch(() => {
        setUserProfile(reduxUser)
      })
      .finally(() => setProfileLoading(false))
  }, [dispatch, reduxUser])

  // Handle Profile Update Submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileError(null)
    setProfileSuccess(null)

    const trimmedFirst = profileForm.firstName.trim()
    const trimmedLast = profileForm.lastName.trim()

    if (!trimmedFirst) {
      setProfileError('First name is required.')
      return
    }
    if (!trimmedLast) {
      setProfileError('Last name is required.')
      return
    }

    setProfileSaving(true)
    try {
      const updated = await updateProfile({
        firstName: trimmedFirst,
        lastName: trimmedLast,
      })
      setUserProfile(updated)
      dispatch(setUser(updated))
      setIsEditingProfile(false)
      setProfileSuccess('Administrator profile updated successfully.')
      setTimeout(() => setProfileSuccess(null), 3500)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile.'
      setProfileError(msg)
    } finally {
      setProfileSaving(false)
    }
  }

  const handleProfileCancel = () => {
    setProfileForm({
      firstName: userProfile?.firstName || '',
      lastName: userProfile?.lastName || '',
    })
    setIsEditingProfile(false)
    setProfileError(null)
  }

  // Handle Password Change Submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (!passwordForm.currentPassword) {
      setPasswordError('Current password is required.')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError('New password cannot be the same as your current password.')
      return
    }

    setPasswordSaving(true)
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      })
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setIsChangingPassword(false)
      setPasswordSuccess('Administrator credentials updated securely.')
      setTimeout(() => setPasswordSuccess(null), 4000)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update password.'
      setPasswordError(msg)
    } finally {
      setPasswordSaving(false)
    }
  }

  const handlePasswordCancel = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setIsChangingPassword(false)
    setPasswordError(null)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Active'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return 'Active'
    }
  }

  const activeUser = userProfile || reduxUser
  const userInitial = (activeUser?.firstName?.[0] || activeUser?.email?.[0] || 'A').toUpperCase()
  const fullName = activeUser?.firstName
    ? `${activeUser.firstName} ${activeUser.lastName || ''}`.trim()
    : 'System Administrator'

  return (
    <div className="fade-in" style={{ paddingBottom: '2.5rem', maxWidth: '1000px' }}>
      {/* Header Card */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444, #f97316)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '1.5rem',
              fontWeight: '700',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
            }}
          >
            {userInitial}
          </div>
          <div>
            <h1
              style={{
                fontSize: '1.35rem',
                fontWeight: '800',
                color: 'var(--color-text-primary)',
                margin: '0 0 0.35rem 0',
              }}
            >
              {fullName}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Shield size={12} />
                SYSTEM ADMINISTRATOR
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ShieldCheck size={13} />
                Full Platform Authority
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                Administrator since {formatDate(activeUser?.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {profileSuccess && (
        <div
          className="fade-in"
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.875rem',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{profileSuccess}</span>
        </div>
      )}

      {profileError && (
        <div
          className="fade-in"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--color-error)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.875rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{profileError}</span>
        </div>
      )}

      {passwordSuccess && (
        <div
          className="fade-in"
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.875rem',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{passwordSuccess}</span>
        </div>
      )}

      {passwordError && (
        <div
          className="fade-in"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--color-error)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.875rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{passwordError}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Personal Details Card */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
            }}
          >
            <h2
              style={{
                fontSize: '1.05rem',
                fontWeight: '700',
                color: 'var(--color-text-primary)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <User size={18} style={{ color: '#ef4444' }} />
              Admin Profile Information
            </h2>

            {!isEditingProfile && (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="btn btn-secondary"
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8125rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Edit2 size={13} />
                Edit
              </button>
            )}
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleProfileSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      color: 'var(--color-text-secondary)',
                      marginBottom: '0.35rem',
                    }}
                  >
                    First Name <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      fontSize: '0.875rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-bg-primary, var(--color-surface))',
                      color: 'var(--color-text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      color: 'var(--color-text-secondary)',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Last Name <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      fontSize: '0.875rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-bg-primary, var(--color-surface))',
                      color: 'var(--color-text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      color: 'var(--color-text-secondary)',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={activeUser?.email || ''}
                    disabled
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      fontSize: '0.875rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-bg-subtle, rgba(0, 0, 0, 0.04))',
                      color: 'var(--color-text-disabled)',
                      cursor: 'not-allowed',
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)', marginTop: '0.25rem', display: 'block' }}>
                    Administrator email is bound to root system access and managed via core security policy.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="btn btn-primary"
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    {profileSaving ? <Loader2 size={15} className="spin" /> : <Save size={15} />}
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleProfileCancel}
                    disabled={profileSaving}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <X size={15} />
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.2rem' }}>
                  Admin Full Name
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                  {fullName}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.2rem' }}>
                  Root Email Address
                </span>
                <span
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    color: 'var(--color-text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Mail size={15} style={{ color: '#ef4444' }} />
                  {activeUser?.email}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.2rem' }}>
                  System Role
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    color: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  <Shield size={12} />
                  PLATFORM ADMINISTRATOR (ROLE_ADMIN)
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.2rem' }}>
                  Provisioned On
                </span>
                <span
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Calendar size={14} />
                  {formatDate(activeUser?.createdAt)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* System Access & Governance Card */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2
            style={{
              fontSize: '1.05rem',
              fontWeight: '700',
              color: 'var(--color-text-primary)',
              margin: '0 0 1.25rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Server size={18} style={{ color: 'var(--color-primary)' }} />
            Governance &amp; Elevated Privileges
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                fontSize: '0.8125rem',
                color: 'var(--color-text-primary)',
              }}
            >
              <CheckCircle2 size={16} style={{ color: '#10b981', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong>User &amp; Merchant Governance:</strong> Full permissions to inspect, verify, activate, and suspend customer and seller accounts.
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                fontSize: '0.8125rem',
                color: 'var(--color-text-primary)',
              }}
            >
              <CheckCircle2 size={16} style={{ color: '#10b981', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong>Catalog &amp; Product Moderation:</strong> Approve, reject, or archive seller product submissions.
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                fontSize: '0.8125rem',
                color: 'var(--color-text-primary)',
              }}
            >
              <CheckCircle2 size={16} style={{ color: '#10b981', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong>Order &amp; Payment Operations:</strong> Platform-level transaction audits, return authorizations, and dispute management.
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                fontSize: '0.8125rem',
                color: 'var(--color-text-primary)',
              }}
            >
              <CheckCircle2 size={16} style={{ color: '#10b981', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong>Platform Audit & Compliance:</strong> Real-time merchant verification, catalog governance, and transaction auditing.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Password Card */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
          marginTop: '1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
          }}
        >
          <h2
            style={{
              fontSize: '1.05rem',
              fontWeight: '700',
              color: 'var(--color-text-primary)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Lock size={18} style={{ color: '#ef4444' }} />
            Admin Credentials &amp; Security Policy
          </h2>

          {!isChangingPassword && (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="btn btn-secondary"
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.8125rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Key size={13} />
              Change Password
            </button>
          )}
        </div>

        {isChangingPassword ? (
          <form onSubmit={handlePasswordSubmit} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '0.35rem',
                  }}
                >
                  Current Admin Password <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.55rem 2.25rem 0.55rem 0.75rem',
                      fontSize: '0.875rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-bg-primary, var(--color-surface))',
                      color: 'var(--color-text-primary)',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.65rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '0.35rem',
                  }}
                >
                  New Admin Password <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.55rem 2.25rem 0.55rem 0.75rem',
                      fontSize: '0.875rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-bg-primary, var(--color-surface))',
                      color: 'var(--color-text-primary)',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.65rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                  Must be at least 8 characters with high entropy.
                </span>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '0.35rem',
                  }}
                >
                  Confirm New Password <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.55rem 2.25rem 0.55rem 0.75rem',
                      fontSize: '0.875rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-bg-primary, var(--color-surface))',
                      color: 'var(--color-text-primary)',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.65rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="btn btn-primary"
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  {passwordSaving ? <Loader2 size={15} className="spin" /> : <Save size={15} />}
                  Update Admin Password
                </button>
                <button
                  type="button"
                  onClick={handlePasswordCancel}
                  disabled={passwordSaving}
                  className="btn btn-secondary"
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <X size={15} />
                  Cancel
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-primary)', display: 'block' }}>
                Root Administrative Password
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                Protected with high-cost BCrypt salt hashing. Changing password re-authenticates API access tokens.
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.8125rem', fontWeight: '600' }}>
              <ShieldCheck size={16} />
              BCrypt-12 Salted &amp; Sealed
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminProfile

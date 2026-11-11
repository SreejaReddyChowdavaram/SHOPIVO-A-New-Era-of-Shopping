/**
 * Profile.jsx — Complete Customer Profile & Account Security (Phase C4)
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ROUTES } from '@/constants/routes'
import {
  User,
  Shield,
  Mail,
  Calendar,
  Key,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Save,
  X
} from 'lucide-react'
import { selectCurrentUser, setUser } from '@/store/authSlice'
import { getProfile, updateProfile, changePassword } from '@/services/userService'
import { getAddresses, deleteAddress } from '@/services/addressService'
import AddressForm from '@/components/address/AddressForm'

const CustomerProfile = () => {
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

  // Saved Addresses State
  const [addresses, setAddresses] = useState([])
  const [loadingAddr, setLoadingAddr] = useState(true)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)

  // Fetch Latest Profile & Addresses on Mount
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

    loadAddresses()
  }, [])

  const loadAddresses = () => {
    setLoadingAddr(true)
    getAddresses()
      .then(setAddresses)
      .catch(() => {})
      .finally(() => setLoadingAddr(false))
  }

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
      setProfileSuccess('Profile updated successfully.')
      setTimeout(() => setProfileSuccess(null), 3500)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile.'
      setProfileError(msg)
    } finally {
      setProfileSaving(false)
    }
  }

  // Cancel Profile Edit
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
      setPasswordSuccess('Password changed successfully.')
      setTimeout(() => setPasswordSuccess(null), 4000)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to change password.'
      setPasswordError(msg)
    } finally {
      setPasswordSaving(false)
    }
  }

  // Cancel Password Change
  const handlePasswordCancel = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setIsChangingPassword(false)
    setPasswordError(null)
  }

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this saved address?')) return
    try {
      await deleteAddress(id)
      loadAddresses()
    } catch (err) {
      alert('Could not delete address')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Active'
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return 'Active'
    }
  }

  const activeUser = userProfile || reduxUser
  const userInitial = (activeUser?.firstName?.[0] || activeUser?.email?.[0] || 'C').toUpperCase()
  const fullName = activeUser?.firstName
    ? `${activeUser.firstName} ${activeUser.lastName || ''}`.trim()
    : 'Customer Account'

  return (
    <div className="fade-in" style={{ paddingBottom: '2rem' }}>
      
      {/* 1. Header Card */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '1.35rem',
              fontWeight: '700',
              flexShrink: 0,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {userInitial}
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
              {fullName}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.3rem' }}>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--color-primary-subtle)',
                  color: 'var(--color-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {activeUser?.role || 'CUSTOMER'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Member since {formatDate(activeUser?.createdAt)}
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
            backgroundColor: 'var(--color-discount-subtle)',
            border: '1px solid rgba(22, 163, 74, 0.3)',
            color: 'var(--color-discount)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            marginBottom: '1.25rem',
            fontSize: '0.875rem',
            fontWeight: '600',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{profileSuccess}</span>
        </div>
      )}

      {passwordSuccess && (
        <div
          className="fade-in"
          style={{
            backgroundColor: 'var(--color-discount-subtle)',
            border: '1px solid rgba(22, 163, 74, 0.3)',
            color: 'var(--color-discount)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            marginBottom: '1.25rem',
            fontSize: '0.875rem',
            fontWeight: '600',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{passwordSuccess}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        
        {/* ── 2. Personal Information Card ── */}
        <div
          className="card"
          style={{
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <User size={18} color="var(--color-primary)" /> Personal Information
            </h2>
            {!isEditingProfile && (
              <button
                type="button"
                onClick={() => { setIsEditingProfile(true); setProfileError(null) }}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', gap: '0.35rem' }}
              >
                <Edit2 size={13} /> Edit Profile
              </button>
            )}
          </div>

          {profileError && (
            <div
              style={{
                backgroundColor: 'var(--color-danger-subtle)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: 'var(--color-danger)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <AlertCircle size={14} />
              <span>{profileError}</span>
            </div>
          )}

          {isEditingProfile ? (
            /* Edit Profile Form */
            <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '0.3rem' }}>
                  First Name <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  placeholder="Enter first name"
                  maxLength={100}
                  required
                  disabled={profileSaving}
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '0.3rem' }}>
                  Last Name <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  placeholder="Enter last name"
                  maxLength={100}
                  required
                  disabled={profileSaving}
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>
                  Email Address (Read-only)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="input"
                    value={activeUser?.email || ''}
                    disabled
                    readOnly
                    style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)', cursor: 'not-allowed', fontSize: '0.8125rem', paddingRight: '2rem' }}
                  />
                  <Lock size={14} color="var(--color-text-muted)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.3rem', display: 'block' }}>
                  Email changes require security verification.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={profileSaving}
                  style={{ fontSize: '0.8125rem', padding: '0.45rem 1rem' }}
                >
                  {profileSaving ? (
                    <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Saving...</>
                  ) : (
                    <><Save size={14} /> Save Changes</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleProfileCancel}
                  disabled={profileSaving}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8125rem', padding: '0.45rem 1rem' }}
                >
                  <X size={14} /> Cancel
                </button>
              </div>
            </form>
          ) : (
            /* View Profile Mode */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Mail size={16} color="var(--color-text-secondary)" />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Email Address</div>
                  <div style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>{activeUser?.email || 'N/A'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <User size={16} color="var(--color-text-secondary)" />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Account Name</div>
                  <div style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>{fullName}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Calendar size={16} color="var(--color-text-secondary)" />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Account Status</div>
                  <div style={{ fontWeight: '700', color: 'var(--color-discount)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CheckCircle2 size={14} /> Active &amp; Verified
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 3. Account Security & Password Card ── */}
        <div
          className="card"
          style={{
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid var(--color-border-subtle)', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <ShieldCheck size={18} color="var(--color-discount)" /> Account Security
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link
                to={ROUTES.CUSTOMER_LOGIN_ACTIVITY}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', gap: '0.35rem', textDecoration: 'none' }}
              >
                <ShieldCheck size={13} /> Login Activity
              </Link>
              {!isChangingPassword && (
                <button
                  type="button"
                  onClick={() => { setIsChangingPassword(true); setPasswordError(null) }}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', gap: '0.35rem' }}
                >
                  <Key size={13} /> Change Password
                </button>
              )}
            </div>
          </div>

          {passwordError && (
            <div
              style={{
                backgroundColor: 'var(--color-danger-subtle)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: 'var(--color-danger)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <AlertCircle size={14} />
              <span>{passwordError}</span>
            </div>
          )}

          {isChangingPassword ? (
            /* Change Password Form */
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Current Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '0.3rem' }}>
                  Current Password <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    className="input"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    required
                    disabled={passwordSaving}
                    style={{ fontSize: '0.8125rem', paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '0.2rem' }}
                  >
                    {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '0.3rem' }}>
                  New Password <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className="input"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="At least 8 characters"
                    minLength={8}
                    required
                    disabled={passwordSaving}
                    style={{ fontSize: '0.8125rem', paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '0.2rem' }}
                  >
                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '0.3rem' }}>
                  Confirm New Password <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="input"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    minLength={8}
                    required
                    disabled={passwordSaving}
                    style={{ fontSize: '0.8125rem', paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '0.2rem' }}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={passwordSaving}
                  style={{ fontSize: '0.8125rem', padding: '0.45rem 1rem' }}
                >
                  {passwordSaving ? (
                    <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Updating...</>
                  ) : (
                    'Update Password'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handlePasswordCancel}
                  disabled={passwordSaving}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8125rem', padding: '0.45rem 1rem' }}
                >
                  <X size={14} /> Cancel
                </button>
              </div>
            </form>
          ) : (
            /* Security Status Info */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ backgroundColor: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <Key size={15} color="var(--color-primary)" />
                  <span style={{ fontWeight: '700', fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>Password Protection</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  Your account is protected with encrypted credentials. Regularly updating your password enhances security.
                </p>
              </div>

              <div style={{ backgroundColor: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <Shield size={15} color="var(--color-discount)" />
                  <span style={{ fontWeight: '700', fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>Secure Sign-In Session</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  Your account activity is safeguarded by Shopivo authentication and token verification.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── 4. Saved Addresses Section ── */}
      <div
        id="addresses"
        className="card"
        style={{
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.85rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.45rem', margin: 0, color: 'var(--color-text-primary)' }}>
            <MapPin size={18} color="var(--color-primary)" /> Saved Delivery Addresses ({addresses.length})
          </h3>
          <button
            onClick={() => { setEditingAddress(null); setShowAddressModal(true) }}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', gap: '0.35rem' }}
          >
            <Plus size={13} /> Add New Address
          </button>
        </div>

        {loadingAddr ? (
          <div className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius-md)' }} />
        ) : addresses.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', textAlign: 'center', padding: '1.5rem 1rem', margin: 0 }}>
            No saved addresses. Click "Add New Address" above to save a shipping location.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {addresses.map((addr) => (
              <div
                key={addr.id}
                style={{
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-xs)', color: 'var(--color-primary)' }}>
                      {addr.label} {addr.isDefault && '• DEFAULT'}
                    </span>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.2rem' }}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0, marginBottom: '0.3rem' }}>
                    {addr.fullName}
                  </h4>
                  <p style={{ fontSize: '0.775rem', color: 'var(--color-text-secondary)', lineHeight: 1.45, margin: 0 }}>
                    {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />
                    {addr.city}, {addr.state} - {addr.postalCode}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Address Form Modal */}
      {showAddressModal && (
        <AddressForm
          initialData={editingAddress}
          onSuccess={() => { setShowAddressModal(false); loadAddresses() }}
          onCancel={() => { setShowAddressModal(false); setEditingAddress(null) }}
        />
      )}
    </div>
  )
}

export default CustomerProfile

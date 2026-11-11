/**
 * AddressForm.jsx — Reusable modal to create or edit a shipping address (Light Marketplace Style)
 */

import { useState } from 'react'
import { X, Loader2, MapPin } from 'lucide-react'
import { createAddress, updateAddress } from '@/services/addressService'

const AddressForm = ({ initialData = null, onSuccess, onCancel }) => {
  const isEditing = Boolean(initialData?.id)

  const [formData, setFormData] = useState({
    label: initialData?.label || 'Home',
    fullName: initialData?.fullName || '',
    phone: initialData?.phone || '',
    line1: initialData?.line1 || '',
    line2: initialData?.line2 || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    postalCode: initialData?.postalCode || '',
    country: initialData?.country || 'India',
    isDefault: initialData?.isDefault ?? false,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      let result
      if (isEditing) {
        result = await updateAddress(initialData.id, formData)
      } else {
        result = await createAddress(formData)
      }
      onSuccess(result)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save address')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <div
        className="fade-in"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          maxWidth: '500px',
          width: '100%',
          maxHeight: 'min(90vh, 90dvh)',
          overflowY: 'auto',
          margin: 'auto',
          position: 'relative',
          boxShadow: 'var(--shadow-xl)',
          padding: '1.5rem',
          transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-primary)', margin: 0 }}>
            <MapPin size={18} color="var(--color-primary)" />
            {isEditing ? 'Edit Delivery Address' : 'Add New Delivery Address'}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '0.25rem' }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-subtle)',
            padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-xs)', marginBottom: '1rem',
            fontSize: '0.8125rem', border: '1px solid rgba(211,47,47,0.3)',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Label & Full Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.65rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Type</label>
              <select
                name="label"
                className="input"
                value={formData.label}
                onChange={handleChange}
                required
              >
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Office">Office</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Full Name *</label>
              <input
                type="text"
                name="fullName"
                className="input"
                placeholder="Recipient name"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Phone Number *</label>
            <input
              type="tel"
              name="phone"
              className="input"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          {/* Address Line 1 */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Street Address / Line 1 *</label>
            <input
              type="text"
              name="line1"
              className="input"
              placeholder="House/Flat No., Building Name, Street"
              value={formData.line1}
              onChange={handleChange}
              required
            />
          </div>

          {/* Address Line 2 */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Apartment, Suite, Landmark (Optional)</label>
            <input
              type="text"
              name="line2"
              className="input"
              placeholder="Near City Park, 4th Floor"
              value={formData.line2}
              onChange={handleChange}
            />
          </div>

          {/* City & State */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.2rem' }}>City *</label>
              <input
                type="text"
                name="city"
                className="input"
                placeholder="Bengaluru"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.2rem' }}>State *</label>
              <input
                type="text"
                name="state"
                className="input"
                placeholder="Karnataka"
                value={formData.state}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Postal Code & Country */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Postal Code *</label>
              <input
                type="text"
                name="postalCode"
                className="input"
                placeholder="560001"
                value={formData.postalCode}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Country *</label>
              <input
                type="text"
                name="country"
                className="input"
                value={formData.country}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Default Checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
            <input
              type="checkbox"
              name="isDefault"
              checked={formData.isDefault}
              onChange={handleChange}
            />
            <span>Set as default shipping address</span>
          </label>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.875rem' }}>
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ minWidth: '120px' }}>
              {loading ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : (isEditing ? 'Save Changes' : 'Save Address')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddressForm

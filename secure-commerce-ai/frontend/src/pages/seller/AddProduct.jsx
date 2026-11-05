/**
 * AddProduct.jsx — Seller Product Creation Form
 * Matches ProductRequest DTO requirements on the backend.
 */

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Package,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  DollarSign,
  Layers,
  FileText,
  Info
} from 'lucide-react'
import { createProduct, uploadProductImage, getCategories } from '@/services/productService'
import { ROUTES } from '@/constants/routes'
import ProductImageSelector from '@/components/seller/ProductImageSelector'

const AddProduct = () => {
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    price: '',
    stockQuantity: '10',
    imageUrl: '',
    description: '',
  })

  const [selectedImageFile, setSelectedImageFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [uploadWarning, setUploadWarning] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState(null)

  // Fetch categories for select dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const list = await getCategories()
        setCategories(list || [])
        if (list && list.length > 0) {
          setFormData((prev) => ({ ...prev, categoryId: String(list[0].id) }))
        }
      } catch (err) {
        console.error('Failed to load categories', err)
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear field-specific error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
    if (name === 'imageUrl') {
      setImagePreviewError(false)
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Product title is required.'
    } else if (formData.name.length > 255) {
      newErrors.name = 'Product title cannot exceed 255 characters.'
    }

    if (!formData.price || isNaN(formData.price) || Number(formData.price) < 0) {
      newErrors.price = 'Please enter a valid price (₹0.00 or greater).'
    }

    if (
      formData.stockQuantity === '' ||
      isNaN(formData.stockQuantity) ||
      Number(formData.stockQuantity) < 0 ||
      !Number.isInteger(Number(formData.stockQuantity))
    ) {
      newErrors.stockQuantity = 'Stock quantity must be a non-negative whole number.'
    }

    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Description cannot exceed 2000 characters.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError(null)
    setUploadWarning(null)

    if (!validate()) return

    setSubmitting(true)
    try {
      const payload = {
        name: formData.name.trim(),
        categoryId: formData.categoryId ? Number(formData.categoryId) : null,
        price: Number(formData.price),
        stockQuantity: Number(formData.stockQuantity),
        // If an image file is selected, it takes precedence and is uploaded immediately after creation
        imageUrl: selectedImageFile ? null : (formData.imageUrl.trim() || null),
        description: formData.description.trim() || null,
      }

      const created = await createProduct(payload)

      if (selectedImageFile && created?.id) {
        try {
          await uploadProductImage(created.id, selectedImageFile, (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              setUploadProgress(percent)
            }
          })
        } catch (uploadErr) {
          console.error('Image upload failed after product creation', uploadErr)
          const errorMsg = uploadErr.response?.data?.message || uploadErr.message || 'Image upload failed'
          setUploadWarning({
            productId: created.id,
            message: `Product "${payload.name}" was created successfully, but its image upload failed (${errorMsg}). You can retry uploading the image from Edit Product.`,
          })
          setSubmitting(false)
          return
        }
      }

      navigate(ROUTES.SELLER_PRODUCTS, {
        state: { successMessage: `Product "${payload.name}" submitted for admin review!` },
      })
    } catch (err) {
      setServerError(
        err.response?.data?.message || err.message || 'Failed to submit product. Please check your details.'
      )
    } finally {
      setSubmitting(false)
      setUploadProgress(null)
    }
  }

  return (
    <div className="fade-in" style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* ── Top Bar with Back Navigation ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link
          to={ROUTES.SELLER_PRODUCTS}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--color-text-secondary)',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: '600',
          }}
        >
          <ArrowLeft size={16} /> Back to Products
        </Link>
      </div>

      {/* ── Page Header ── */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          padding: '1.25rem 1.5rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
          Create New Product Listing
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem', margin: 0 }}>
          Fill in accurate product details, pricing, and initial stock. Listings will be reviewed by an administrator.
        </p>
      </div>

      {/* ── Error Banner ── */}
      {serverError && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: 'var(--color-danger)',
            fontSize: '0.85rem',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{serverError}</span>
        </div>
      )}

      {/* ── Main Form ── */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Section 1: Basic Details */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
            <FileText size={18} color="var(--color-primary)" />
            <h2 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
              General Information
            </h2>
          </div>

          {/* Product Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
              Product Title <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Wireless Noise-Cancelling Headphones Pro"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              style={{
                width: '100%',
                borderColor: errors.name ? 'var(--color-danger)' : undefined,
              }}
              maxLength={255}
            />
            {errors.name && (
              <p style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.35rem', margin: 0 }}>
                {errors.name}
              </p>
            )}
          </div>

          {/* Category Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
              Product Category <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="form-input"
              style={{ width: '100%' }}
              disabled={loadingCategories}
            >
              {loadingCategories ? (
                <option>Loading categories...</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Description */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
                Product Description
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>
                {formData.description.length}/2000 chars
              </span>
            </div>
            <textarea
              name="description"
              rows={4}
              placeholder="Provide key features, technical specifications, warranty details, and box contents..."
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              style={{
                width: '100%',
                resize: 'vertical',
                borderColor: errors.description ? 'var(--color-danger)' : undefined,
              }}
              maxLength={2000}
            />
            {errors.description && (
              <p style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.35rem', margin: 0 }}>
                {errors.description}
              </p>
            )}
          </div>
        </div>

        {/* Section 2: Pricing & Stock */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
            <DollarSign size={18} color="var(--color-primary)" />
            <h2 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
              Pricing &amp; Inventory
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {/* Price */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
                Selling Price (INR ₹) <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', fontWeight: '700', fontSize: '0.9rem' }}>
                  ₹
                </span>
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={handleChange}
                  className="form-input"
                  style={{
                    width: '100%',
                    paddingLeft: '2.2rem',
                    borderColor: errors.price ? 'var(--color-danger)' : undefined,
                  }}
                />
              </div>
              {errors.price && (
                <p style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.35rem', margin: 0 }}>
                  {errors.price}
                </p>
              )}
            </div>

            {/* Stock Quantity */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
                Available Stock Units <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="number"
                name="stockQuantity"
                min="0"
                step="1"
                placeholder="0"
                value={formData.stockQuantity}
                onChange={handleChange}
                className="form-input"
                style={{
                  width: '100%',
                  borderColor: errors.stockQuantity ? 'var(--color-danger)' : undefined,
                }}
              />
              {errors.stockQuantity && (
                <p style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.35rem', margin: 0 }}>
                  {errors.stockQuantity}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Product Image (Upload or External URL) */}
        <ProductImageSelector
          selectedFile={selectedImageFile}
          onFileSelect={(file) => {
            setSelectedImageFile(file)
            setUploadWarning(null)
          }}
          onFileRemove={() => {
            setSelectedImageFile(null)
          }}
          imageUrl={formData.imageUrl}
          onUrlChange={(url) => {
            setFormData((prev) => ({ ...prev, imageUrl: url }))
          }}
          uploadProgress={uploadProgress}
        />

        {/* Upload Warning / Retry banner if creation succeeded but image upload failed */}
        {uploadWarning && (
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: 'var(--color-warning)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', fontSize: '0.875rem' }}>
              <AlertCircle size={18} />
              <span>{uploadWarning.message}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link
                to={`/seller/products/${uploadWarning.productId}/edit`}
                className="btn btn-primary"
                style={{ fontSize: '0.8125rem', padding: '0.4rem 0.85rem' }}
              >
                Go to Edit Product
              </Link>
              <Link
                to={ROUTES.SELLER_PRODUCTS}
                className="btn btn-secondary"
                style={{ fontSize: '0.8125rem', padding: '0.4rem 0.85rem' }}
              >
                View Product List
              </Link>
            </div>
          </div>
        )}

        {/* ── Form Actions ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            padding: '1rem 0',
          }}
        >
          <Link to={ROUTES.SELLER_PRODUCTS} className="btn btn-secondary" style={{ padding: '0.625rem 1.25rem' }}>
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{
              padding: '0.625rem 1.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '700',
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting Listing...
              </>
            ) : (
              <>
                <Plus size={16} />
                Submit for Approval
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  )
}

export default AddProduct

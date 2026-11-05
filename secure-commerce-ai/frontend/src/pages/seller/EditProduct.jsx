/**
 * EditProduct.jsx — Seller Product Editing & Resubmission
 * Updates existing product details and resets status to PENDING for admin re-verification.
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  DollarSign,
  FileText,
  Info,
  Clock,
  XCircle,
  RotateCcw
} from 'lucide-react'
import { getSellerProduct, updateProduct, uploadProductImage, getCategories } from '@/services/productService'
import { ROUTES } from '@/constants/routes'
import ProductImageSelector from '@/components/seller/ProductImageSelector'

const EditProduct = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [originalProduct, setOriginalProduct] = useState(null)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    price: '',
    stockQuantity: '0',
    imageUrl: '',
    description: '',
  })

  const [selectedImageFile, setSelectedImageFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState(null)

  // Load product and categories
  const loadProductData = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [productData, categoryList] = await Promise.all([
        getSellerProduct(id),
        getCategories(),
      ])

      setCategories(categoryList || [])
      setOriginalProduct(productData)

      setFormData({
        name: productData.name || '',
        categoryId: productData.categoryId ? String(productData.categoryId) : '',
        price: productData.price != null ? String(productData.price) : '',
        stockQuantity: productData.stockQuantity != null ? String(productData.stockQuantity) : '0',
        imageUrl: productData.imageUrl || '',
        description: productData.description || '',
      })
    } catch (err) {
      setLoadError(
        err.response?.data?.message || err.message || 'Failed to load product details for editing'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      loadProductData()
    }
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
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

    if (!validate()) return

    setSubmitting(true)
    try {
      const payload = {
        name: formData.name.trim(),
        categoryId: formData.categoryId ? Number(formData.categoryId) : null,
        price: Number(formData.price),
        stockQuantity: Number(formData.stockQuantity),
        // If a new replacement file is chosen, keep existing imageUrl until upload endpoint updates it
        imageUrl: selectedImageFile ? (originalProduct?.imageUrl || null) : (formData.imageUrl.trim() || null),
        description: formData.description.trim() || null,
      }

      await updateProduct(id, payload)

      // If replacement file was selected, upload it now
      if (selectedImageFile) {
        try {
          await uploadProductImage(id, selectedImageFile, (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              setUploadProgress(percent)
            }
          })
        } catch (uploadErr) {
          console.error('Image replacement upload failed', uploadErr)
          const errorMsg = uploadErr.response?.data?.message || uploadErr.message || 'Image upload failed'
          setServerError(`Product details were updated, but image upload failed (${errorMsg}). Your previous image was preserved. Please try uploading again.`)
          setSubmitting(false)
          return
        }
      }

      navigate(ROUTES.SELLER_PRODUCTS, {
        state: { successMessage: `Product "${payload.name}" updated successfully and sent for review!` },
      })
    } catch (err) {
      setServerError(
        err.response?.data?.message || err.message || 'Failed to update product. Please check your inputs.'
      )
    } finally {
      setSubmitting(false)
      setUploadProgress(null)
    }
  }

  if (loading) {
    return (
      <div
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          padding: '4rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          color: 'var(--color-text-secondary)',
        }}
      >
        <Loader2 size={32} className="animate-spin" color="var(--color-primary)" />
        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '500' }}>Loading product details...</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          backgroundColor: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-sm)',
          padding: '2.5rem',
          textAlign: 'center',
          color: 'var(--color-danger)',
        }}
      >
        <AlertCircle size={36} style={{ margin: '0 auto 0.5rem' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>Unable to Load Product</h3>
        <p style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>{loadError}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={loadProductData} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <RotateCcw size={15} /> Retry
          </button>
          <Link to={ROUTES.SELLER_PRODUCTS} className="btn btn-secondary">
            Back to Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* ── Top Bar ── */}
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

        {originalProduct && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>
            SKU / Slug: {originalProduct.slug}
          </span>
        )}
      </div>

      {/* ── Page Header ── */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          padding: '1.25rem 1.5rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>
            Edit Product Listing
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem', margin: 0 }}>
            Modify product specifications, price, or inventory count.
          </p>
        </div>

        {/* Current Status Badge */}
        {originalProduct && (
          <div
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor:
                originalProduct.status === 'APPROVED'
                  ? 'rgba(34, 197, 94, 0.1)'
                  : originalProduct.status === 'REJECTED'
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(234, 179, 8, 0.1)',
              border:
                originalProduct.status === 'APPROVED'
                  ? '1px solid rgba(34, 197, 94, 0.3)'
                  : originalProduct.status === 'REJECTED'
                  ? '1px solid rgba(239, 68, 68, 0.3)'
                  : '1px solid rgba(234, 179, 8, 0.3)',
              color:
                originalProduct.status === 'APPROVED'
                  ? 'var(--color-success)'
                  : originalProduct.status === 'REJECTED'
                  ? 'var(--color-danger)'
                  : 'var(--color-warning)',
            }}
          >
            {originalProduct.status === 'APPROVED' && <CheckCircle2 size={14} />}
            {originalProduct.status === 'PENDING' && <Clock size={14} />}
            {originalProduct.status === 'REJECTED' && <XCircle size={14} />}
            Current Status: {originalProduct.status}
          </div>
        )}
      </div>

      {/* ── Status Rejection Reason Banner ── */}
      {originalProduct?.status === 'REJECTED' ? (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            fontSize: '0.8125rem',
            color: 'var(--color-text-primary)',
          }}
        >
          <AlertCircle size={18} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: 'var(--color-danger)' }}>Revision Required:</strong>
            <span style={{ color: 'var(--color-text-secondary)', marginLeft: '0.35rem' }}>
              This listing was rejected. Update the title, pricing, or description below and click Save to resubmit for approval.
            </span>
          </div>
        </div>
      ) : null}

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

      {/* ── Edit Form ── */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Section 1: General Details */}
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

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
              Product Title <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              type="text"
              name="name"
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
            >
              <option value="">Select a Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

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

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
                Available Stock Units <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="number"
                name="stockQuantity"
                min="0"
                step="1"
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

        {/* Section 3: Product Image (Upload Replacement or Edit URL) */}
        <ProductImageSelector
          selectedFile={selectedImageFile}
          onFileSelect={(file) => {
            setSelectedImageFile(file)
          }}
          onFileRemove={() => {
            setSelectedImageFile(null)
          }}
          imageUrl={formData.imageUrl}
          onUrlChange={(url) => {
            setFormData((prev) => ({ ...prev, imageUrl: url }))
          }}
          existingImageUrl={originalProduct?.imageUrl}
          uploadProgress={uploadProgress}
        />

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
                Saving Changes...
              </>
            ) : (
              <>
                <Save size={16} />
                Save &amp; Resubmit Listing
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  )
}

export default EditProduct

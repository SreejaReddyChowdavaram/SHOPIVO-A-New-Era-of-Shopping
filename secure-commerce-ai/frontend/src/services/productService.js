/**
 * productService.js — Product API calls
 *
 * GET /api/products              → browse approved products (public)
 * GET /api/products/:id          → single product (public)
 * GET /api/categories            → all categories (public)
 * GET /api/seller/products       → seller's own products
 * POST /api/seller/products      → create product
 * PUT /api/seller/products/:id   → update own product
 * PUT /api/admin/products/:id/approve
 * PUT /api/admin/products/:id/reject
 */

import api from './api'

// ─── Customer / Public ───────────────────────────────────────

export const getProducts = async ({ page = 0, size = 12, categoryId, search } = {}) => {
  const params = { page, size }
  if (categoryId) params.categoryId = categoryId
  if (search)     params.search     = search
  const res = await api.get('/products', { params })
  return res.data.data   // unwrap ApiResponse<Page<ProductResponse>>
}

export const getProductById = async (id) => {
  const res = await api.get(`/products/${id}`)
  return res.data.data
}

export const getCategories = async () => {
  const res = await api.get('/categories')
  return res.data.data
}

// ─── Seller ──────────────────────────────────────────────────

export const getSellerProducts = async () => {
  const res = await api.get('/seller/products')
  return res.data.data
}

export const getSellerProduct = async (id) => {
  const res = await api.get(`/seller/products/${id}`)
  return res.data.data
}

export const createProduct = async (data) => {
  const res = await api.post('/seller/products', data)
  return res.data.data
}

export const updateProduct = async (id, data) => {
  const res = await api.put(`/seller/products/${id}`, data)
  return res.data.data
}

/**
 * PATCH /api/seller/products/{id}/stock
 * Stock-only update — does not reset product status to PENDING.
 * @param {number|string} id - product ID
 * @param {number} stockQuantity - new stock level (0 or greater)
 */
export const updateProductStock = async (id, stockQuantity) => {
  const res = await api.patch(`/seller/products/${id}/stock`, { stockQuantity })
  return res.data.data
}

/**
 * POST /api/seller/products/{id}/image
 * Uploads an image file (multipart/form-data) for the seller's product.
 * @param {number|string} id - product ID
 * @param {File} file - image file (JPEG, PNG, WEBP)
 * @param {function} onUploadProgress - optional progress callback
 */
export const uploadProductImage = async (id, file, onUploadProgress) => {
  const formData = new FormData()
  formData.append('image', file)
  const res = await api.post(`/seller/products/${id}/image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  })
  return res.data.data
}

// ─── Admin ───────────────────────────────────────────────────

export const getAdminProducts = async ({ status, search } = {}) => {
  const params = {}
  if (status && status !== 'ALL') params.status = status
  if (search && search.trim()) params.search = search.trim()
  const res = await api.get('/admin/products', { params })
  return res.data.data
}

export const getAdminProductById = async (id) => {
  const res = await api.get(`/admin/products/${id}`)
  return res.data.data
}

export const approveProduct = async (id) => {
  const res = await api.put(`/admin/products/${id}/approve`)
  return res.data.data
}

export const rejectProduct = async (id, reason) => {
  const payload = reason ? { reason } : {}
  const res = await api.put(`/admin/products/${id}/reject`, payload)
  return res.data.data
}

export default {
  getProducts,
  getProductById,
  getCategories,
  getSellerProducts,
  getSellerProduct,
  createProduct,
  updateProduct,
  updateProductStock,
  uploadProductImage,
  getAdminProducts,
  getAdminProductById,
  approveProduct,
  rejectProduct,
}


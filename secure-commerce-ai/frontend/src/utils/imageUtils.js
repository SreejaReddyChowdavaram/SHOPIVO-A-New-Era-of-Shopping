/**
 * imageUtils.js — Utilities for resolving, formatting, and validating product images.
 */

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

/**
 * Resolves a product image URL to a full browsable URL.
 * Supports:
 * - External URLs (http://, https://)
 * - Browser preview object URLs (blob:)
 * - Data URLs (data:)
 * - Server-managed uploaded images (/uploads/products/...)
 */
export const resolveImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null

  if (
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return trimmed
  }

  // Handle server-managed paths like /uploads/products/xyz.webp
  const isCloudHost =
    typeof window !== 'undefined' &&
    window.location?.hostname &&
    !['localhost', '127.0.0.1'].includes(window.location.hostname)

  let apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
  if (isCloudHost && (apiBase.includes('localhost') || apiBase.includes('127.0.0.1'))) {
    apiBase = 'https://shopivo-a-new-era-of-shopping.onrender.com/api'
  }
  try {
    const origin = new URL(apiBase).origin
    if (trimmed.startsWith('/api/')) {
      return `${origin}${trimmed}`
    }
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
    return `${origin}/api${cleanPath}`
  } catch {
    return trimmed
  }
}

/**
 * Human-readable file size formatter.
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  if (!bytes) return ''
  const k = 1024
  if (bytes < k) return `${bytes} B`
  if (bytes < k * k) return `${(bytes / k).toFixed(1)} KB`
  return `${(bytes / (k * k)).toFixed(1)} MB`
}

/**
 * Validates an image file before upload.
 */
export const validateImageFile = (file) => {
  if (!file) {
    return { valid: false, error: 'Please select an image file.' }
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds the 5 MB limit. Please select a smaller image.`,
    }
  }

  const extension = file.name ? file.name.split('.').pop()?.toLowerCase() : ''
  const mime = file.type ? file.type.toLowerCase() : ''

  const validExt = ALLOWED_EXTENSIONS.includes(extension)
  const validMime = ALLOWED_MIME_TYPES.includes(mime)

  if (!validExt && !validMime) {
    return {
      valid: false,
      error: 'Unsupported image format. Please upload a JPEG, PNG, or WEBP photo.',
    }
  }

  return { valid: true, error: null }
}

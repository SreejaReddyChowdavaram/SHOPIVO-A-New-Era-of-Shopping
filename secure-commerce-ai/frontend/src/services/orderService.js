/**
 * orderService.js — Order lifecycle API calls
 *
 * Scopes:
 *   - Customer: placeOrder, getMyOrders, getOrderById
 *   - Seller: getSellerOrders, getOrderById, updateStatus
 *   - Admin: getAdminOrders, getOrderById, updateStatus
 */

import api from './api'

export const placeOrder = async (addressId, couponCode = null) => {
  const payload = { addressId }
  if (couponCode && couponCode.trim()) {
    payload.couponCode = couponCode.trim().toUpperCase()
  }
  const res = await api.post('/orders', payload)
  return res.data.data
}

export const getMyOrders = async () => {
  const res = await api.get('/orders/mine')
  return res.data.data
}

export const getOrderById = async (id) => {
  const res = await api.get(`/orders/${id}`)
  return res.data.data
}

export const getSellerOrders = async () => {
  const res = await api.get('/orders/seller')
  return res.data.data
}

export const getAdminOrders = async (status) => {
  const params = status ? { status } : {}
  const res = await api.get('/orders/admin', { params })
  return res.data.data
}

/**
 * Paged admin order list with optional filters (status, paymentStatus, search, page, size)
 */
export const getAdminOrdersPaged = async (params = {}) => {
  const res = await api.get('/admin/orders', { params })
  return res.data.data
}

/**
 * Complete platform view of order details for Admin
 */
export const getAdminOrderDetails = async (id) => {
  const res = await api.get(`/admin/orders/${id}`)
  return res.data.data
}

/**
 * Platform operational order metrics for Admin Dashboard
 */
export const getAdminOrderMetrics = async () => {
  const res = await api.get('/admin/orders/metrics')
  return res.data.data
}

export const updateAdminOrderStatus = async (id, status) => {
  const res = await api.patch(`/admin/orders/${id}/status`, { status })
  return res.data.data
}

export const cancelAdminOrder = async (id, reason) => {
  const res = await api.patch(`/admin/orders/${id}/cancel`, { reason })
  return res.data.data
}

export const updateStatus = async (id, status) => {
  const res = await api.patch(`/orders/${id}/status`, { status })
  return res.data.data
}

export const cancelOrder = async (id, reason) => {
  const res = await api.patch(`/orders/${id}/cancel`, { reason })
  return res.data.data
}

export const downloadInvoice = async (orderId) => {
  const res = await api.get(`/orders/${orderId}/invoice`, {
    responseType: 'blob',
  })
  const blob = new Blob([res.data], { type: 'application/pdf' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `Invoice-INV-${String(orderId).padStart(6, '0')}.pdf`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export default {
  placeOrder,
  getMyOrders,
  getOrderById,
  getSellerOrders,
  getAdminOrders,
  getAdminOrdersPaged,
  getAdminOrderDetails,
  getAdminOrderMetrics,
  updateAdminOrderStatus,
  cancelAdminOrder,
  updateStatus,
  cancelOrder,
  downloadInvoice,
}

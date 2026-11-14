/**
 * returnService.js — Customer Returns & Refunds API client
 */

import api from './api'

export const checkReturnEligibility = async (orderId, orderItemId) => {
  const params = { orderId }
  if (orderItemId) params.orderItemId = orderItemId
  const res = await api.get('/returns/eligibility', { params })
  return res.data.data
}

export const requestReturn = async (payload) => {
  const res = await api.post('/returns', payload)
  return res.data.data
}

export const processSandboxApproval = async (returnId) => {
  const res = await api.post(`/returns/${returnId}/approve-sandbox`)
  return res.data.data
}

export const getMyReturns = async () => {
  const res = await api.get('/returns/mine')
  return res.data.data
}

export const getMyRefunds = async () => {
  const res = await api.get('/returns/refunds/mine')
  return res.data.data
}

export const getReturnById = async (id) => {
  const res = await api.get(`/returns/${id}`)
  return res.data.data
}

export const cancelReturn = async (id) => {
  const res = await api.post(`/returns/${id}/cancel`)
  return res.data.data
}

// ─── SELLER REFUND WORKFLOW ────────────────────────────────
export const getSellerRefunds = async (params) => {
  const res = await api.get('/seller/refunds', { params })
  return res.data.data
}

export const getSellerRefundById = async (id) => {
  const res = await api.get(`/seller/refunds/${id}`)
  return res.data.data
}

export const approveSellerRefund = async (id) => {
  const res = await api.post(`/seller/refunds/${id}/approve`)
  return res.data.data
}

export const rejectSellerRefund = async (id, reason) => {
  const res = await api.post(`/seller/refunds/${id}/reject`, { reason })
  return res.data.data
}

// ─── ADMIN REFUND MONITORING ────────────────────────────────
export const getAdminRefunds = async (params) => {
  const res = await api.get('/admin/refunds', { params })
  return res.data.data
}

export const getAdminRefundById = async (id) => {
  const res = await api.get(`/admin/refunds/${id}`)
  return res.data.data
}

export default {
  checkReturnEligibility,
  requestReturn,
  processSandboxApproval,
  getMyReturns,
  getMyRefunds,
  getReturnById,
  cancelReturn,
  getSellerRefunds,
  getSellerRefundById,
  approveSellerRefund,
  rejectSellerRefund,
  getAdminRefunds,
  getAdminRefundById,
}

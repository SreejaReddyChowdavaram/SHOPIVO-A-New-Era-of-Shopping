/**
 * paymentService.js — Production Razorpay Test Mode & COD Payment API calls.
 *
 * POST /api/payments/create-gateway-order   → initiates online Razorpay session
 * POST /api/payments/verify-gateway-payment → authoritatively verifies HMAC signature and gateway status
 * POST /api/payments/cod                   → confirms Cash on Delivery order
 * GET  /api/payments/mine                  → customer payment logs
 * GET  /api/payments/order/{id}            → payment details for specific order
 * GET  /api/admin/payments                 → admin audit view of all transactions
 */

import api from './api'

export const createGatewayOrder = async (orderId) => {
  const res = await api.post('/payments/create-gateway-order', { orderId })
  return res.data.data
}

export const verifyGatewayPayment = async (payload) => {
  const res = await api.post('/payments/verify-gateway-payment', payload)
  return res.data.data
}

export const processCodPayment = async (orderId) => {
  const res = await api.post('/payments/cod', { orderId })
  return res.data.data
}

export const getMyPayments = async () => {
  const res = await api.get('/payments/mine')
  return res.data.data
}

export const getPaymentByOrderId = async (orderId) => {
  const res = await api.get(`/payments/order/${orderId}`)
  return res.data.data
}

export const createQrCode = async (orderId) => {
  const res = await api.post('/payments/create-qr-code', { orderId })
  return res.data.data
}

export const cancelQrCode = async (orderId) => {
  const res = await api.post('/payments/cancel-qr-code', { orderId })
  return res.data.data
}

export const getAdminPayments = async (params) => {
  const res = await api.get('/admin/payments', { params })
  return res.data.data
}

export default {
  createGatewayOrder,
  verifyGatewayPayment,
  createQrCode,
  cancelQrCode,
  processCodPayment,
  getMyPayments,
  getPaymentByOrderId,
  getAdminPayments,
}

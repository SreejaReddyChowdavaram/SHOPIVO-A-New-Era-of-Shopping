/**
 * couponService.js — Coupon & Discount API calls
 *
 * Server-authoritative coupon validation and available coupons listing.
 */

import api from './api'

export const validateCoupon = async (code) => {
  const res = await api.post('/coupons/validate', { code })
  return res.data.data
}

export const getAvailableCoupons = async () => {
  const res = await api.get('/coupons/available')
  return res.data.data
}

export default { validateCoupon, getAvailableCoupons }

/**
 * reviewService.js — Customer Reviews and Ratings API service
 */

import api from './api'

export const getProductReviews = async (productId) => {
  const res = await api.get(`/reviews/product/${productId}`)
  return res.data.data
}

export const checkReviewEligibility = async (productId) => {
  const res = await api.get(`/reviews/eligibility/${productId}`)
  return res.data.data
}

export const createReview = async (payload) => {
  const res = await api.post('/reviews', payload)
  return res.data.data
}

export const updateReview = async (reviewId, payload) => {
  const res = await api.put(`/reviews/${reviewId}`, payload)
  return res.data.data
}

export const deleteReview = async (reviewId) => {
  const res = await api.delete(`/reviews/${reviewId}`)
  return res.data.data
}

export const getSellerReviews = async () => {
  const res = await api.get('/reviews/seller')
  return res.data.data
}

export const getAdminReviews = async () => {
  const res = await api.get('/admin/reviews')
  return res.data.data
}

export const deleteAdminReview = async (reviewId) => {
  const res = await api.delete(`/admin/reviews/${reviewId}`)
  return res.data.data
}

export default {
  getProductReviews,
  checkReviewEligibility,
  createReview,
  updateReview,
  deleteReview,
  getSellerReviews,
  getAdminReviews,
  deleteAdminReview,
}


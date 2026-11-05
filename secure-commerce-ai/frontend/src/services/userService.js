/**
 * userService.js — User Profile, Account Security, and Admin User/Seller Platform Management
 */

import api from './api'

// ── Authenticated User Profile Endpoints ────────────────────
export const getProfile = async () => {
  const res = await api.get('/user/profile')
  return res.data.data
}

export const updateProfile = async (payload) => {
  const res = await api.put('/user/profile', payload)
  return res.data.data
}

export const changePassword = async (payload) => {
  const res = await api.put('/user/password', payload)
  return res.data.data
}

// ── Admin User Management Operations ────────────────────────
export const getAdminUsersPaged = async (params = {}) => {
  const res = await api.get('/admin/users', { params })
  return res.data.data
}

export const getAdminUserDetail = async (id) => {
  const res = await api.get(`/admin/users/${id}`)
  return res.data.data
}

export const suspendUser = async (id) => {
  const res = await api.patch(`/admin/users/${id}/suspend`)
  return res.data.data
}

export const activateUser = async (id) => {
  const res = await api.patch(`/admin/users/${id}/activate`)
  return res.data.data
}

export const getAdminUserMetrics = async () => {
  const res = await api.get('/admin/users/metrics')
  return res.data.data
}

// ── Admin Seller Management Operations ──────────────────────
export const getAdminSellersPaged = async (params = {}) => {
  const res = await api.get('/admin/sellers', { params })
  return res.data.data
}

export const getAdminSellerDetail = async (id) => {
  const res = await api.get(`/admin/sellers/${id}`)
  return res.data.data
}

export const suspendSeller = async (id) => {
  const res = await api.patch(`/admin/sellers/${id}/suspend`)
  return res.data.data
}

export const activateSeller = async (id) => {
  const res = await api.patch(`/admin/sellers/${id}/activate`)
  return res.data.data
}

export default {
  getProfile,
  updateProfile,
  changePassword,
  getAdminUsersPaged,
  getAdminUserDetail,
  suspendUser,
  activateUser,
  getAdminUserMetrics,
  getAdminSellersPaged,
  getAdminSellerDetail,
  suspendSeller,
  activateSeller,
}

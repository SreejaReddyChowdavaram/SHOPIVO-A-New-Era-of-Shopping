/**
 * loginActivityService.js — Authentication Activity and Security Telemetry Service
 */

import api from './api'

export const getMyLoginHistory = async () => {
  const res = await api.get('/auth/login-history')
  return res.data.data
}

export const getAdminLoginEvents = async (params = {}) => {
  const res = await api.get('/admin/login-events', { params })
  return res.data.data
}

export const getAdminLoginStats = async () => {
  const res = await api.get('/admin/login-events/stats')
  return res.data.data
}

export const cleanupAdminLoginEvents = async (retentionDays = 365) => {
  const res = await api.post('/admin/login-events/cleanup', null, {
    params: { retentionDays },
  })
  return res.data.data
}

export default {
  getMyLoginHistory,
  getAdminLoginEvents,
  getAdminLoginStats,
  cleanupAdminLoginEvents,
}


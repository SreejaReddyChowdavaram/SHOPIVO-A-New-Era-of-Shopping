/**
 * addressService.js — Shipping address API calls
 *
 * All endpoints require CUSTOMER role (JWT handled by api interceptor).
 */

import api from './api'

export const getAddresses = async () => {
  const res = await api.get('/addresses')
  return res.data.data
}

export const getAddressById = async (id) => {
  const res = await api.get(`/addresses/${id}`)
  return res.data.data
}

export const createAddress = async (data) => {
  const res = await api.post('/addresses', data)
  return res.data.data
}

export const updateAddress = async (id, data) => {
  const res = await api.put(`/addresses/${id}`, data)
  return res.data.data
}

export const deleteAddress = async (id) => {
  const res = await api.delete(`/addresses/${id}`)
  return res.data.data
}

export default { getAddresses, getAddressById, createAddress, updateAddress, deleteAddress }

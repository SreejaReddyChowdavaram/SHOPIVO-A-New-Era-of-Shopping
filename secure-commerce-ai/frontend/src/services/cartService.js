/**
 * cartService.js — Cart API calls
 *
 * All endpoints require CUSTOMER role — JWT sent automatically by api.js interceptor.
 */

import api from './api'

export const getCart = async () => {
  const res = await api.get('/cart')
  return res.data.data
}

export const addItem = async (productId, quantity = 1) => {
  const res = await api.post('/cart/items', { productId, quantity })
  return res.data.data
}

export const updateQuantity = async (itemId, quantity) => {
  const res = await api.put(`/cart/items/${itemId}`, null, { params: { quantity } })
  return res.data.data
}

export const removeItem = async (itemId) => {
  const res = await api.delete(`/cart/items/${itemId}`)
  return res.data.data
}

export const clearCart = async () => {
  await api.delete('/cart')
}

export default { getCart, addItem, updateQuantity, removeItem, clearCart }

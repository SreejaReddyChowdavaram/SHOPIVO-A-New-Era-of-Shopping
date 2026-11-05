/**
 * wishlistService.js — Wishlist API calls
 *
 * All endpoints require CUSTOMER role.
 */

import api from './api'

export const getWishlist = async () => {
  const res = await api.get('/wishlist')
  return res.data.data
}

export const addItem = async (productId) => {
  const res = await api.post('/wishlist/items', null, { params: { productId } })
  return res.data.data
}

export const removeItem = async (itemId) => {
  const res = await api.delete(`/wishlist/items/${itemId}`)
  return res.data.data
}

export const moveToCart = async (itemId) => {
  const res = await api.post(`/wishlist/items/${itemId}/move-to-cart`)
  return res.data.data
}

export default { getWishlist, addItem, removeItem, moveToCart }

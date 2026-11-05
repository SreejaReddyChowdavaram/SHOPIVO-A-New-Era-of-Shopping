/**
 * cartSlice.js — Lightweight cart summary for the navbar badge.
 *
 * WHY NOT STORE THE FULL CART HERE?
 *   The full cart (items, prices, images) is server data — we keep it in
 *   component state (via useEffect + useState) to stay in sync with the DB.
 *   The Redux slice holds only the SUMMARY (item count + subtotal) so every
 *   component can read the badge count without triggering a full cart fetch.
 *
 * SYNC STRATEGY:
 *   After every cart mutation (add, update, remove, clear), the calling
 *   component dispatches updateCartSummary({ itemCount, subtotal }) with
 *   the values from the API response. This keeps the badge live without
 *   a separate polling request.
 *
 * USAGE:
 *   dispatch(updateCartSummary({ itemCount, subtotal }))  → after add/remove
 *   dispatch(clearCartSummary())                          → after logout or clear
 *   useSelector(selectCartItemCount)                      → navbar badge
 *   useSelector(selectCartSubtotal)                       → mini-cart total
 */

import { createSlice } from '@reduxjs/toolkit'

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    itemCount: 0,
    subtotal: 0,
  },
  reducers: {
    /**
     * updateCartSummary — called after any cart API mutation returns a CartResponse.
     * Payload: { itemCount: number, subtotal: number }
     */
    updateCartSummary: (state, action) => {
      state.itemCount = action.payload.itemCount ?? 0
      state.subtotal  = action.payload.subtotal ?? 0
    },

    /** clearCartSummary — called on logout or after cart is cleared */
    clearCartSummary: (state) => {
      state.itemCount = 0
      state.subtotal  = 0
    },
  },
})

export const { updateCartSummary, clearCartSummary } = cartSlice.actions

// ─── Selectors ───────────────────────────────────────────────
export const selectCartItemCount = (state) => state.cart.itemCount
export const selectCartSubtotal  = (state) => state.cart.subtotal

export default cartSlice.reducer

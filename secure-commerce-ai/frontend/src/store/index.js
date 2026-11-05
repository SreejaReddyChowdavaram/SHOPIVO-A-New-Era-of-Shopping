/**
 * store/index.js — Redux Store Configuration
 *
 * configureStore() from Redux Toolkit automatically:
 *   1. Sets up Redux DevTools Extension support (install it in Chrome/Firefox!)
 *   2. Adds thunk middleware (for async actions — used in auth phase)
 *   3. Enables serializable state check in development
 *
 * HOW COMPONENTS ACCESS THE STORE:
 *   import { useSelector, useDispatch } from 'react-redux'
 *   import { selectIsAuthenticated } from '@/store/authSlice'
 *
 *   const isAuthenticated = useSelector(selectIsAuthenticated)
 *   const dispatch = useDispatch()
 *
 * ADDING MORE SLICES (future phases):
 *   import cartReducer from './cartSlice'
 *   reducer: { auth: authReducer, cart: cartReducer }
 */

import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import cartReducer from './cartSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    // Future slices:
    // notifications: notificationsReducer,
  },
})


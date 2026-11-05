/**
 * authService.js — Authentication API Calls
 *
 * All auth-related HTTP calls are in one file.
 * Components never import axios directly — they call authService.
 *
 * HOW THIS CONNECTS TO THE BACKEND (once Java is installed and running):
 *
 *   POST /api/auth/register → RegisterRequest body → AuthResponse
 *   POST /api/auth/login    → LoginRequest body    → AuthResponse
 *   GET  /api/auth/me       → (JWT in header)      → UserResponse
 *
 * AuthResponse shape (what the backend returns):
 *   {
 *     "success": true,
 *     "data": {
 *       "accessToken": "eyJhbGci...",
 *       "tokenType": "Bearer",
 *       "user": { "id": 1, "email": "...", "firstName": "...", "role": "CUSTOMER" }
 *     }
 *   }
 *
 * LESSON — Why not put Axios calls directly in components?
 *   If the API endpoint changes from /auth/login to /auth/signin,
 *   you change it in ONE place here — not across 5 components.
 *   Testability: you can mock authService in tests without touching React.
 */

import api, { TOKEN_KEY } from './api'

const authService = {

  /**
   * Register a new user (Customer or Seller).
   *
   * @param {Object} payload - { email, password, firstName, lastName, role }
   * @returns {Object} - AuthResponse data from backend
   */
  register: async (payload) => {
    const response = await api.post('/auth/register', payload)
    // Backend wraps response in ApiResponse<AuthResponse>
    // response.data = { success: true, data: { accessToken, user, ... } }
    return response.data.data
  },

  /**
   * Log in with email + password.
   *
   * @param {Object} payload - { email, password }
   * @returns {Object} - AuthResponse data from backend
   */
  login: async (payload) => {
    const response = await api.post('/auth/login', payload)
    return response.data.data
  },

  /**
   * Get the currently authenticated user's profile.
   * Uses the JWT token attached automatically by the api.js interceptor.
   *
   * @returns {Object} - UserResponse from backend
   */
  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return response.data.data
  },

  /**
   * Log out.
   * Sends LOGOUT event to the backend for audit & session analytics,
   * then removes the JWT from localStorage.
   *
   * The Redux store is cleared by the calling component via dispatch(logout()).
   */
  logout: () => {
    api.post('/auth/logout').catch(() => {})
    localStorage.removeItem(TOKEN_KEY)
  },
}

export default authService

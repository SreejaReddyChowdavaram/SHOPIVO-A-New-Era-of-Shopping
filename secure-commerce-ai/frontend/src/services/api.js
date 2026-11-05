/**
 * api.js — Shared Axios Instance (API Client)
 *
 * WHY A SHARED INSTANCE?
 *   Every service (authService, productService, orderService…) needs:
 *   1. The same base URL
 *   2. The JWT attached to every request automatically
 *   3. Consistent error handling
 *
 *   Creating one Axios instance with interceptors here means every service
 *   just calls `api.get(...)` — no manual token attachment anywhere else.
 *
 * HOW INTERCEPTORS WORK:
 *   Request interceptor  → runs BEFORE the request is sent
 *   Response interceptor → runs AFTER the response arrives
 *
 * REQUEST INTERCEPTOR:
 *   Reads the token from localStorage and adds:
 *   `Authorization: Bearer <token>` to every outgoing request.
 *   If no token exists (user is logged out), the header is simply not added.
 *
 * RESPONSE INTERCEPTOR:
 *   The backend returns errors in our ApiError shape:
 *   { status, error, message, details, path, timestamp }
 *   The interceptor extracts `message` and `details` and puts them on the
 *   thrown Error so components can do: catch(e) → e.message, e.details.
 *
 * ENVIRONMENT VARIABLE:
 *   VITE_API_URL is read from the frontend .env file:
 *   VITE_API_URL=http://localhost:8080/api
 *   (Never hardcode localhost:8080 — this breaks in staging/production)
 */

import axios from 'axios'

// Token key in localStorage — must match the key used in authSlice
export const TOKEN_KEY = 'sc_access_token'
export const SESSION_KEY = 'sc_session_id'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,  // 15 seconds — fail fast if the backend is unreachable
})

// ─── Request Interceptor ─────────────────────────────────────
// Attach JWT token and lightweight research session correlation header automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    let sessionId = sessionStorage.getItem(SESSION_KEY)
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36)
      sessionStorage.setItem(SESSION_KEY, sessionId)
    }
    config.headers['X-Session-Id'] = sessionId

    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor ────────────────────────────────────
// Normalize the backend's ApiError shape into a JS Error and persist returned session headers
api.interceptors.response.use(
  (response) => {
    const respSessionId = response?.headers?.['x-session-id']
    if (respSessionId) {
      sessionStorage.setItem(SESSION_KEY, respSessionId)
    }
    return response
  },
  (error) => {
    if (error.response) {
      // Backend returned a response (4xx, 5xx)
      const { data, status } = error.response

      // Build a rich error object from the backend's ApiError shape
      const enhancedError = new Error(
        data?.message || 'An unexpected error occurred'
      )
      enhancedError.status = status
      enhancedError.details = data?.details || []
      enhancedError.apiError = data    // Full ApiError body, for debugging

      // 401 → token expired or invalid — clear it and let ProtectedRoute redirect
      if (status === 401) {
        localStorage.removeItem(TOKEN_KEY)
        // Don't navigate here — ProtectedRoute reacts to Redux state change
      }

      return Promise.reject(enhancedError)
    }

    if (error.request) {
      // Request was made but no response received (network error, CORS, server down)
      const networkError = new Error(
        'Cannot reach the server. Please check your connection.'
      )
      networkError.status = 0
      networkError.details = []
      return Promise.reject(networkError)
    }

    // Something went wrong setting up the request
    return Promise.reject(error)
  }
)

export default api

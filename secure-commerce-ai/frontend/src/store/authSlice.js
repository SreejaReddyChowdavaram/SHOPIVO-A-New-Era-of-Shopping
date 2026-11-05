/**
 * authSlice.js — Real Authentication State (Redux Toolkit)
 *
 * CHANGES FROM PLACEHOLDER:
 *   - isAuthenticated: false by default (real state)
 *   - Token rehydrated from localStorage on app load
 *   - login(), logout(), setUser() reducers
 *   - Token is persisted to localStorage in the login reducer
 *
 * TOKEN PERSISTENCE STRATEGY:
 *   We store the JWT in localStorage (not a cookie) because:
 *   1. Cookies require CSRF protection — we disabled CSRF in SecurityConfig
 *   2. localStorage survives page refresh — user stays logged in
 *   3. The Axios interceptor in api.js reads it automatically
 *
 *   Security note: localStorage is vulnerable to XSS. In a
 *   production financial app, HttpOnly cookies are more secure.
 *   For this learning project, localStorage is acceptable.
 *
 * REHYDRATION:
 *   On every page load, we read the token from localStorage.
 *   If it exists, we set isAuthenticated: true with the stored user.
 *   This means: refresh the page → still logged in (until token expires).
 *   The token's actual validity is checked by the backend — if it's
 *   expired, the next API call returns 401 and the interceptor clears it.
 *
 * HOW TO USE:
 *   dispatch(login({ token, user, role }))  → after successful login/register
 *   dispatch(logout())                       → on logout button click
 *   dispatch(setUser(userObj))               → after GET /auth/me refresh
 */

import { createSlice } from '@reduxjs/toolkit'
import { TOKEN_KEY } from '@/services/api'

// ─── Token Rehydration ───────────────────────────────────────
// Read persisted token from localStorage on module load.
// We store user data alongside the token as JSON.
const loadPersistedAuth = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const userJson = localStorage.getItem('sc_user')
    if (token && userJson) {
      const user = JSON.parse(userJson)
      return {
        isAuthenticated: true,
        token,
        user,
        role: user.role || null,
      }
    }
  } catch {
    // Corrupted localStorage — treat as logged out
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('sc_user')
  }
  return {
    isAuthenticated: false,
    token: null,
    user: null,
    role: null,
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState: loadPersistedAuth(),   // rehydrate from localStorage
  reducers: {
    /**
     * login — called after successful API response from authService.login()
     *         or authService.register()
     *
     * Payload: { token: string, user: { id, email, firstName, lastName, role }, role: string }
     *
     * Persists both token and user to localStorage so page refresh keeps the session.
     */
    login: (state, action) => {
      const { token, user, role } = action.payload
      state.isAuthenticated = true
      state.token = token
      state.user = user
      state.role = role || user?.role

      // Persist to localStorage
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem('sc_user', JSON.stringify(user))
    },

    /**
     * logout — called from any layout's logout button
     *
     * Clears Redux state and localStorage.
     * authService.logout() also removes the token from localStorage,
     * but we do it here too for safety (belt and suspenders).
     */
    logout: (state) => {
      state.isAuthenticated = false
      state.token = null
      state.user = null
      state.role = null

      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem('sc_user')
    },

    /**
     * setUser — called after GET /auth/me to refresh user data
     * Useful when user updates their profile in a later phase.
     */
    setUser: (state, action) => {
      state.user = action.payload
      state.role = action.payload?.role
      if (action.payload) {
        localStorage.setItem('sc_user', JSON.stringify(action.payload))
      }
    },
  },
})

export const { login, logout, setUser } = authSlice.actions

// ─── Selectors ───────────────────────────────────────────────
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectCurrentUser = (state) => state.auth.user
export const selectCurrentRole = (state) => state.auth.role
export const selectToken = (state) => state.auth.token

export default authSlice.reducer

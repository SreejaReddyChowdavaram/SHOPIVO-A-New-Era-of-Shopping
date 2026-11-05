/**
 * ProtectedRoute.jsx — Authentication Gate
 *
 * HOW IT WORKS:
 *   Every route that requires login is wrapped in this component.
 *   React Router renders <Outlet /> when the child route matches —
 *   ProtectedRoute intercepts that render and checks auth first.
 *
 * CURRENT BEHAVIOR (Placeholder):
 *   Reads `isAuthenticated` from Redux store (currently defaults to true).
 *   Change `isAuthenticated: false` in authSlice.js to test the redirect.
 *
 * REAL AUTH PHASE:
 *   This component requires NO changes. When the login API call succeeds
 *   and dispatches setCredentials(), `isAuthenticated` becomes true and
 *   this gate opens automatically.
 *
 * REACT ROUTER PATTERN — Outlet-based guard:
 *   <Route element={<ProtectedRoute />}>    ← gate component
 *     <Route path="/customer/dashboard" element={<Dashboard />} />
 *   </Route>
 *
 *   If isAuthenticated → renders <Outlet /> → Dashboard renders
 *   If !isAuthenticated → renders <Navigate to="/login" /> → redirects
 *
 *   `replace` on Navigate replaces the current history entry so the user
 *   can't click "back" to return to the protected page after redirect.
 *   `state={{ from: location }}` passes the originally requested URL to
 *   the Login page — after login, the user is redirected back there.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated } from '@/store/authSlice'
import { ROUTES } from '@/constants/routes'

const ProtectedRoute = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <Navigate
        to={ROUTES.LOGIN}
        replace
        state={{ from: location }}  // Login page can redirect back here after login
      />
    )
  }

  return <Outlet />
}

export default ProtectedRoute

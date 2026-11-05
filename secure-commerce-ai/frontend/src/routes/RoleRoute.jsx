/**
 * RoleRoute.jsx — Authorization Gate (Role-Based Access Control)
 *
 * HOW IT WORKS:
 *   Wraps ProtectedRoute (ensuring the user is authenticated first),
 *   then additionally checks whether the current user's role is in the
 *   `allowedRoles` prop.
 *
 *   Layer 1 (ProtectedRoute): Is the user logged in?
 *   Layer 2 (RoleRoute):      Does the user have the correct role?
 *
 * USAGE IN AppRoutes:
 *   <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
 *     <Route path="/admin/*" element={<AdminLayout />}>
 *       ...admin routes...
 *     </Route>
 *   </Route>
 *
 * LESSON — Why separate ProtectedRoute and RoleRoute?
 *   Single Responsibility Principle. ProtectedRoute does ONE thing (auth).
 *   RoleRoute does ONE thing (role check). Easy to test, easy to reason about.
 *   We don't mix "is logged in?" and "has permission?" in one component.
 *
 * TESTING:
 *   To test role enforcement: change `role` in authSlice.js initialState.
 *   CUSTOMER trying to access /admin/* → redirects to /forbidden.
 */

import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated, selectCurrentRole } from '@/store/authSlice'
import { ROUTES } from '@/constants/routes'
import ProtectedRoute from './ProtectedRoute'

const RoleRoute = ({ allowedRoles }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const role = useSelector(selectCurrentRole)

  // Not logged in → ProtectedRoute handles the redirect to /login
  if (!isAuthenticated) {
    return <ProtectedRoute />
  }

  // Logged in but wrong role → redirect to Forbidden page
  if (!allowedRoles.includes(role)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />
  }

  return <Outlet />
}

export default RoleRoute

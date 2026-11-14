/**
 * AppRoutes.jsx — Single Source of Truth for All Application Routes
 *
 * WHY ONE FILE?
 *   Every route in the application is defined here. No routing logic is
 *   scattered across components. If a route needs to change, it changes
 *   in exactly one place.
 *
 * REACT ROUTER v7 NESTED ROUTE PATTERN:
 *   <Route element={<Shell />}>          ← layout / guard component
 *     <Route path="..." element={<Page />} />  ← renders inside Shell's <Outlet />
 *   </Route>
 *
 *   This nesting means:
 *   - AuthLayout renders once, Outlet = the matched auth page
 *   - RoleRoute checks role, then CustomerLayout renders, Outlet = customer page
 *   - Guards (ProtectedRoute, RoleRoute) are in the parent, not repeated per route
 *
 * ROUTE STRUCTURE (top to bottom):
 *
 *   /                         → redirect to /login
 *
 *   /login                    ┐
 *   /register                 │ AuthLayout (no auth required)
 *   /forgot-password          │
 *   /verify-otp               │
 *   /reset-password           ┘
 *
 *   /forbidden                → Forbidden (standalone)
 *
 *   /customer/*               ┐ RoleRoute([CUSTOMER])
 *     dashboard               │   └── CustomerLayout
 *     profile                 │         └── <Outlet /> = customer pages
 *     products                │
 *     products/:id            │
 *     cart                    │
 *     wishlist                │
 *     checkout                │
 *     orders                  │
 *     orders/:id              │
 *     payments                │
 *     reviews                 │
 *     returns                 │
 *     refunds                 │
 *     notifications           ┘
 *
 *   /seller/*                 ┐ RoleRoute([SELLER])
 *     dashboard               │   └── SellerLayout
 *     profile                 │
 *     products                │
 *     products/add            │
 *     products/:id/edit       │
 *     inventory               │
 *     orders                  │
 *     orders/:id              │
 *     revenue                 │
 *     reviews                 │
 *     notifications           ┘
 *
 *   /admin/*                  ┐ RoleRoute([ADMIN])
 *     dashboard               │   └── AdminLayout
 *     users                   │
 *     customers               │
 *     sellers                 │
 *     sellers/verification    │
 *     products                │
 *     orders                  │
 *     payments                │
 *     inventory               │
 *     reviews                 │
 *     reports                 │
 *     analytics               │
 *     notifications           ┘
 *
 *   *                         → NotFound
 */

import { Routes, Route, Navigate } from 'react-router-dom'
import { ROLES } from '@/constants/routes'

// Guards
import ProtectedRoute from './ProtectedRoute'
import RoleRoute from './RoleRoute'

// Layouts
import AuthLayout from '@/layouts/AuthLayout'
import CustomerLayout from '@/layouts/CustomerLayout'
import AccountLayout from '@/layouts/AccountLayout'
import SellerLayout from '@/layouts/SellerLayout'
import AdminLayout from '@/layouts/AdminLayout'

// Auth pages
import PortalSelection from '@/pages/auth/PortalSelection'
import CustomerAuth from '@/pages/auth/CustomerAuth'
import SellerAuth from '@/pages/auth/SellerAuth'
import AdminAuth from '@/pages/auth/AdminAuth'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import VerifyOtp from '@/pages/auth/VerifyOtp'
import ResetPassword from '@/pages/auth/ResetPassword'
import Forbidden from '@/pages/auth/Forbidden'

// Customer pages
import CustomerDashboard from '@/pages/customer/Dashboard'
import CustomerAnalytics from '@/pages/customer/CustomerAnalytics'
import CustomerProfile from '@/pages/customer/Profile'
import Products from '@/pages/customer/Products'
import ProductDetails from '@/pages/customer/ProductDetails'
import Cart from '@/pages/customer/Cart'
import Wishlist from '@/pages/customer/Wishlist'
import Checkout from '@/pages/customer/Checkout'
import CustomerOrders from '@/pages/customer/Orders'
import CustomerOrderDetails from '@/pages/customer/OrderDetails'
import Payments from '@/pages/customer/Payments'
import CustomerReviews from '@/pages/customer/Reviews'
import Returns from '@/pages/customer/Returns'
import Refunds from '@/pages/customer/Refunds'
import CustomerNotifications from '@/pages/customer/Notifications'
import CustomerLoginActivity from '@/pages/customer/LoginActivity'

// Seller pages
import SellerDashboard from '@/pages/seller/Dashboard'
import SellerProfile from '@/pages/seller/Profile'
import SellerProducts from '@/pages/seller/Products'
import AddProduct from '@/pages/seller/AddProduct'
import EditProduct from '@/pages/seller/EditProduct'
import Inventory from '@/pages/seller/Inventory'
import SellerOrders from '@/pages/seller/Orders'
import SellerOrderDetails from '@/pages/seller/OrderDetails'
import SellerAnalytics from '@/pages/seller/Analytics'
import SellerReviews from '@/pages/seller/Reviews'
import SellerNotifications from '@/pages/seller/Notifications'
import SellerLoginActivity from '@/pages/seller/LoginActivity'
import SellerRefunds from '@/pages/seller/Refunds'

// Admin pages
import AdminDashboard from '@/pages/admin/Dashboard'
import AdminProfile from '@/pages/admin/Profile'
import AdminUsers from '@/pages/admin/Users'
import AdminCustomers from '@/pages/admin/Customers'
import AdminSellers from '@/pages/admin/Sellers'
import AdminSellerDetails from '@/pages/admin/SellerDetails'
import SellerVerification from '@/pages/admin/SellerVerification'
import AdminProducts from '@/pages/admin/Products'
import AdminOrders from '@/pages/admin/Orders'
import AdminOrderDetails from '@/pages/admin/OrderDetails'
import AdminPayments from '@/pages/admin/Payments'
import AdminRefunds from '@/pages/admin/Refunds'
import AdminInventory from '@/pages/admin/Inventory'
import AdminReviews from '@/pages/admin/Reviews'
import Reports from '@/pages/admin/Reports'
import Analytics from '@/pages/admin/Analytics'
import AdminNotifications from '@/pages/admin/Notifications'
import LoginHistory from '@/pages/admin/LoginHistory'

// Public pages
import LandingPage from '@/pages/public/LandingPage'

// Utility pages
import NotFound from '@/pages/NotFound'

const AppRoutes = () => {
  return (
    <Routes>

      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* ── Role-Based Authentication & Portal Selection ─── */}
      <Route path="/auth/portal-selection" element={<PortalSelection />} />
      <Route path="/auth/customer"         element={<CustomerAuth />} />
      <Route path="/auth/seller"           element={<SellerAuth />} />
      <Route path="/auth/admin"            element={<AdminAuth />} />
      <Route path="/forgot-password"       element={<ForgotPassword />} />

      {/* Aliases & Direct Redirects for Portals */}
      <Route path="/login"          element={<Navigate to="/auth/portal-selection" replace />} />
      <Route path="/register"       element={<Navigate to="/auth/portal-selection" replace />} />
      <Route path="/signup"         element={<Navigate to="/auth/portal-selection" replace />} />
      <Route path="/admin/login"    element={<Navigate to="/auth/admin" replace />} />
      <Route path="/seller/login"   element={<Navigate to="/auth/seller" replace />} />
      <Route path="/verify-otp"     element={<Navigate to="/forgot-password" replace />} />
      <Route path="/reset-password" element={<Navigate to="/forgot-password" replace />} />

      {/* Forbidden — standalone, no layout */}
      <Route path="/forbidden" element={<Forbidden />} />
      <Route path="/403" element={<Navigate to="/forbidden" replace />} />
      <Route path="/unauthorized" element={<Navigate to="/forbidden" replace />} />

      {/* ── Customer Routes ───────────────────────────── */}
      <Route element={<RoleRoute allowedRoles={[ROLES.CUSTOMER]} />}>
        <Route element={<CustomerLayout />}>
          <Route path="/customer"                  element={<Navigate to="/customer/dashboard" replace />} />
          {/* Public browsing, marketplace home & checkout (full width) */}
          <Route path="/customer/dashboard"        element={<CustomerDashboard />} />
          <Route path="/customer/products"         element={<Products />} />
          <Route path="/customer/products/:id"     element={<ProductDetails />} />
          <Route path="/customer/cart"             element={<Cart />} />
          <Route path="/customer/checkout"         element={<Checkout />} />

          {/* Customer Account Section (persistent sidebar) */}
          <Route element={<AccountLayout />}>
            <Route path="/customer/analytics"        element={<CustomerAnalytics />} />
            <Route path="/customer/profile"          element={<CustomerProfile />} />
            <Route path="/customer/wishlist"         element={<Wishlist />} />
            <Route path="/customer/orders"           element={<CustomerOrders />} />
            <Route path="/customer/orders/:id"       element={<CustomerOrderDetails />} />
            <Route path="/customer/payments"         element={<Payments />} />
            <Route path="/customer/reviews"          element={<CustomerReviews />} />
            <Route path="/customer/returns"          element={<Returns />} />
            <Route path="/customer/refunds"          element={<Refunds />} />
            <Route path="/customer/notifications"    element={<CustomerNotifications />} />
            <Route path="/customer/login-activity"   element={<CustomerLoginActivity />} />
          </Route>
        </Route>
      </Route>

      {/* ── Seller Routes ─────────────────────────────── */}
      <Route element={<RoleRoute allowedRoles={[ROLES.SELLER]} />}>
        <Route element={<SellerLayout />}>
          <Route path="/seller"                    element={<Navigate to="/seller/dashboard" replace />} />
          <Route path="/seller/dashboard"          element={<SellerDashboard />} />
          <Route path="/seller/profile"            element={<SellerProfile />} />
          <Route path="/seller/products"           element={<SellerProducts />} />
          <Route path="/seller/products/add"       element={<AddProduct />} />
          <Route path="/seller/products/:id/edit"  element={<EditProduct />} />
          <Route path="/seller/inventory"          element={<Inventory />} />
          <Route path="/seller/orders"             element={<SellerOrders />} />
          <Route path="/seller/orders/:id"         element={<SellerOrderDetails />} />
          <Route path="/seller/refunds"            element={<SellerRefunds />} />
          <Route path="/seller/revenue"            element={<Navigate to="/seller/analytics" replace />} />
          <Route path="/seller/analytics"          element={<SellerAnalytics />} />
          <Route path="/seller/reviews"            element={<SellerReviews />} />
          <Route path="/seller/notifications"      element={<SellerNotifications />} />
          <Route path="/seller/login-activity"     element={<SellerLoginActivity />} />
        </Route>
      </Route>

      {/* ── Admin Routes ──────────────────────────────── */}
      <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin"                        element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/profile"                element={<AdminProfile />} />
          <Route path="/admin/dashboard"              element={<AdminDashboard />} />
          <Route path="/admin/users"                  element={<AdminUsers />} />
          <Route path="/admin/customers"              element={<AdminCustomers />} />
          <Route path="/admin/sellers"                element={<AdminSellers />} />
          <Route path="/admin/sellers/:id"            element={<AdminSellerDetails />} />
          <Route path="/admin/sellers/verification"   element={<SellerVerification />} />
          <Route path="/admin/login-history"          element={<LoginHistory />} />
          <Route path="/admin/products"               element={<AdminProducts />} />
          <Route path="/admin/orders"                 element={<AdminOrders />} />
          <Route path="/admin/orders/:id"             element={<AdminOrderDetails />} />
          <Route path="/admin/payments"               element={<AdminPayments />} />
          <Route path="/admin/refunds"                element={<AdminRefunds />} />
          <Route path="/admin/inventory"              element={<AdminInventory />} />
          <Route path="/admin/reviews"                element={<AdminReviews />} />
          <Route path="/admin/reports"                element={<Reports />} />
          <Route path="/admin/analytics"              element={<Analytics />} />
          <Route path="/admin/notifications"          element={<AdminNotifications />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />

    </Routes>
  )
}

export default AppRoutes

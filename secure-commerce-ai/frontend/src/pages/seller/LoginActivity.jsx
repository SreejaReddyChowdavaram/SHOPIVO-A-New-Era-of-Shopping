/**
 * LoginActivity.jsx — Seller Login History & Security Page
 * Route: /seller/login-activity
 * Layout: SellerLayout
 */

import React from 'react'
import UserLoginActivityView from '@/components/security/UserLoginActivityView'

const SellerLoginActivity = () => {
  return (
    <div className="w-full min-h-[calc(100vh-5rem)] py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <UserLoginActivityView portalName="Seller" />
    </div>
  )
}

export default SellerLoginActivity

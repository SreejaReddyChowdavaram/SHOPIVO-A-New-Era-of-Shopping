/**
 * LoginActivity.jsx — Customer Login History & Security Page
 * Route: /customer/login-activity
 * Layout: CustomerLayout
 */

import React from 'react'
import UserLoginActivityView from '@/components/security/UserLoginActivityView'

const CustomerLoginActivity = () => {
  return (
    <div className="w-full min-h-[calc(100vh-5rem)] py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <UserLoginActivityView portalName="Customer" />
    </div>
  )
}

export default CustomerLoginActivity

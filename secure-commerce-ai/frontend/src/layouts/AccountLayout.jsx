/**
 * AccountLayout.jsx — Account Routes Pass-Through
 * The global fixed sidebar is now hosted by CustomerLayout.
 */

import { Outlet } from 'react-router-dom'

const AccountLayout = () => {
  return <Outlet />
}

export default AccountLayout

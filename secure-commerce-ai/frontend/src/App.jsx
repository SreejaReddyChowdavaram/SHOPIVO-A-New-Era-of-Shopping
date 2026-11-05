/**
 * App.jsx — Root Component
 *
 * Now simply renders the route tree.
 * All route logic lives in AppRoutes.jsx.
 *
 * Previously (initialization phase): contained the project status screen.
 * Now (routing phase): delegates entirely to the router.
 *
 * This pattern keeps App.jsx clean — it should never contain business logic.
 * Future additions that affect the whole app (e.g., a global Toast provider,
 * a theme provider) would wrap AppRoutes here.
 */

import AppRoutes from '@/routes/AppRoutes'
import { ThemeProvider } from '@/context/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  )
}

export default App

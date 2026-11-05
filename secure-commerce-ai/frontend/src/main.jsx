/**
 * main.jsx — Application Entry Point
 *
 * WHAT HAPPENS HERE:
 *   React mounts the entire app into <div id="root"> in index.html.
 *
 * WRAPPER ORDER (outermost → innermost):
 *
 *   <StrictMode>           → React development helper. Intentionally calls
 *                            some lifecycle methods twice to surface side-effects.
 *                            Has ZERO effect in production builds.
 *
 *   <Provider store={store}> → Makes the Redux store available to every component
 *                              in the tree via useSelector/useDispatch.
 *                              Without this, useSelector would throw an error.
 *
 *   <BrowserRouter>        → Enables React Router. Provides the current URL
 *                            and navigation functions to all components via
 *                            useNavigate, useLocation, useParams, NavLink, etc.
 *                            Uses the browser's History API (no # in URLs).
 *
 *   <App />                → Root component — renders <AppRoutes />
 *
 * ORDER MATTERS:
 *   Provider must wrap BrowserRouter so that route components can access
 *   the Redux store (ProtectedRoute reads auth state from Redux).
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from '@/store/index'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>
)

import React, { useState, useEffect, useRef } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export default function GoogleSignInButton({
  onCredentialReceived,
  onError,
  portalRole = 'CUSTOMER',
  buttonText = 'Continue with Google',
  disabled = false,
  className = '',
}) {
  const [loading, setLoading] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [configError, setConfigError] = useState(null)
  const containerRef = useRef(null)

  // Determine current theme
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  useEffect(() => {
    // 1. Verify Google Client ID configuration
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('placeholder')) {
      setConfigError('Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in frontend/.env')
      return
    }

    // 2. Ensure Google Identity Services script is loaded
    const checkGsi = () => {
      if (window.google?.accounts?.id) {
        setScriptLoaded(true)
        return true
      }
      return false
    }

    if (checkGsi()) return

    const existingScript = document.getElementById('google-gsi-client')
    if (!existingScript) {
      const script = document.createElement('script')
      script.id = 'google-gsi-client'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        setScriptLoaded(true)
      }
      script.onerror = () => {
        setConfigError('Failed to load Google Identity Services library. Please check your network.')
      }
      document.body.appendChild(script)
    } else {
      const interval = setInterval(() => {
        if (checkGsi()) {
          clearInterval(interval)
        }
      }, 100)
      return () => clearInterval(interval)
    }
  }, [])

  // 3. Initialize and Render Official Google Sign-In Button
  useEffect(() => {
    if (!scriptLoaded || !window.google?.accounts?.id || !GOOGLE_CLIENT_ID || configError) return

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          setLoading(false)
          if (response?.credential) {
            onCredentialReceived(response.credential)
          } else if (onError) {
            onError('Google did not return an authentication credential.')
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      })

      if (containerRef.current) {
        containerRef.current.innerHTML = ''
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: isDark ? 'filled_black' : 'outline',
          size: 'large',
          type: 'standard',
          text: buttonText.toLowerCase().includes('sign up') || buttonText.toLowerCase().includes('register')
            ? 'signup_with'
            : 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: containerRef.current.offsetWidth || 340,
        })
      }

      // Also trigger optional One Tap prompt if supported by browser environment
      try {
        window.google.accounts.id.prompt()
      } catch {
        // One Tap prompt suppression is normal on localhost/FedCM
      }
    } catch (err) {
      console.warn('Google Identity Services initialization warning:', err)
    }
  }, [scriptLoaded, isDark, buttonText, configError])

  if (configError) {
    return (
      <div className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span className="leading-tight">{configError}</span>
      </div>
    )
  }

  return (
    <div className={`w-full flex flex-col items-center justify-center ${className}`}>
      {/* Official Google Identity Services Render Target */}
      <div
        ref={containerRef}
        className="w-full flex justify-center min-h-[44px]"
        style={{ width: '100%', maxWidth: '100%' }}
      />

      {/* Loading state before Google SDK mounts */}
      {!scriptLoaded && (
        <div className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] text-xs font-semibold">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
          <span>Connecting to Google Sign-In...</span>
        </div>
      )}
    </div>
  )
}

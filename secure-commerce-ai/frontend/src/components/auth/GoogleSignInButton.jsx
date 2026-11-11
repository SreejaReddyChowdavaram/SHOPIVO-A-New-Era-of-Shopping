import React, { useState, useEffect } from 'react'
import { Loader2, ExternalLink, X, Info } from 'lucide-react'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export default function GoogleSignInButton({
  onCredentialReceived,
  portalRole = 'CUSTOMER',
  buttonText = 'Continue with Google',
  disabled = false,
  className = '',
}) {
  const [loading, setLoading] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)

  // Initialize GIS if client ID is configured
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('placeholder')) return

    const loadGsiScript = () => {
      if (document.getElementById('google-gsi-client')) return
      const script = document.createElement('script')
      script.id = 'google-gsi-client'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      document.body.appendChild(script)
    }

    loadGsiScript()
  }, [])

  const handleGoogleClick = () => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('placeholder')) {
      // Configuration instructions modal
      setShowConfigModal(true)
      return
    }

    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      setShowConfigModal(true)
      return
    }

    try {
      setLoading(true)
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          setLoading(false)
          if (response && response.credential) {
            onCredentialReceived(response.credential)
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      })

      window.google.accounts.id.prompt((notification) => {
        if (
          notification.isNotDisplayed() ||
          notification.isSkippedMoment() ||
          (notification.isDismissedMoment && notification.isDismissedMoment())
        ) {
          setLoading(false)
        }
      })
    } catch (err) {
      setLoading(false)
      setShowConfigModal(true)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={disabled || loading}
        className={`w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer shadow-xs hover:border-[var(--color-primary)] disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
        aria-label={`${buttonText} as ${portalRole}`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
        ) : (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
        )}
        <span>{buttonText}</span>
      </button>

      {/* Helpful Setup Guide Modal if Client ID is unconfigured */}
      {showConfigModal && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 shadow-2xl text-[var(--color-text-primary)]">
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-3 text-[var(--color-primary)]">
              <Info className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-base text-[var(--color-text-primary)]">Google OAuth Setup Guide</h3>
            </div>

            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-4">
              Genuine Google Sign-In requires an authorized Google Cloud Client ID for this domain.
            </p>

            <div className="space-y-2 text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg)] p-3.5 rounded-xl border border-[var(--color-border)] mb-4">
              <p className="font-semibold text-[var(--color-text-primary)]">To connect real Google credentials:</p>
              <ol className="list-decimal pl-4 space-y-1 text-[var(--color-text-secondary)]">
                <li>Visit <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-[var(--color-primary)] underline">Google Cloud Console</a>.</li>
                <li>Go to <strong>APIs & Services → Credentials</strong>.</li>
                <li>Create <strong>OAuth 2.0 Client ID</strong> (Web application).</li>
                <li>Add Authorized JS Origins: <code className="text-[var(--color-primary)] bg-[var(--color-surface)] px-1 rounded">http://localhost:5173</code> and <code className="text-[var(--color-primary)] bg-[var(--color-surface)] px-1 rounded">http://127.0.0.1:5173</code>.</li>
                <li>Add to <code className="text-[var(--color-text-primary)]">frontend/.env</code> as <code className="text-[var(--color-primary)]">VITE_GOOGLE_CLIENT_ID</code>.</li>
                <li>Add to <code className="text-[var(--color-text-primary)]">backend/.env</code> as <code className="text-[var(--color-primary)]">GOOGLE_CLIENT_ID</code>.</li>
              </ol>
            </div>

            <button
              type="button"
              onClick={() => setShowConfigModal(false)}
              className="w-full py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  )
}

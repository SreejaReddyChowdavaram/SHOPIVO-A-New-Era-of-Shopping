/**
 * ForgotPassword.jsx — SHOPIVO Multi-Step Password Recovery with Email OTP
 *
 * Implements a secure 3-step password recovery flow across Customer, Seller, and Admin portals:
 * - Step 1: Enter Registered Email Address -> Request 6-digit OTP
 * - Step 2: Verify 6-digit OTP with auto-advancing input boxes, paste handling & 60s cooldown timer
 * - Step 3: Create New Password with strength meter & complexity validation
 * - Step 4: Success confirmation and seamless return to the designated portal sign-in
 *
 * Styled in SHOPIVO's CyberForge Black + Vibrant Emerald + White visual identity:
 * - Background: #050505
 * - Card: #101010
 * - Emerald: #04DB7E / #00C77A
 * - Text: #FFFFFF
 * - Secondary Text: #B3B3B3
 * - Borders: #242424
 */

import React, { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Store,
  ShieldAlert,
} from 'lucide-react'
import authService from '@/services/authService'
import BrandLogo from '@/components/common/BrandLogo'
import ThemeToggle from '@/components/common/ThemeToggle'
import AuthAnimatedBackground from '@/components/auth/AuthAnimatedBackground'
import { ROUTES } from '@/constants/routes'

export default function ForgotPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Portal Role determination: default to CUSTOMER, accept SELLER or ADMIN via query param
  const rawPortal = searchParams.get('portal')?.toUpperCase() || 'CUSTOMER'
  const portalRole = ['CUSTOMER', 'SELLER', 'ADMIN'].includes(rawPortal) ? rawPortal : 'CUSTOMER'

  // Portal sign in destination for "Back to Sign In"
  const portalSignInUrl = portalRole === 'ADMIN'
    ? ROUTES.ADMIN_AUTH
    : portalRole === 'SELLER'
      ? ROUTES.SELLER_AUTH
      : ROUTES.CUSTOMER_AUTH

  // Step Management: 1 = Email, 2 = Verify OTP, 3 = Reset Password, 4 = Success
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1: Email Form State
  const [email, setEmail] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')

  // Step 2: 6-Digit OTP State
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [cooldown, setCooldown] = useState(0)
  const [resetToken, setResetToken] = useState(null)
  const otpInputRefs = useRef([])

  // Step 3: New Password State
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // UI / Status State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successNotice, setSuccessNotice] = useState(null)

  // Timer interval for 60-second cooldown
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  // Focus first OTP input when entering Step 2
  useEffect(() => {
    if (currentStep === 2 && otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus()
    }
  }, [currentStep])

  // Password Strength Calculation
  const passwordStrength = (() => {
    if (!newPassword) return { score: 0, label: 'None', color: '#666666' }
    let score = 0
    if (newPassword.length >= 8) score += 1
    if (newPassword.length >= 12) score += 1
    if (/[0-9]/.test(newPassword)) score += 1
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)) score += 1
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score += 1

    if (score <= 1) return { score: 25, label: 'Weak', color: '#EF4444' }
    if (score <= 3) return { score: 60, label: 'Medium', color: '#F59E0B' }
    return { score: 100, label: 'Strong', color: '#04DB7E' }
  })()

  // ─── Step 1 Handler: Request OTP ─────────────────────────────
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault()
    setError(null)
    setSuccessNotice(null)

    if (!email.trim()) {
      setError('Please enter your registered email address.')
      return
    }

    try {
      setLoading(true)
      const data = await authService.requestPasswordResetOtp({
        email: email.trim(),
        portalRole,
      })

      setMaskedEmail(data?.maskedEmail || email)
      setCooldown(data?.cooldownSeconds || 60)
      setSuccessNotice('A 6-digit verification code has been dispatched to your email address.')
      setCurrentStep(2)
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Network error. Unable to reach SHOPIVO authentication server.')
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to dispatch verification code. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ─── Step 2 Handler: Resend OTP ──────────────────────────────
  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return
    setError(null)
    setSuccessNotice(null)

    try {
      setLoading(true)
      const data = await authService.requestPasswordResetOtp({
        email: email.trim(),
        portalRole,
      })

      setCooldown(data?.cooldownSeconds || 60)
      setOtpDigits(['', '', '', '', '', ''])
      if (otpInputRefs.current[0]) otpInputRefs.current[0].focus()
      setSuccessNotice('A fresh verification code has been sent.')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to resend code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Step 2 Handler: OTP Input Change & Focus Management ─────
  const handleOtpChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, '')
    if (!cleanValue) {
      // Empty / deleted digit
      const updated = [...otpDigits]
      updated[index] = ''
      setOtpDigits(updated)
      return
    }

    const digit = cleanValue.slice(-1)
    const updated = [...otpDigits]
    updated[index] = digit
    setOtpDigits(updated)

    // Advance focus to next input box
    if (index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1].focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0 && otpInputRefs.current[index - 1]) {
      otpInputRefs.current[index - 1].focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pastedData) return

    const updated = [...otpDigits]
    for (let i = 0; i < 6; i++) {
      updated[i] = pastedData[i] || ''
    }
    setOtpDigits(updated)

    // Focus last filled or 6th input box
    const nextIdx = Math.min(pastedData.length, 5)
    if (otpInputRefs.current[nextIdx]) {
      otpInputRefs.current[nextIdx].focus()
    }
  }

  // ─── Step 2 Handler: Verify OTP ──────────────────────────────
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault()
    setError(null)
    setSuccessNotice(null)

    const fullOtp = otpDigits.join('')
    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.')
      return
    }

    try {
      setLoading(true)
      const data = await authService.verifyPasswordResetOtp({
        email: email.trim(),
        portalRole,
        otp: fullOtp,
      })

      setResetToken(data?.resetToken || null)
      setSuccessNotice('Code verified successfully. Please create your new password.')
      setCurrentStep(3)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid or expired verification code.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Step 3 Handler: Reset Password ──────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessNotice(null)

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (!/[0-9!@#$%^&*]/.test(newPassword)) {
      setError('Password must contain at least one number or special character.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }

    try {
      setLoading(true)
      const fullOtp = otpDigits.join('')
      await authService.resetPassword({
        email: email.trim(),
        portalRole,
        otp: fullOtp || undefined,
        resetToken: resetToken || undefined,
        newPassword,
        confirmPassword,
      })

      setCurrentStep(4) // Success step
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Portal Badge helper
  const renderPortalBadge = () => {
    if (portalRole === 'ADMIN') {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-950/60 border border-red-500/30 text-red-400">
          <ShieldAlert size={13} />
          <span>Administrator Portal Recovery</span>
        </div>
      )
    }
    if (portalRole === 'SELLER') {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-950/60 border border-[#04DB7E]/30 text-[#04DB7E]">
          <Store size={13} />
          <span>Seller Merchant Portal</span>
        </div>
      )
    }
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800/80 border border-slate-700 text-slate-300">
        <ShoppingBag size={13} />
        <span>Customer Account Recovery</span>
      </div>
    )
  }

  return (
    <div
      className="forgot-password-page"
      style={{
        minHeight: '100vh',
        backgroundColor: '#050505',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      <AuthAnimatedBackground />

      {/* Top Header */}
      <header
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 2rem',
          borderBottom: '1px solid #1C1C1C',
          backgroundColor: 'rgba(8, 8, 8, 0.85)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BrandLogo size="md" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeToggle />
          <Link
            to={portalSignInUrl}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#B3B3B3',
              fontSize: '0.85rem',
              fontWeight: '500',
              textDecoration: 'none',
              transition: 'color 0.2s ease',
            }}
            className="hover:text-white"
          >
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </header>

      {/* Main Recovery Container */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2.5rem 1rem',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: '#101010',
            border: '1px solid #242424',
            borderRadius: '1.25rem',
            padding: '2.5rem',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)',
            animation: 'fadeIn 0.3s ease-in-out',
          }}
        >
          {/* Portal Context Badge */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            {renderPortalBadge()}
          </div>

          {/* Error Notice */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '0.75rem',
                padding: '0.875rem 1rem',
                color: '#F87171',
                fontSize: '0.825rem',
                lineHeight: '1.45',
                marginBottom: '1.5rem',
              }}
              role="alert"
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{error}</div>
            </div>
          )}

          {/* Success Notice */}
          {successNotice && currentStep !== 4 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                backgroundColor: 'rgba(4, 219, 126, 0.08)',
                border: '1px solid rgba(4, 219, 126, 0.25)',
                borderRadius: '0.75rem',
                padding: '0.875rem 1rem',
                color: '#04DB7E',
                fontSize: '0.825rem',
                lineHeight: '1.45',
                marginBottom: '1.5rem',
              }}
              role="status"
            >
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{successNotice}</div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* STEP 1: Enter Registered Email Address                     */}
          {/* ─────────────────────────────────────────────────────────── */}
          {currentStep === 1 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#171717',
                    border: '1px solid #242424',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto',
                    color: '#04DB7E',
                  }}
                >
                  <KeyRound size={26} />
                </div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.5rem' }}>
                  Forgot Your Password?
                </h1>
                <p style={{ color: '#B3B3B3', fontSize: '0.875rem', lineHeight: '1.5' }}>
                  Enter your registered email address. We'll send you a 6-digit verification code to reset your password.
                </p>
              </div>

              <form onSubmit={handleRequestOtp}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label
                    htmlFor="recovery-email"
                    style={{
                      display: 'block',
                      fontSize: '0.775rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#B3B3B3',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Registered Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={18}
                      style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#808080',
                      }}
                    />
                    <input
                      id="recovery-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. name@shopivo.com"
                      autoComplete="email"
                      style={{
                        width: '100%',
                        backgroundColor: '#050505',
                        border: '1px solid #242424',
                        borderRadius: '0.75rem',
                        padding: '0.875rem 1rem 0.875rem 2.75rem',
                        color: '#FFFFFF',
                        fontSize: '0.9rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease',
                      }}
                      className="focus:border-[#04DB7E]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    backgroundColor: '#04DB7E',
                    color: '#050505',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    padding: '0.875rem 1.25rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(4, 219, 126, 0.25)',
                  }}
                  className="hover:bg-[#00C77A] disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #1C1C1C' }}>
                <Link
                  to={portalSignInUrl}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: '#04DB7E',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    textDecoration: 'none',
                  }}
                >
                  <ArrowLeft size={16} /> Return to {portalRole} Sign In
                </Link>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* STEP 2: Verify 6-Digit Email OTP                           */}
          {/* ─────────────────────────────────────────────────────────── */}
          {currentStep === 2 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#171717',
                    border: '1px solid #242424',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto',
                    color: '#04DB7E',
                  }}
                >
                  <ShieldCheck size={26} />
                </div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.5rem' }}>
                  Verify Your Email
                </h1>
                <p style={{ color: '#B3B3B3', fontSize: '0.875rem', lineHeight: '1.5' }}>
                  We've sent a 6-digit verification code to:
                  <br />
                  <strong style={{ color: '#FFFFFF', wordBreak: 'break-all' }}>{maskedEmail || email}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp}>
                {/* 6 Individual Digit Boxes */}
                <div style={{ marginBottom: '1.75rem' }}>
                  <label
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      fontSize: '0.775rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#B3B3B3',
                      marginBottom: '0.875rem',
                    }}
                  >
                    Enter 6-Digit Verification Code
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      margin: '0 auto',
                    }}
                    onPaste={handleOtpPaste}
                  >
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e.key)}
                        style={{
                          width: '48px',
                          height: '56px',
                          textAlign: 'center',
                          fontSize: '1.5rem',
                          fontWeight: '800',
                          backgroundColor: '#050505',
                          border: digit ? '2px solid #04DB7E' : '1px solid #242424',
                          borderRadius: '0.75rem',
                          color: '#FFFFFF',
                          outline: 'none',
                          transition: 'all 0.15s ease',
                          boxShadow: digit ? '0 0 10px rgba(4, 219, 126, 0.2)' : 'none',
                        }}
                        className="focus:border-[#04DB7E] focus:ring-1 focus:ring-[#04DB7E]"
                        aria-label={`Digit ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Resend Cooldown Section */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#080808',
                    border: '1px solid #1C1C1C',
                    borderRadius: '0.75rem',
                    marginBottom: '1.5rem',
                    fontSize: '0.825rem',
                  }}
                >
                  <span style={{ color: '#808080' }}>Didn't receive the code?</span>
                  {cooldown > 0 ? (
                    <span style={{ color: '#AAB5B0', fontWeight: '600' }}>
                      Resend in <strong style={{ color: '#04DB7E' }}>{cooldown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#04DB7E',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: 0,
                      }}
                      className="hover:underline"
                    >
                      <RefreshCw size={13} /> Resend OTP
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || otpDigits.join('').length !== 6}
                  style={{
                    width: '100%',
                    backgroundColor: '#04DB7E',
                    color: '#050505',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    padding: '0.875rem 1.25rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    cursor: loading || otpDigits.join('').length !== 6 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(4, 219, 126, 0.25)',
                  }}
                  className="hover:bg-[#00C77A] disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify OTP</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#B3B3B3',
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                  className="hover:text-white"
                >
                  <ArrowLeft size={14} /> Change Email Address
                </button>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* STEP 3: Create New Password                                */}
          {/* ─────────────────────────────────────────────────────────── */}
          {currentStep === 3 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#171717',
                    border: '1px solid #242424',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto',
                    color: '#04DB7E',
                  }}
                >
                  <Lock size={26} />
                </div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.5rem' }}>
                  Create New Password
                </h1>
                <p style={{ color: '#B3B3B3', fontSize: '0.875rem', lineHeight: '1.5' }}>
                  Enter a strong, secure password for your SHOPIVO account.
                </p>
              </div>

              <form onSubmit={handleResetPassword}>
                {/* New Password */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label
                    htmlFor="reset-new-password"
                    style={{
                      display: 'block',
                      fontSize: '0.775rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#B3B3B3',
                      marginBottom: '0.5rem',
                    }}
                  >
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={18}
                      style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#808080',
                      }}
                    />
                    <input
                      id="reset-new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                      style={{
                        width: '100%',
                        backgroundColor: '#050505',
                        border: '1px solid #242424',
                        borderRadius: '0.75rem',
                        padding: '0.875rem 2.75rem 0.875rem 2.75rem',
                        color: '#FFFFFF',
                        fontSize: '0.9rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease',
                      }}
                      className="focus:border-[#04DB7E]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.875rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#808080',
                        cursor: 'pointer',
                        padding: '0.25rem',
                      }}
                      className="hover:text-white"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {newPassword && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div
                        style={{
                          height: '4px',
                          width: '100%',
                          backgroundColor: '#1C1C1C',
                          borderRadius: '2px',
                          overflow: 'hidden',
                          marginBottom: '0.35rem',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${passwordStrength.score}%`,
                            backgroundColor: passwordStrength.color,
                            transition: 'all 0.3s ease',
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#808080' }}>
                        <span>Password Strength:</span>
                        <strong style={{ color: passwordStrength.color }}>{passwordStrength.label}</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label
                    htmlFor="reset-confirm-password"
                    style={{
                      display: 'block',
                      fontSize: '0.775rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#B3B3B3',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Confirm New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={18}
                      style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#808080',
                      }}
                    />
                    <input
                      id="reset-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                      style={{
                        width: '100%',
                        backgroundColor: '#050505',
                        border: '1px solid #242424',
                        borderRadius: '0.75rem',
                        padding: '0.875rem 2.75rem 0.875rem 2.75rem',
                        color: '#FFFFFF',
                        fontSize: '0.9rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease',
                      }}
                      className="focus:border-[#04DB7E]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.875rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#808080',
                        cursor: 'pointer',
                        padding: '0.25rem',
                      }}
                      className="hover:text-white"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements Checklist */}
                <div
                  style={{
                    backgroundColor: '#080808',
                    border: '1px solid #1C1C1C',
                    borderRadius: '0.75rem',
                    padding: '0.875rem 1rem',
                    marginBottom: '1.5rem',
                    fontSize: '0.775rem',
                    color: '#B3B3B3',
                  }}
                >
                  <div style={{ fontWeight: '600', color: '#FFFFFF', marginBottom: '0.4rem' }}>
                    Password Requirements:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: newPassword.length >= 8 ? '#04DB7E' : '#808080' }}>
                      <CheckCircle2 size={13} /> At least 8 characters
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: /[0-9!@#$%^&*]/.test(newPassword) ? '#04DB7E' : '#808080' }}>
                      <CheckCircle2 size={13} /> At least one number or special character
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: newPassword && newPassword === confirmPassword ? '#04DB7E' : '#808080' }}>
                      <CheckCircle2 size={13} /> Passwords match
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    backgroundColor: '#04DB7E',
                    color: '#050505',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    padding: '0.875rem 1.25rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(4, 219, 126, 0.25)',
                  }}
                  className="hover:bg-[#00C77A] disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Reset Password</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* STEP 4: Success Confirmation                               */}
          {/* ─────────────────────────────────────────────────────────── */}
          {currentStep === 4 && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(4, 219, 126, 0.1)',
                  border: '2px solid #04DB7E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem auto',
                  color: '#04DB7E',
                  boxShadow: '0 0 24px rgba(4, 219, 126, 0.3)',
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.75rem' }}>
                Password Updated!
              </h1>

              <p style={{ color: '#B3B3B3', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                Your password has been updated successfully.
                <br />
                You can now sign in to your SHOPIVO account with your new credentials.
              </p>

              <button
                type="button"
                onClick={() => navigate(portalSignInUrl, { replace: true })}
                style={{
                  width: '100%',
                  backgroundColor: '#04DB7E',
                  color: '#050505',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  padding: '0.875rem 1.25rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(4, 219, 126, 0.25)',
                }}
                className="hover:bg-[#00C77A]"
              >
                <span>Return to Sign In</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          padding: '1.25rem 2rem',
          borderTop: '1px solid #1C1C1C',
          backgroundColor: 'rgba(8, 8, 8, 0.85)',
          color: '#666666',
          fontSize: '0.775rem',
        }}
      >
        &copy; 2026 SHOPIVO Inc. Enterprise Multi-Portal Authentication &amp; Recovery.
      </footer>
    </div>
  )
}

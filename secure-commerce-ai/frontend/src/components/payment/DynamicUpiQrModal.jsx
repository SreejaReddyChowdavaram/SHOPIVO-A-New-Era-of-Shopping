import React, { useState, useEffect, useRef } from 'react'
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Loader2,
  X,
  CreditCard,
  Banknote,
  ChevronDown
} from 'lucide-react'

/**
 * DynamicUpiQrModal.jsx — Refined SHOPIVO Razorpay Dynamic UPI QR Payment Modal
 *
 * Enforces:
 * - Perfectly centered layout on desktop, tablet, and mobile.
 * - Consistent 10-minute (600 seconds) session countdown in MM:SS format.
 * - Accurate countdown restoration across page refresh.
 * - Authoritative backend-driven status polling and manual status refresh.
 * - Non-overlapping close button and perfectly centered QR code container.
 * - Displays random alphanumeric order reference (e.g., SHV-A8K29X7P).
 * - Safe QR regeneration on session expiry.
 */
export const DynamicUpiQrModal = ({
  orderId,
  orderReference,
  amount,
  amountInPaise,
  imageUrl,
  qrCodeId,
  closeBy,
  gatewayOrderId,
  keyId,
  customerName,
  onPaymentSuccess,
  onPaymentFailed,
  onDismiss,
  onSwitchToCod,
  onOpenStandardCheckout,
  onRegenerateQr,
  checkStatusApi,
  errorDetail,
}) => {
  // 1. Initial Countdown Calculation from backend closeBy epoch
  const [secondsRemaining, setSecondsRemaining] = useState(() => {
    if (closeBy) {
      const nowEpoch = Math.floor(Date.now() / 1000)
      const diff = closeBy - nowEpoch
      return diff > 0 ? diff : 0
    }
    return 600 // Default exactly 10 minutes (600s)
  })

  const [status, setStatus] = useState(() => {
    if (closeBy) {
      const nowEpoch = Math.floor(Date.now() / 1000)
      if (closeBy <= nowEpoch) return 'EXPIRED'
    }
    return 'WAITING' // WAITING | VERIFYING | SUCCESS | FAILED | EXPIRED
  })

  const [errorMessage, setErrorMessage] = useState(errorDetail || null)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [imageLoadError, setImageLoadError] = useState(false)
  const [showAltOptions, setShowAltOptions] = useState(false)
  const [qrLayout, setQrLayout] = useState({
    loaded: false,
    isStandee: false,
    style: { opacity: 0 },
  })
  const qrImgRef = useRef(null)
  const pollTimerRef = useRef(null)

  const isLiveMode = keyId ? keyId.startsWith('rzp_live_') : false

  // Format order reference
  const displayOrderReference = orderReference || (orderId ? `SHV-${String(orderId).padStart(6, '0')}` : 'SHV-PAYMENT')

  // Payable amount formatting
  const displayAmount = amount || (amountInPaise ? amountInPaise / 100 : 0)
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(displayAmount)

  // Sync closeBy updates
  useEffect(() => {
    if (closeBy) {
      const nowEpoch = Math.floor(Date.now() / 1000)
      const diff = closeBy - nowEpoch
      if (diff <= 0) {
        setSecondsRemaining(0)
        setStatus('EXPIRED')
      } else {
        setSecondsRemaining(diff)
        if (status === 'EXPIRED') {
          setStatus('WAITING')
        }
      }
    }
  }, [closeBy])

  // Center & Fit QR Image
  const handleQrImageLoad = (e) => {
    const img = e?.target || qrImgRef.current
    if (!img) return
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    if (!nw || !nh) return

    const ar = nw / nh
    if (ar < 0.65) {
      // Standee crop centered cleanly
      const ratioHW = nh / nw
      const topPct = ((0.330 - 0.5155 * ratioHW) / 0.67) * 100
      setQrLayout({
        loaded: true,
        isStandee: true,
        style: {
          position: 'absolute',
          width: '149.25%',
          left: '-24.63%',
          top: `${topPct}%`,
          maxWidth: 'none',
          opacity: 1,
        },
      })
    } else {
      // Standard Square QR
      setQrLayout({
        loaded: true,
        isStandee: false,
        style: {
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          padding: '8px',
          opacity: 1,
        },
      })
    }
  }

  useEffect(() => {
    if (qrImgRef.current && qrImgRef.current.complete && qrImgRef.current.naturalWidth) {
      handleQrImageLoad({ target: qrImgRef.current })
    }
  }, [imageUrl])

  // 10-Minute Countdown Timer Interval
  useEffect(() => {
    if (status === 'SUCCESS' || status === 'FAILED') return

    if (secondsRemaining <= 0) {
      setStatus('EXPIRED')
      return
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setStatus('EXPIRED')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [secondsRemaining, status])

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60)
    const rem = secs % 60
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`
  }

  // Authoritative Backend Status Polling (every 2.5s)
  useEffect(() => {
    if (status !== 'WAITING' && status !== 'VERIFYING') return
    if (!checkStatusApi || !orderId) return

    let isMounted = true

    const pollPaymentStatus = async () => {
      try {
        const paymentData = await checkStatusApi(orderId)
        if (!isMounted) return

        if (paymentData && paymentData.paymentStatus === 'SUCCESS') {
          setStatus('SUCCESS')
          if (pollTimerRef.current) clearInterval(pollTimerRef.current)
          setTimeout(() => {
            onPaymentSuccess?.(paymentData)
          }, 1000)
        } else if (paymentData && paymentData.paymentStatus === 'FAILED') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current)
          if (paymentData.failureReason && paymentData.failureReason.toLowerCase().includes('expired')) {
            setStatus('EXPIRED')
          } else {
            setStatus('FAILED')
            setErrorMessage(paymentData.failureReason || 'Payment declined or cancelled by issuing bank.')
            onPaymentFailed?.(paymentData.failureReason || 'Payment declined')
          }
        }
      } catch (err) {
        // Non-blocking poll retry
      }
    }

    pollTimerRef.current = setInterval(pollPaymentStatus, 2500)

    return () => {
      isMounted = false
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [orderId, status, checkStatusApi, onPaymentSuccess, onPaymentFailed])

  // Manual Status Check Button
  const handleManualCheckStatus = async () => {
    if (!checkStatusApi || !orderId) return
    setCheckingStatus(true)
    try {
      const paymentData = await checkStatusApi(orderId)
      if (paymentData && paymentData.paymentStatus === 'SUCCESS') {
        setStatus('SUCCESS')
        setTimeout(() => onPaymentSuccess?.(paymentData), 1000)
      } else if (paymentData && paymentData.paymentStatus === 'FAILED') {
        if (paymentData.failureReason && paymentData.failureReason.toLowerCase().includes('expired')) {
          setStatus('EXPIRED')
        } else {
          setStatus('FAILED')
          setErrorMessage(paymentData.failureReason || 'Payment was declined')
        }
      } else {
        setErrorMessage(null)
      }
    } catch (err) {
      setErrorMessage('Unable to reach server. Please check your internet connection.')
    } finally {
      setCheckingStatus(false)
    }
  }

  // Safe QR Regeneration on Session Expiry
  const handleRegenerateQr = async () => {
    if (!onRegenerateQr) return
    setRegenerating(true)
    setErrorMessage(null)
    try {
      const freshData = await onRegenerateQr()
      if (freshData && freshData.closeBy) {
        const nowEpoch = Math.floor(Date.now() / 1000)
        const diff = freshData.closeBy - nowEpoch
        setSecondsRemaining(diff > 0 ? diff : 600)
      } else {
        setSecondsRemaining(600)
      }
      setStatus('WAITING')
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to generate new payment QR code')
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fade-in"
      style={{ boxSizing: 'border-box' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div
        className="relative rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl p-5 sm:p-6 pb-6 text-[var(--color-text-primary)] transition-all flex flex-col items-center"
        style={{
          boxSizing: 'border-box',
          width: 'min(calc(100vw - 32px), 440px)',
          maxHeight: 'min(92vh, 740px)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Header with Title, Mode Badge, and Inline Close Button (Zero text clipping) */}
        <div className="flex items-center justify-between w-full gap-2 mb-4 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h2
              id="qr-modal-title"
              className="text-base sm:text-lg font-black tracking-tight text-[var(--color-text-primary)] truncate m-0"
            >
              SHOPIVO PAYMENT
            </h2>
            {isLiveMode && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[rgba(15,143,107,0.12)] text-[var(--color-primary)] border border-[rgba(15,143,107,0.25)] shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                Live
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--color-bg)] hover:bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer shrink-0"
            aria-label="Close and cancel payment"
          >
            <X size={16} />
          </button>
        </div>

        {/* Order Reference & Payable Amount Row */}
        <div
          className="w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] mb-4 shrink-0"
          style={{ boxSizing: 'border-box' }}
        >
          <div className="min-w-0 text-left">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Order Reference
            </div>
            <div className="text-xs sm:text-sm font-extrabold text-[var(--color-text-primary)] font-mono tracking-wider mt-0.5 truncate">
              {displayOrderReference}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Payable Amount
            </div>
            <div className="text-base sm:text-lg font-black text-[var(--color-primary)] mt-0.5">
              {formattedAmount}
            </div>
          </div>
        </div>

        {/* Center QR Section */}
        <div className="w-full flex flex-col items-center justify-center mb-4 shrink-0">
          {status === 'EXPIRED' ? (
            <div className="py-6 px-3 text-center w-full flex flex-col items-center">
              <AlertCircle size={46} className="mb-2.5 text-rose-500 opacity-90" />
              <h4 className="text-base font-bold text-[var(--color-text-primary)] m-0 mb-1">
                Payment Session Expired
              </h4>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 mb-4 max-w-xs leading-relaxed">
                Payment session expired. Please generate a new payment QR code.
              </p>
              {onRegenerateQr && (
                <button
                  type="button"
                  onClick={handleRegenerateQr}
                  disabled={regenerating}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {regenerating ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                  <span>Generate New QR Code</span>
                </button>
              )}
            </div>
          ) : status === 'SUCCESS' ? (
            <div className="py-6 px-3 text-center w-full flex flex-col items-center text-[var(--color-primary)]">
              <CheckCircle2 size={50} className="mb-2.5 animate-bounce" />
              <h4 className="text-lg font-extrabold text-[var(--color-text-primary)] m-0 mb-1">
                Payment Confirmed!
              </h4>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 mb-0">
                Your order is confirmed. Redirecting...
              </p>
            </div>
          ) : imageUrl && !imageLoadError ? (
            <div className="w-full flex flex-col items-center">
              {/* Perfectly Centered Proportional White QR Container with Measured Quiet Zone */}
              <div
                className="relative bg-white rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex items-center justify-center overflow-hidden p-2"
                style={{
                  width: 'min(240px, 60vw)',
                  height: 'min(240px, 60vw)',
                  boxSizing: 'border-box'
                }}
              >
                {!qrLayout.loaded && (
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
                    <span className="text-[11px] font-medium">Loading QR...</span>
                  </div>
                )}
                <img
                  ref={qrImgRef}
                  src={imageUrl}
                  alt={`Payment QR for Order ${displayOrderReference}`}
                  onLoad={handleQrImageLoad}
                  onError={() => setImageLoadError(true)}
                  className="select-none pointer-events-none transition-opacity duration-200"
                  style={qrLayout.style}
                />
              </div>

              {/* Centered Payment Instructions */}
              <p className="text-xs font-medium text-[var(--color-text-secondary)] text-center mt-3 mb-0 px-2 leading-relaxed">
                Scan using Google Pay, PhonePe, Paytm or any UPI app.
              </p>

              {/* Centered Expiry Countdown Timer */}
              {status !== 'EXPIRED' && status !== 'SUCCESS' && (
                <div
                  className={`mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    secondsRemaining < 120
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                  }`}
                >
                  <Clock size={13} />
                  <span>Expires in {formatTimer(secondsRemaining)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 px-3 text-center text-[var(--color-text-secondary)] w-full flex flex-col items-center">
              <AlertCircle size={40} className="mb-2 text-amber-500 dark:text-amber-400" />
              <h4 className="text-sm font-bold text-[var(--color-text-primary)] m-0 mb-1">
                Standalone QR Code Unavailable
              </h4>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-xs mx-auto leading-relaxed">
                {errorMessage ||
                  'The QR code payment session could not be initialized. Please complete payment using online checkout.'}
              </p>
            </div>
          )}
        </div>

        {/* Live Status & Check Status Controls Row */}
        <div
          className="w-full p-3 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-between gap-2 text-xs mb-3 shrink-0"
          style={{ boxSizing: 'border-box' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {status === 'WAITING' && <Loader2 size={15} className="animate-spin text-[var(--color-primary)] shrink-0" />}
            {status === 'VERIFYING' && <Loader2 size={15} className="animate-spin text-[var(--color-primary)] shrink-0" />}
            {status === 'SUCCESS' && <CheckCircle2 size={15} className="text-[var(--color-primary)] shrink-0" />}
            {status === 'FAILED' && <AlertCircle size={15} className="text-rose-600 shrink-0" />}
            {status === 'EXPIRED' && <Clock size={15} className="text-rose-600 shrink-0" />}

            <span className="font-semibold text-[var(--color-text-primary)] truncate">
              {status === 'WAITING' && 'Waiting for payment...'}
              {status === 'VERIFYING' && 'Verifying payment with Razorpay...'}
              {status === 'SUCCESS' && 'Payment Verified!'}
              {status === 'FAILED' && 'Payment Declined'}
              {status === 'EXPIRED' && 'Payment Expired'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleManualCheckStatus}
            disabled={checkingStatus || status === 'SUCCESS' || status === 'EXPIRED'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-colors cursor-pointer disabled:opacity-40 shrink-0"
          >
            <RotateCcw size={12} className={checkingStatus ? 'animate-spin' : ''} />
            <span>Check Status</span>
          </button>
        </div>

        {/* Other Payment Options Section (Centered & Non-overflowing) */}
        {(onOpenStandardCheckout || onSwitchToCod) && (
          <div className="w-full border-t border-[var(--color-border)] pt-3 mt-1 pb-1 shrink-0" style={{ boxSizing: 'border-box' }}>
            <button
              type="button"
              onClick={() => setShowAltOptions((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] py-1.5 px-1 transition-colors cursor-pointer"
            >
              <span>Other payment options</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${showAltOptions ? 'rotate-180' : ''}`}
              />
            </button>

            {showAltOptions && (
              <div className="mt-2 flex flex-col gap-2 animate-fade-in w-full">
                {onOpenStandardCheckout && (
                  <button
                    type="button"
                    onClick={onOpenStandardCheckout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-[var(--color-bg)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] border border-[var(--color-border)] transition-colors cursor-pointer"
                  >
                    <CreditCard size={14} className="text-[var(--color-primary)] shrink-0" />
                    <span className="truncate">Pay via Cards / NetBanking / Razorpay Popup</span>
                  </button>
                )}

                {onSwitchToCod && (
                  <button
                    type="button"
                    onClick={onSwitchToCod}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-[var(--color-bg)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] border border-[var(--color-border)] transition-colors cursor-pointer"
                  >
                    <Banknote size={14} className="text-[var(--color-primary)] shrink-0" />
                    <span className="truncate">Switch to Cash on Delivery (COD)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DynamicUpiQrModal

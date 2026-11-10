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
 * Prominently presents the authentic Razorpay Dynamic UPI QR code.
 * Clean, minimal, professional layout strictly matching SHOPIVO specifications.
 */
export const DynamicUpiQrModal = ({
  orderId,
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
  checkStatusApi,
  errorDetail,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(() => {
    if (closeBy) {
      const nowEpoch = Math.floor(Date.now() / 1000)
      const diff = closeBy - nowEpoch
      return diff > 0 ? diff : 900
    }
    return 900
  })
  const [status, setStatus] = useState('WAITING') // WAITING | VERIFYING | SUCCESS | FAILED | EXPIRED
  const [errorMessage, setErrorMessage] = useState(errorDetail || null)
  const [checkingStatus, setCheckingStatus] = useState(false)
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

  const handleQrImageLoad = (e) => {
    const img = e?.target || qrImgRef.current
    if (!img) return
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    if (!nw || !nh) return

    const ar = nw / nh
    if (ar < 0.65) {
      // Standee image crop (mathematically centered on QR code, 100% inside white card)
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
      // Square / standard QR code (complete genuine image, zero distortion)
      setQrLayout({
        loaded: true,
        isStandee: false,
        style: {
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          padding: '10px',
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

  // Payable amount formatting
  const displayAmount = amount || (amountInPaise ? amountInPaise / 100 : 0)
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(displayAmount)

  // 1. Countdown Timer
  useEffect(() => {
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
  }, [secondsRemaining])

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60)
    const rem = secs % 60
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`
  }

  // 2. Authoritative Backend Status Polling (every 2.5 seconds)
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
          setStatus('FAILED')
          setErrorMessage(paymentData.failureReason || 'Payment declined or cancelled by issuing bank.')
          if (pollTimerRef.current) clearInterval(pollTimerRef.current)
          onPaymentFailed?.(paymentData.failureReason || 'Payment declined')
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

  // 3. Manual Status Check
  const handleManualCheckStatus = async () => {
    if (!checkStatusApi || !orderId) return
    setCheckingStatus(true)
    try {
      const paymentData = await checkStatusApi(orderId)
      if (paymentData && paymentData.paymentStatus === 'SUCCESS') {
        setStatus('SUCCESS')
        setTimeout(() => onPaymentSuccess?.(paymentData), 1000)
      } else if (paymentData && paymentData.paymentStatus === 'FAILED') {
        setStatus('FAILED')
        setErrorMessage(paymentData.failureReason || 'Payment was declined')
      } else {
        setErrorMessage(null)
      }
    } catch (err) {
      setErrorMessage('Unable to reach server. Please check your internet connection.')
    } finally {
      setCheckingStatus(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div className="relative w-full max-w-[420px] max-h-[94vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#101010] border border-[#DFE9E2] dark:border-[#242424] shadow-2xl p-5 sm:p-6 text-slate-900 dark:text-white transition-all">
        {/* Top-Right Close Button: safely triggers onDismiss / cancellation */}
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          aria-label="Close and cancel payment"
        >
          <X size={16} />
        </button>

        {/* Modal Brand Header with Dynamic Mode Indicator */}
        <div className="flex items-center justify-between pr-8 mb-4">
          <h2 id="qr-modal-title" className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            SHOPIVO PAYMENT
          </h2>
          {isLiveMode ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Test Mode
            </span>
          )}
        </div>

        {/* Order Reference & Payable Amount Row */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#171717] border border-[#DFE9E2] dark:border-[#242424] mb-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Order Reference
            </div>
            <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
              #{orderId}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Payable Amount
            </div>
            <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formattedAmount}
            </div>
          </div>
        </div>

        {/* Large, Clear Razorpay QR Code Container */}
        <div className="flex flex-col items-center justify-center mb-4">
          {status === 'EXPIRED' ? (
            <div className="py-8 text-center text-rose-600 dark:text-rose-400">
              <AlertCircle size={48} className="mx-auto mb-2.5 opacity-90" />
              <h4 className="text-base font-bold text-slate-900 dark:text-white">QR Code Expired</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                The payment session has elapsed. Please retry or choose Cash on Delivery.
              </p>
            </div>
          ) : status === 'SUCCESS' ? (
            <div className="py-8 text-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={52} className="mx-auto mb-2.5 animate-bounce" />
              <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">Payment Confirmed!</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your order is confirmed. Redirecting...
              </p>
            </div>
          ) : imageUrl && !imageLoadError ? (
            <div className="flex flex-col items-center">
              {/* Clean White QR Container with Measured Quiet Zone & Zero Distortion */}
              <div
                className="relative bg-white rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex items-center justify-center overflow-hidden w-[250px] h-[250px] sm:w-[270px] sm:h-[270px]"
              >
                {!qrLayout.loaded && (
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Loader2 size={28} className="animate-spin text-[#04DB7E]" />
                    <span className="text-[11px] font-medium">Loading QR...</span>
                  </div>
                )}
                <img
                  ref={qrImgRef}
                  src={imageUrl}
                  alt={`Razorpay Dynamic UPI QR for Order #${orderId}`}
                  onLoad={handleQrImageLoad}
                  onError={() => setImageLoadError(true)}
                  className="select-none pointer-events-none transition-opacity duration-200"
                  style={qrLayout.style}
                />
              </div>

              {/* Clear subtitle */}
              <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 text-center mt-3">
                Scan using Google Pay, PhonePe or any UPI app.
              </p>

              {/* Expiration Countdown Indicator */}
              {status !== 'EXPIRED' && status !== 'SUCCESS' && (
                <div
                  className={`mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    secondsRemaining < 120
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50'
                  }`}
                >
                  <Clock size={13} />
                  <span>Expires in {formatTimer(secondsRemaining)}</span>
                </div>
              )}
            </div>
          ) : (
            /* QR Load Failure / Account Activation Required State */
            <div className="py-6 text-center text-slate-500 dark:text-slate-400">
              <AlertCircle size={42} className="mx-auto mb-2 text-amber-500 dark:text-amber-400" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Standalone QR Code Unavailable
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                {errorMessage ||
                  'The standalone QR feature requires account activation in Razorpay Dashboard. You can pay seamlessly via Razorpay Standard Checkout below.'}
              </p>
            </div>
          )}
        </div>

        {/* Live Status & Check Status Row */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#171717] border border-[#DFE9E2] dark:border-[#242424] flex items-center justify-between gap-3 text-xs mb-3">
          <div className="flex items-center gap-2">
            {status === 'WAITING' && <Loader2 size={15} className="animate-spin text-[#04DB7E] shrink-0" />}
            {status === 'VERIFYING' && <Loader2 size={15} className="animate-spin text-emerald-600 shrink-0" />}
            {status === 'SUCCESS' && <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />}
            {status === 'FAILED' && <AlertCircle size={15} className="text-rose-600 shrink-0" />}
            {status === 'EXPIRED' && <Clock size={15} className="text-rose-600 shrink-0" />}

            <span className="font-semibold text-slate-800 dark:text-slate-200">
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
            disabled={checkingStatus || status === 'SUCCESS'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-[#087847] dark:text-[#04DB7E] hover:bg-[#E5FFF2] dark:hover:bg-[#09291B] transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RotateCcw size={12} className={checkingStatus ? 'animate-spin' : ''} />
            <span>Check Status</span>
          </button>
        </div>

        {/* Alternative Payment Options (Compact & Secondary) */}
        {(onOpenStandardCheckout || onSwitchToCod) && (
          <div className="border-t border-slate-200/80 dark:border-slate-800/80 pt-2.5">
            <button
              type="button"
              onClick={() => setShowAltOptions((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 py-1 transition-colors cursor-pointer"
            >
              <span>Other payment options</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${showAltOptions ? 'rotate-180' : ''}`}
              />
            </button>

            {showAltOptions && (
              <div className="mt-2 flex flex-col gap-2 animate-fade-in">
                {onOpenStandardCheckout && (
                  <button
                    type="button"
                    onClick={onOpenStandardCheckout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer"
                  >
                    <CreditCard size={14} className="text-slate-500" />
                    <span>Pay via Cards / NetBanking / Razorpay Popup</span>
                  </button>
                )}

                {onSwitchToCod && (
                  <button
                    type="button"
                    onClick={onSwitchToCod}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer"
                  >
                    <Banknote size={14} className="text-slate-500" />
                    <span>Switch to Cash on Delivery (COD)</span>
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

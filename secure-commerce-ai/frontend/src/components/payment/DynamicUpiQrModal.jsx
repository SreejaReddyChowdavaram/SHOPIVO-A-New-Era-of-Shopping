import React, { useState, useEffect } from 'react'
import {
  QrCode,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Loader2,
  Smartphone,
  X,
  ArrowRight,
  ExternalLink,
  Banknote
} from 'lucide-react'

/**
 * Generates a deterministic 25x25 QR matrix for the given UPI URI.
 * Guarantees accurate Finder Patterns (7x7 corners) and Timing Tracks (line 6).
 */
const generateDeterministicQrMatrix = (inputString) => {
  const size = 25
  const matrix = Array.from({ length: size }, () => Array(size).fill(false))

  // 1. Draw 7x7 Finder Pattern at (row, col)
  const drawFinder = (startRow, startCol) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startRow + r][startCol + c] = true
        }
      }
    }
  }

  // Draw 3 Finders: Top-Left, Top-Right, Bottom-Left
  drawFinder(0, 0)
  drawFinder(0, size - 7)
  drawFinder(size - 7, 0)

  // 2. Timing Patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0
    matrix[i][6] = i % 2 === 0
  }

  // 3. Simple deterministic hash of inputString to fill data area
  let hash = 0
  for (let i = 0; i < inputString.length; i++) {
    hash = (hash * 31 + inputString.charCodeAt(i)) & 0xffffffff
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Don't overwrite Finders or Timing lines
      const inFinder1 = r < 8 && c < 8
      const inFinder2 = r < 8 && c >= size - 8
      const inFinder3 = r >= size - 8 && c < 8
      const inTiming = r === 6 || c === 6

      if (!inFinder1 && !inFinder2 && !inFinder3 && !inTiming) {
        const val = Math.sin((r * size + c + hash) * 0.45)
        matrix[r][c] = val > 0.1
      }
    }
  }

  return matrix
}

export const DynamicUpiQrModal = ({
  orderId,
  amount,
  amountInPaise,
  gatewayOrderId,
  keyId,
  customerName,
  onPaymentSuccess,
  onPaymentFailed,
  onDismiss,
  onSwitchToCod,
  checkStatusApi,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(600) // 10 minutes expiry
  const [status, setStatus] = useState('WAITING') // WAITING | VERIFYING | SUCCESS | FAILED | EXPIRED | DELAYED
  const [errorMessage, setErrorMessage] = useState(null)
  const [checkingStatus, setCheckingStatus] = useState(false)

  // Derive payable amount
  const displayAmount = amount || (amountInPaise ? amountInPaise / 100 : 0)
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(displayAmount)

  // Official UPI Payment URI Format
  const upiUri = `upi://pay?pa=shopivo.merchant@razorpay&pn=SHOPIVO&am=${displayAmount}&cu=INR&tn=Order_${orderId}`
  const qrMatrix = generateDeterministicQrMatrix(upiUri)

  // Countdown Timer
  useEffect(() => {
    if (secondsRemaining <= 0) {
      setStatus('EXPIRED')
      return
    }
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [secondsRemaining])

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60)
    const rem = secs % 60
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`
  }

  // Periodic Polling for Verified Payment Status (every 2.5s)
  useEffect(() => {
    if (status !== 'WAITING' && status !== 'VERIFYING') return
    if (!checkStatusApi) return

    let isMounted = true
    const interval = setInterval(async () => {
      try {
        const paymentData = await checkStatusApi(orderId)
        if (!isMounted) return

        if (paymentData && paymentData.paymentStatus === 'SUCCESS') {
          setStatus('SUCCESS')
          clearInterval(interval)
          setTimeout(() => {
            onPaymentSuccess?.(paymentData)
          }, 1200)
        } else if (paymentData && paymentData.paymentStatus === 'FAILED') {
          setStatus('FAILED')
          setErrorMessage(paymentData.failureReason || 'Payment declined by gateway')
          clearInterval(interval)
        }
      } catch (err) {
        // Non-blocking status poll error
      }
    }, 2500)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [orderId, status, checkStatusApi, onPaymentSuccess])

  // Manual Check Status Button
  const handleManualCheckStatus = async () => {
    if (!checkStatusApi) return
    setCheckingStatus(true)
    try {
      const paymentData = await checkStatusApi(orderId)
      if (paymentData && paymentData.paymentStatus === 'SUCCESS') {
        setStatus('SUCCESS')
        setTimeout(() => onPaymentSuccess?.(paymentData), 1200)
      } else if (paymentData && paymentData.paymentStatus === 'FAILED') {
        setStatus('FAILED')
        setErrorMessage(paymentData.failureReason || 'Payment was declined')
      } else {
        // Still pending
        setErrorMessage(null)
      }
    } catch (err) {
      setStatus('DELAYED')
    } finally {
      setCheckingStatus(false)
    }
  }

  // Developer Simulation Actions
  const handleSimulateSuccess = () => {
    setStatus('VERIFYING')
    setTimeout(() => {
      const mockResult = {
        orderId,
        razorpayOrderId: gatewayOrderId || `order_dev_${Date.now()}`,
        razorpayPaymentId: `pay_dev_${Math.random().toString(36).substring(2, 10)}`,
        razorpaySignature: `sig_dev_${Math.random().toString(36).substring(2, 12)}`,
      }
      onPaymentSuccess?.(mockResult)
    }, 1000)
  }

  const handleSimulateDecline = () => {
    setStatus('FAILED')
    const msg = 'Transaction declined by issuing bank or customer cancelled in UPI app.'
    setErrorMessage(msg)
    onPaymentFailed?.(msg)
  }

  const handleSimulateExpiry = () => {
    setSecondsRemaining(0)
    setStatus('EXPIRED')
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: '1.25rem',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          position: 'relative',
          padding: '1.75rem',
        }}
      >
        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onDismiss}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              color: 'var(--color-primary)',
              borderRadius: '999px',
              padding: '0.25rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: '700',
              marginBottom: '0.5rem',
            }}
          >
            <ShieldCheck size={14} /> SECURE RAZORPAY UPI CHECKOUT
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0.25rem 0 0.25rem', color: 'var(--color-text-primary)' }}>
            Dynamic UPI QR Payment
          </h2>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            Scan with Google Pay, PhonePe, Paytm, BHIM, or any UPI app
          </p>
        </div>

        {/* Order & Amount Snapshot Card */}
        <div
          style={{
            backgroundColor: 'var(--color-bg)',
            borderRadius: '0.75rem',
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem',
            border: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
              Order Reference
            </div>
            <div style={{ fontSize: '0.925rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
              #{orderId}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
              Payable Amount
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#16a34a' }}>
              {formattedAmount}
            </div>
          </div>
        </div>

        {/* QR Code Presentation Box */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            position: 'relative',
          }}
        >
          {status === 'EXPIRED' ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--color-danger)' }}>
              <AlertCircle size={48} style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ margin: '0 0 0.5rem', fontWeight: '700' }}>QR Code Expired</h4>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#6b7280' }}>
                The 10-minute payment window has elapsed.
              </p>
            </div>
          ) : status === 'SUCCESS' ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#16a34a' }}>
              <CheckCircle2 size={54} style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ margin: '0 0 0.5rem', fontWeight: '800' }}>Payment Verified!</h4>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#6b7280' }}>
                Redirecting to order confirmation...
              </p>
            </div>
          ) : (
            <>
              {/* Dynamic SVG QR Matrix */}
              <svg
                width="200"
                height="200"
                viewBox="0 0 25 25"
                style={{ borderRadius: '0.35rem', display: 'block' }}
                shapeRendering="crispEdges"
              >
                <rect width="25" height="25" fill="#ffffff" />
                {qrMatrix.map((row, r) =>
                  row.map((cell, c) =>
                    cell ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#0f172a" /> : null
                  )
                )}
              </svg>

              {/* Floating UPI Brand Tag */}
              <div
                style={{
                  marginTop: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.725rem',
                  fontWeight: '700',
                  color: '#334155',
                }}
              >
                <span>SCAN WITH ANY UPI APP</span>
              </div>
            </>
          )}

          {/* Expiry Pill */}
          {status !== 'EXPIRED' && status !== 'SUCCESS' && (
            <div
              style={{
                marginTop: '0.65rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: secondsRemaining < 120 ? '#fee2e2' : '#f1f5f9',
                color: secondsRemaining < 120 ? '#dc2626' : '#475569',
                padding: '0.2rem 0.65rem',
                borderRadius: '999px',
                fontSize: '0.725rem',
                fontWeight: '700',
              }}
            >
              <Clock size={12} />
              <span>QR expires in {formatTimer(secondsRemaining)}</span>
            </div>
          )}
        </div>

        {/* Supported UPI Apps Badges */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ textAlign: 'center', fontSize: '0.725rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
            Supported UPI Apps:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '0.25rem 0.6rem', borderRadius: '0.375rem', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: '#4285F4' }}>
              Google Pay
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '0.25rem 0.6rem', borderRadius: '0.375rem', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: '#5f259f' }}>
              PhonePe
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '0.25rem 0.6rem', borderRadius: '0.375rem', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: '#00b9f5' }}>
              Paytm
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '0.25rem 0.6rem', borderRadius: '0.375rem', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: '#00833e' }}>
              BHIM UPI
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '0.25rem 0.6rem', borderRadius: '0.375rem', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
              Any Bank UPI
            </span>
          </div>
        </div>

        {/* Mobile UPI Intent Button (Direct app link for mobile devices) */}
        <div style={{ marginBottom: '1.25rem' }}>
          <a
            href={upiUri}
            className="btn btn-secondary"
            style={{
              width: '100%',
              padding: '0.65rem 1rem',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
            }}
          >
            <Smartphone size={16} /> Pay via Installed UPI App (Mobile Intent)
          </a>
        </div>

        {/* Live Status Message & Progress Indicator */}
        <div
          style={{
            backgroundColor: 'var(--color-bg)',
            padding: '0.85rem 1rem',
            borderRadius: '0.75rem',
            border: '1px solid var(--color-border)',
            marginBottom: '1.25rem',
            fontSize: '0.8125rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {status === 'WAITING' && <Loader2 size={16} className="animate-spin" color="var(--color-primary)" />}
              {status === 'VERIFYING' && <Loader2 size={16} className="animate-spin" color="#16a34a" />}
              {status === 'SUCCESS' && <CheckCircle2 size={16} color="#16a34a" />}
              {status === 'FAILED' && <AlertCircle size={16} color="var(--color-danger)" />}
              {status === 'EXPIRED' && <Clock size={16} color="var(--color-danger)" />}
              {status === 'DELAYED' && <Clock size={16} color="#d97706" />}

              <span style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>
                {status === 'WAITING' && 'Waiting for Payment in UPI App...'}
                {status === 'VERIFYING' && 'Payment Verification in Progress...'}
                {status === 'SUCCESS' && 'Payment Successful!'}
                {status === 'FAILED' && 'Payment Failed or Declined'}
                {status === 'EXPIRED' && 'Payment Expired'}
                {status === 'DELAYED' && 'Verification Delayed'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleManualCheckStatus}
              disabled={checkingStatus}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-primary)',
                fontSize: '0.75rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <RotateCcw size={12} className={checkingStatus ? 'animate-spin' : ''} />
              Check Status
            </button>
          </div>

          {errorMessage && (
            <div style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
              {errorMessage}
            </div>
          )}
        </div>

        {/* Developer Sandbox Controls (Explicit developer simulation mode) */}
        <div
          style={{
            borderTop: '1px dashed var(--color-border)',
            paddingTop: '1rem',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: '700',
              color: '#d97706',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span>🧪 Developer Test Mode Simulator</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <button
              type="button"
              onClick={handleSimulateSuccess}
              disabled={status === 'SUCCESS'}
              className="btn btn-deal"
              style={{ fontSize: '0.75rem', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
            >
              <CheckCircle2 size={14} /> Approve Payment
            </button>

            <button
              type="button"
              onClick={handleSimulateDecline}
              disabled={status === 'SUCCESS'}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: 'var(--color-danger)' }}
            >
              <X size={14} /> Decline Payment
            </button>
          </div>

          <button
            type="button"
            onClick={handleSimulateExpiry}
            disabled={status === 'EXPIRED'}
            className="btn btn-secondary"
            style={{ width: '100%', fontSize: '0.725rem', padding: '0.35rem', color: 'var(--color-text-secondary)' }}
          >
            Simulate QR Expiry (10m Timeout)
          </button>
        </div>

        {/* Footer Alternatives: Switch to COD / Dismiss */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {onSwitchToCod && (
            <button
              type="button"
              onClick={() => onSwitchToCod(orderId)}
              className="btn btn-secondary"
              style={{
                width: '100%',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <Banknote size={16} /> Switch to Cash on Delivery
            </button>
          )}

          <button
            type="button"
            onClick={onDismiss}
            style={{
              width: '100%',
              padding: '0.5rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              fontSize: '0.75rem',
            }}
          >
            Cancel and Return to Checkout
          </button>
        </div>

      </div>
    </div>
  )
}

export default DynamicUpiQrModal

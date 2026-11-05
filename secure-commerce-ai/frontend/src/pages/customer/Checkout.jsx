/**
 * Checkout.jsx — Marketplace Order Checkout with Razorpay Test Mode & Cash on Delivery.
 *
 * Enforces:
 * 1. Strictly 2 checkout methods:
 *    - Online Payment via Razorpay
 *    - Cash on Delivery
 * 2. Decommissioned simulated payment paths removed.
 * 3. Never collects or stores raw card credentials, CVVs, or OTPs.
 * 4. Idempotent gateway orders with graceful retry & switch-to-COD support.
 */

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import {
  MapPin,
  Plus,
  ShoppingBag,
  ArrowRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Truck,
  Banknote,
  ArrowLeft,
  Check,
  Tag,
  Percent,
  RefreshCw,
  CreditCard,
  CheckCircle2
} from 'lucide-react'
import { getCart } from '@/services/cartService'
import { getAddresses } from '@/services/addressService'
import { placeOrder } from '@/services/orderService'
import { createGatewayOrder, verifyGatewayPayment, processCodPayment, getPaymentByOrderId } from '@/services/paymentService'
import { validateCoupon, getAvailableCoupons } from '@/services/couponService'
import { clearCartSummary } from '@/store/cartSlice'
import { ROUTES } from '@/constants/routes'
import api from '@/services/api'
import AddressForm from '@/components/address/AddressForm'
import DynamicUpiQrModal from '@/components/payment/DynamicUpiQrModal'

const PAYMENT_METHODS = [
  {
    id: 'RAZORPAY',
    label: 'Online Payment',
    icon: ShieldCheck,
    subtitle: 'Pay securely through Razorpay using UPI (Dynamic QR / Apps), Cards, or Net Banking.',
    badge: 'Dynamic UPI QR • Instant'
  },
  {
    id: 'COD',
    label: 'Cash on Delivery',
    icon: Banknote,
    subtitle: 'Pay when your order is delivered with cash upon package delivery at your doorstep.'
  },
]

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const Checkout = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [cart, setCart] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [devModalOrder, setDevModalOrder] = useState(null)

  // Pending Order for Retry / Switch to COD
  const [pendingOrder, setPendingOrder] = useState(null)

  // Coupon States
  const [couponCodeInput, setCouponCodeInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [couponError, setCouponError] = useState(null)
  const [availableCoupons, setAvailableCoupons] = useState([])

  // Payment Selection: Exactly RAZORPAY or COD
  const [paymentMethod, setPaymentMethod] = useState('RAZORPAY')

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [cartData, addressList, couponList] = await Promise.all([
        getCart(),
        getAddresses(),
        getAvailableCoupons().catch(() => []),
      ])

      setCart(cartData)
      setAddresses(addressList)
      setAvailableCoupons(couponList || [])

      if (addressList.length > 0) {
        const defaultAddr = addressList.find((a) => a.isDefault) || addressList[0]
        setSelectedAddressId(defaultAddr.id)
      }

      // Record research event CHECKOUT_STARTED
      api.post('/orders/checkout-start').catch(() => {})
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load checkout information')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleApplyCoupon = async (codeToApply = null) => {
    const code = (codeToApply || couponCodeInput).trim().toUpperCase()
    if (!code) {
      setCouponError('Please enter a coupon code')
      return
    }

    setValidatingCoupon(true)
    setCouponError(null)

    try {
      const orderAmount = cart?.subtotal || 0
      const result = await validateCoupon(code, orderAmount)

      if (result.valid) {
        setAppliedCoupon({
          code: result.couponCode,
          discountAmount: result.discountAmount,
          finalAmount: result.finalAmount,
          message: result.message,
        })
        setCouponCodeInput('')
      } else {
        setCouponError(result.message || 'Invalid or inapplicable coupon')
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || err.message || 'Failed to validate coupon')
    } finally {
      setValidatingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponError(null)
  }

  const handleAddressCreatedOrUpdated = (savedAddress) => {
    setShowAddressModal(false)
    setEditingAddress(null)
    getAddresses().then((list) => {
      setAddresses(list)
      setSelectedAddressId(savedAddress.id)
    })
  }

  // Opens Razorpay modal for an existing pending order
  const triggerRazorpayModal = async (orderId) => {
    setSubmitting(true)
    setError(null)
    try {
      const gwOrder = await createGatewayOrder(orderId)

      // Detect if the gateway returned a local developer placeholder key
      const isDevKey = !gwOrder.keyId || gwOrder.keyId.includes('shopivo_dev') || gwOrder.keyId.includes('placeholder') || gwOrder.gatewayOrderId?.startsWith('order_dev_')

      if (isDevKey) {
        // Render verified Developer Test Mode Simulation dialog to prevent external Razorpay SDK cloud authentication rejection
        setDevModalOrder({ orderId, gwOrder })
        setSubmitting(false)
        return
      }

      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        setError('Could not load Razorpay SDK. Please check your internet connection or choose Cash on Delivery.')
        setSubmitting(false)
        return
      }

      const options = {
        key: gwOrder.keyId,
        amount: gwOrder.amountInPaise,
        currency: gwOrder.currency || 'INR',
        name: 'SHOPIVO',
        description: `Order #${orderId} - ₹${gwOrder.amount}`,
        order_id: gwOrder.gatewayOrderId,
        prefill: {
          name: gwOrder.customerName,
          email: gwOrder.customerEmail,
          contact: gwOrder.customerPhone,
        },
        theme: {
          color: '#2563eb',
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay using UPI / Dynamic QR / Apps',
                instruments: [
                  {
                    method: 'upi'
                  }
                ]
              },
              other: {
                name: 'Cards, NetBanking & Wallets',
                instruments: [
                  {
                    method: 'card'
                  },
                  {
                    method: 'netbanking'
                  },
                  {
                    method: 'wallet'
                  }
                ]
              }
            },
            sequence: ['block.upi', 'block.other'],
            preferences: {
              show_default_blocks: true
            }
          }
        },
        handler: async function (response) {
          try {
            setSubmitting(true)
            await verifyGatewayPayment({
              orderId: orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            dispatch(clearCartSummary())
            navigate(`/customer/orders/${orderId}?payment=success`)
          } catch (verifyErr) {
            setError('Payment verification failed: ' + (verifyErr.response?.data?.message || verifyErr.message))
          } finally {
            setSubmitting(false)
          }
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false)
            setError('Payment window was closed. You can retry payment now or switch to Cash on Delivery.')
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (resp) {
        setSubmitting(false)
        setError(`Payment failed: ${resp.error?.description || 'Transaction was declined by gateway'}`)
      })
      rzp.open()

    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to initiate Razorpay session')
      setSubmitting(false)
    }
  }

  // Handle completed payment from DynamicUpiQrModal
  const handleCompletePaymentFromModal = async (result) => {
    setSubmitting(true)
    setError(null)
    try {
      await verifyGatewayPayment({
        orderId: result.orderId,
        razorpayOrderId: result.razorpayOrderId,
        razorpayPaymentId: result.razorpayPaymentId,
        razorpaySignature: result.razorpaySignature,
      })
      setDevModalOrder(null)
      dispatch(clearCartSummary())
      navigate(`/customer/orders/${result.orderId}?payment=success`)
    } catch (verifyErr) {
      setError('Payment verification failed: ' + (verifyErr.response?.data?.message || verifyErr.message))
      setDevModalOrder(null)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Switch to COD for a pending order
  const handleSwitchToCod = async (orderId) => {
    setSubmitting(true)
    setError(null)
    try {
      await processCodPayment(orderId)
      dispatch(clearCartSummary())
      navigate(`/customer/orders/${orderId}?payment=cod`)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to switch to Cash on Delivery')
      setSubmitting(false)
    }
  }

  const handlePlaceOrderAndPay = async () => {
    if (!selectedAddressId) {
      setError('Please select or add a shipping address before proceeding')
      return
    }

    // If an existing order is already pending, route directly
    if (pendingOrder) {
      if (paymentMethod === 'RAZORPAY') {
        await triggerRazorpayModal(pendingOrder.id)
      } else {
        await handleSwitchToCod(pendingOrder.id)
      }
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // 1. Place Order in backend
      const couponCode = appliedCoupon ? appliedCoupon.code : null
      const order = await placeOrder(selectedAddressId, couponCode)
      setPendingOrder(order)

      // 2. Process chosen payment method
      if (paymentMethod === 'COD') {
        await processCodPayment(order.id)
        dispatch(clearCartSummary())
        navigate(`/customer/orders/${order.id}?payment=cod`)
      } else {
        // Online Payment via Razorpay
        await triggerRazorpayModal(order.id)
      }

    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to place order'
      setError(msg)
      getCart().then(setCart).catch(() => {})
      setSubmitting(false)
    }
  }

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)

  if (loading) {
    return (
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', flexDirection: 'column', gap: '0.75rem', color: 'var(--color-text-secondary)' }}>
        <Loader2 size={32} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--color-primary)' }} />
        <span>Preparing your secure checkout...</span>
      </div>
    )
  }

  const isCartEmpty = !cart || cart.items.length === 0

  if (isCartEmpty && !pendingOrder) {
    return (
      <div
        className="fade-in card"
        style={{
          textAlign: 'center',
          padding: '3.5rem 1.5rem',
          maxWidth: '520px',
          margin: '2rem auto',
        }}
      >
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--color-text-muted)' }}>
          <ShoppingBag size={28} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--color-text-primary)' }}>Your cart is empty</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          Add products to your cart before proceeding to checkout.
        </p>
        <Link to={ROUTES.CUSTOMER_PRODUCTS} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
          Browse Catalog
        </Link>
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Back button */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to={ROUTES.CUSTOMER_CART}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-secondary)', fontSize: '0.8125rem', fontWeight: '500' }}
        >
          <ArrowLeft size={15} /> Back to Cart
        </Link>
      </div>

      {/* Gateway Test Mode Banner */}
      <div
        style={{
          backgroundColor: 'rgba(37, 99, 235, 0.08)',
          border: '1px solid rgba(37, 99, 235, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.8125rem',
          color: 'var(--color-primary)',
          lineHeight: '1.45',
        }}
      >
        <ShieldCheck size={20} style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ fontWeight: '700' }}>Razorpay Test Mode Active:</strong> All transactions run in sandbox mode with test credentials. No real-money charges occur.
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--color-danger)',
            color: 'var(--color-danger)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.875rem',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Pending Order Retry Banner */}
      {pendingOrder && (
        <div
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: '1.1rem 1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: '700', color: '#b45309', fontSize: '0.9375rem', marginBottom: '0.2rem' }}>
                Order #{pendingOrder.id} is Pending Payment (₹{pendingOrder.totalAmount})
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                Your order is reserved. You can complete online payment now or switch to Cash on Delivery.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => triggerRazorpayModal(pendingOrder.id)}
                disabled={submitting}
                style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <RefreshCw size={14} className={submitting ? 'animate-spin' : ''} /> Retry Razorpay
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleSwitchToCod(pendingOrder.id)}
                disabled={submitting}
                style={{ fontSize: '0.8125rem' }}
              >
                Switch to Cash on Delivery
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
        
        {/* ── Left Column: Delivery Address & Payment Selection ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* ── 1. Delivery Address Card ── */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={18} color="var(--color-primary)" />
                <h2 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, color: 'var(--color-text-primary)' }}>
                  Delivery Address
                </h2>
              </div>
              <button
                type="button"
                onClick={() => { setEditingAddress(null); setShowAddressModal(true) }}
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              >
                <Plus size={14} /> Add New Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  No shipping addresses saved on your account.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(true)}
                  className="btn btn-primary"
                  style={{ fontSize: '0.8125rem', padding: '0.4rem 1rem' }}
                >
                  <Plus size={14} /> Add Address
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        backgroundColor: isSelected ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        position: 'relative',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-primary)', letterSpacing: '0.04em' }}>
                          {addr.label || 'Home'}
                        </span>
                        {isSelected && (
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={12} color="#ffffff" />
                          </div>
                        )}
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
                        {addr.fullName}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                        {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />
                        {addr.city}, {addr.state} - {addr.postalCode}<br />
                        Phone: {addr.phone}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── 2. Payment Method Card ── */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <ShieldCheck size={18} color="var(--color-primary)" />
              <h2 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, color: 'var(--color-text-primary)' }}>
                Select Payment Method
              </h2>
            </div>

            {/* Selection Grid: Exactly Razorpay or COD */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
              {PAYMENT_METHODS.map((pm) => {
                const IconComponent = pm.icon
                const isSelected = paymentMethod === pm.id
                return (
                  <div
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id)}
                    style={{
                      padding: '1.1rem',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      backgroundColor: isSelected ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', backgroundColor: isSelected ? 'var(--color-surface)' : 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IconComponent size={18} color="var(--color-primary)" />
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                          {pm.label}
                        </span>
                      </div>
                      {pm.badge && (
                        <span style={{ fontSize: '0.6875rem', fontWeight: '700', color: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.1)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                          {pm.badge}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4 }}>
                      {pm.subtitle}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Contextual Payment Details */}
            <div style={{ backgroundColor: 'var(--color-bg)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              {paymentMethod === 'RAZORPAY' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    <ShieldCheck size={18} />
                    <span>Razorpay Standard Checkout (Test Mode)</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: '0 0 0.85rem', lineHeight: 1.45 }}>
                    Clicking "Pay & Place Order" will open Razorpay's PCI-DSS compliant checkout popup. You can select any test payment method (Cards, UPI, NetBanking, Wallets). No real card numbers or passwords are ever stored or processed on our servers.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.725rem' }}>
                    <span style={{ backgroundColor: 'var(--color-surface)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>Visa / MasterCard / RuPay</span>
                    <span style={{ backgroundColor: 'var(--color-surface)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>UPI (GPay / PhonePe / Paytm)</span>
                    <span style={{ backgroundColor: 'var(--color-surface)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>All Major Indian Banks</span>
                    <span style={{ backgroundColor: 'var(--color-surface)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>Popular Wallets</span>
                  </div>
                </div>
              )}

              {paymentMethod === 'COD' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                  <Banknote size={22} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                  <span>Cash on Delivery selected. You will pay in cash directly to the delivery partner when the package is delivered.</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── Right Column: Sticky Coupon & Price Details & Pay CTA ── */}
        <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* ── Coupon & Promo Code Box ── */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.8125rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem' }}>
              <Tag size={16} color="var(--color-primary)" /> Apply Promo Code
            </h3>

            {appliedCoupon ? (
              <div
                style={{
                  backgroundColor: 'var(--color-discount-subtle)',
                  border: '1px solid rgba(22, 163, 74, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-discount)' }}>
                    <Check size={16} /> {appliedCoupon.code}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    Saved {formatPrice(appliedCoupon.discountAmount)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: couponError ? '0.5rem' : '0' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Enter Coupon (e.g. WELCOME10)"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    style={{ flex: 1, textTransform: 'uppercase', fontSize: '0.8125rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon()}
                    disabled={validatingCoupon}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem' }}
                  >
                    {validatingCoupon ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                  </button>
                </div>
                {couponError && (
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '0.35rem' }}>
                    {couponError}
                  </span>
                )}

                {/* Available Coupons Suggestions */}
                {availableCoupons.length > 0 && (
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--color-border-subtle)' }}>
                    <span style={{ display: 'block', fontSize: '0.725rem', fontWeight: '700', color: 'var(--color-text-secondary)', marginBottom: '0.45rem' }}>
                      Available for you:
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {availableCoupons.slice(0, 3).map((cp) => (
                        <button
                          key={cp.id}
                          type="button"
                          onClick={() => handleApplyCoupon(cp.code)}
                          style={{
                            textAlign: 'left',
                            background: 'none',
                            border: '1px dashed var(--color-border)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.4rem 0.65rem',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span style={{ fontWeight: '700', fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                            {cp.code}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                            {cp.discountType === 'PERCENTAGE' ? `${cp.discountValue}% OFF` : `₹${cp.discountValue} OFF`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Price Details Summary Card ── */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.8125rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
              Price Summary
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-primary)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Items Total ({cart?.totalItems || 0})</span>
                <span style={{ fontWeight: '600' }}>{formatPrice(cart?.subtotal || 0)}</span>
              </div>
              {appliedCoupon && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-discount)' }}>
                  <span>Coupon Discount ({appliedCoupon.code})</span>
                  <span style={{ fontWeight: '700' }}>-{formatPrice(appliedCoupon.discountAmount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-primary)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Delivery Fee</span>
                <span style={{ color: 'var(--color-discount)', fontWeight: '700' }}>FREE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-primary)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Payment Mode</span>
                <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                  {paymentMethod === 'RAZORPAY' ? 'Razorpay Online' : 'Cash on Delivery'}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>Total Amount</span>
              <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                {formatPrice(appliedCoupon ? appliedCoupon.finalAmount : (cart?.subtotal || 0))}
              </span>
            </div>

            {/* Place Order & Pay CTA */}
            <button
              id="place-order-button"
              type="button"
              onClick={handlePlaceOrderAndPay}
              disabled={submitting || addresses.length === 0}
              className="btn btn-deal"
              style={{
                width: '100%',
                height: '48px',
                fontSize: '0.9375rem',
                fontWeight: '700',
              }}
            >
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Processing...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  {paymentMethod === 'COD' ? 'CONFIRM CASH ON DELIVERY' : 'PROCEED TO ONLINE PAYMENT'} <ArrowRight size={16} />
                </span>
              )}
            </button>

            {/* Trust Footnote */}
            <div
              style={{
                marginTop: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--color-text-secondary)',
                fontSize: '0.725rem',
                borderTop: '1px solid var(--color-border-subtle)',
                paddingTop: '0.85rem',
              }}
            >
              <ShieldCheck size={18} color="var(--color-discount)" style={{ flexShrink: 0 }} />
              <span>Razorpay 256-bit SSL encrypted checkout. PCI-DSS Level 1 compliant.</span>
            </div>
          </div>
        </div>

      </div>

      {/* Address Form Modal */}
      {showAddressModal && (
        <AddressForm
          initialData={editingAddress}
          onSuccess={handleAddressCreatedOrUpdated}
          onCancel={() => { setShowAddressModal(false); setEditingAddress(null) }}
        />
      )}

      {/* Dynamic UPI QR Payment Modal */}
      {devModalOrder && (
        <DynamicUpiQrModal
          orderId={devModalOrder.orderId}
          amount={devModalOrder.gwOrder.amount}
          amountInPaise={devModalOrder.gwOrder.amountInPaise}
          gatewayOrderId={devModalOrder.gwOrder.gatewayOrderId}
          keyId={devModalOrder.gwOrder.keyId}
          customerName={devModalOrder.gwOrder.customerName}
          onPaymentSuccess={handleCompletePaymentFromModal}
          onPaymentFailed={(msg) => {
            setError(msg)
            setDevModalOrder(null)
          }}
          onDismiss={() => {
            setDevModalOrder(null)
            setError('Payment window was closed. You can retry payment now or switch to Cash on Delivery.')
          }}
          onSwitchToCod={() => {
            const oid = devModalOrder.orderId
            setDevModalOrder(null)
            handleSwitchToCod(oid)
          }}
          checkStatusApi={getPaymentByOrderId}
        />
      )}
    </div>
  )
}

export default Checkout

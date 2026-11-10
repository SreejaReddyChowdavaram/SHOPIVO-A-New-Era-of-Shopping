/**
 * LandingPage.jsx — Public Landing Page for Shopivo
 * 
 * Features:
 * - Public navigation with brand logo, smooth section jump links, Theme Toggle, Sign In, Get Started
 * - Hero section with clear value proposition and calm progressive SVG constellation visual
 * - Section 2: Why Shopivo (4 core value cards)
 * - Section 3: How It Works (Interactive 6-step shopping pipeline + intelligent anomaly detection layer)
 * - Section 4: Platform Capabilities (10 real implemented features grid)
 * - Section 5: Security by Design (Real architectural security highlights: JWT, BCrypt, server-authoritative validation)
 * - Section 6: Intelligent Protection for Digital Commerce (Multi-entity relationship overview)
 * - Section 7: Trust & Transparency (Real orders, payment records, invoices, reviews)
 * - Section 8: Final Call to Action
 * - Public Minimal Footer
 * - Full Light / Dark Theme & reduced-motion support
 */

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  Sun,
  Moon,
  ArrowRight,
  Menu,
  X,
  Lock,
  ShoppingBag,
  CreditCard,
  Truck,
  RotateCcw,
  Star,
  FileText,
  Bell,
  Search,
  Heart,
  Layers,
  Database,
  KeyRound,
  Sparkles,
  ChevronRight,
  ArrowDownRight,
} from 'lucide-react'
import ThemeToggle from '@/components/common/ThemeToggle'
import { ROUTES } from '@/constants/routes'
import BrandLogo from '@/components/common/BrandLogo'
import shopivoLogo from '@/assets/shopivo-logo.png'

// ── Hero Calm Animated SVG Constellation Visual ──
const HeroConstellation = () => {
  const nodes = [
    { id: 'hn1', x: 70,  y: 65,  r: 5,  label: 'Account',  delay: '0.4s' },
    { id: 'hn2', x: 210, y: 40,  r: 6,  label: 'Product',  delay: '1.2s' },
    { id: 'hn3', x: 330, y: 85,  r: 5,  label: 'Cart',     delay: '2.0s' },
    { id: 'hn4', x: 340, y: 220, r: 6,  label: 'Checkout', delay: '2.8s' },
    { id: 'hn5', x: 200, y: 250, r: 7,  label: 'Payment',  delay: '3.6s' },
    { id: 'hn6', x: 60,  y: 200, r: 5,  label: 'Order',    delay: '4.4s' },
  ]

  const edges = [
    { from: 'hn1', to: 'hn2', len: 142, delay: '0.8s' },
    { from: 'hn2', to: 'hn3', len: 128, delay: '1.6s' },
    { from: 'hn3', to: 'hn4', len: 135, delay: '2.4s' },
    { from: 'hn4', to: 'hn5', len: 143, delay: '3.2s' },
    { from: 'hn5', to: 'hn6', len: 148, delay: '4.0s' },
    { from: 'hn6', to: 'hn1', len: 135, delay: '4.8s' },
    { from: 'hn2', to: 'hn5', len: 210, delay: '5.4s' },
  ]

  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  return (
    <div className="hero-visual-card" aria-hidden="true">
      {/* Soft Ambient Blobs */}
      <div className="hero-ambient-blob hero-blob-1" />
      <div className="hero-ambient-blob hero-blob-2" />

      {/* Center Shield Indicator */}
      <div className="hero-center-shield">
        <div className="shield-icon-badge" style={{ background: '#ffffff', border: '1px solid var(--color-border)' }}>
          <img src={shopivoLogo} alt="Shopivo" width="34" height="34" style={{ objectFit: 'contain' }} />
        </div>
        <span className="shield-caption">Shopivo Core</span>
      </div>

      {/* Progressive SVG Constellation */}
      <svg className="hero-constellation-svg" viewBox="0 0 400 300">
        <defs>
          <radialGradient id="heroNodeGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="60%" stopColor="var(--color-primary)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--color-primary-dark)" stopOpacity="0.8" />
          </radialGradient>
          <filter id="heroGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Sequential Lines */}
        {edges.map((e, idx) => {
          const n1 = nodeMap.get(e.from)
          const n2 = nodeMap.get(e.to)
          if (!n1 || !n2) return null
          return (
            <line
              key={idx}
              x1={n1.x}
              y1={n1.y}
              x2={n2.x}
              y2={n2.y}
              className="hero-edge-line"
              style={{
                strokeDasharray: e.len,
                strokeDashoffset: e.len,
                animation: `heroLineDraw 10s ease-in-out infinite`,
                animationDelay: e.delay,
              }}
            />
          )
        })}

        {/* Constellation Nodes */}
        {nodes.map((n) => (
          <g
            key={n.id}
            className="hero-node-group"
            style={{
              transformOrigin: `${n.x}px ${n.y}px`,
              animation: `heroNodePop 10s cubic-bezier(0.34, 1.56, 0.64, 1) infinite`,
              animationDelay: n.delay,
            }}
          >
            <circle cx={n.x} cy={n.y} r={n.r + 6} className="hero-node-halo" />
            <circle
              cx={n.x}
              cy={n.y}
              r={n.r}
              fill="url(#heroNodeGrad)"
              filter="url(#heroGlow)"
              stroke="#ffffff"
              strokeWidth="1"
            />
            <text
              x={n.x}
              y={n.y + (n.y > 150 ? 18 : -12)}
              textAnchor="middle"
              className="hero-node-label"
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const scrollToSection = (id) => {
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="landing-page-root">
      {/* ─────────────────────────────────────────────────────────
          1. PUBLIC NAVBAR
          ───────────────────────────────────────────────────────── */}
      <header className="landing-navbar">
        <div className="landing-navbar-container">
          {/* Brand */}
          <BrandLogo size="lg" to="/" ariaLabel="Shopivo Home" />

          {/* Desktop Navigation Links */}
          <nav className="landing-nav-links" aria-label="Main Navigation">
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="landing-nav-link"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('platform-capabilities')}
              className="landing-nav-link"
            >
              Platform
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('security-by-design')}
              className="landing-nav-link"
            >
              Security
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('intelligent-protection')}
              className="landing-nav-link"
            >
              Intelligent Protection
            </button>
          </nav>

          {/* Actions: Theme Toggle + Auth Buttons */}
          <div className="landing-nav-actions">
            <ThemeToggle />

            <Link to={ROUTES.PORTAL_SELECTION} className="btn btn-ghost landing-auth-btn">
              Sign In
            </Link>

            <Link to={ROUTES.PORTAL_SELECTION} className="btn btn-primary landing-auth-btn">
              Get Started
            </Link>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="landing-mobile-toggle"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="landing-mobile-menu">
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="mobile-nav-item"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('platform-capabilities')}
              className="mobile-nav-item"
            >
              Platform
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('security-by-design')}
              className="mobile-nav-item"
            >
              Security
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('intelligent-protection')}
              className="mobile-nav-item"
            >
              Intelligent Protection
            </button>
            <div className="mobile-menu-actions">
              <Link to={ROUTES.PORTAL_SELECTION} className="btn btn-secondary w-full" onClick={() => setMobileMenuOpen(false)}>
                Sign In
              </Link>
              <Link to={ROUTES.PORTAL_SELECTION} className="btn btn-primary w-full" onClick={() => setMobileMenuOpen(false)}>
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────
          2. HERO SECTION
          ───────────────────────────────────────────────────────── */}
      <section className="landing-hero-section">
        <div className="landing-container landing-hero-grid">
          {/* Left Column: Headline, Description & CTAs */}
          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={14} className="badge-icon" />
              <span>A New Era of Shopping</span>
            </div>

            <h1 className="hero-title">
              Shopivo<br />
              <span className="hero-title-highlight">A New Era of Shopping</span>
            </h1>

            <p className="hero-description">
              An intelligent e-commerce marketplace designed to make digital shopping safer,
              more transparent, and seamless with built-in account security, structured
              checkout, and relationship-aware transaction integrity.
            </p>

            <div className="hero-cta-group">
              <Link to={ROUTES.PORTAL_SELECTION} className="btn btn-primary btn-lg hero-primary-btn">
                Get Started
                <ArrowRight size={18} />
              </Link>
              <Link to={ROUTES.PORTAL_SELECTION} className="btn btn-secondary btn-lg hero-secondary-btn">
                Sign In
              </Link>
            </div>

            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="hero-explore-link"
            >
              Explore how it works <ArrowDownRight size={14} />
            </button>
          </div>

          {/* Right Column: Hero Visual */}
          <div className="hero-visual-wrapper">
            <HeroConstellation />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          3. SECTION 2: WHY SHOPIVO
          ───────────────────────────────────────────────────────── */}
      <section id="why-secure-ai" className="landing-section">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">Core Value</span>
            <h2 className="section-title">Why Shopivo?</h2>
            <p className="section-subtitle">
              Designed from the ground up to unify modern marketplace conveniences with
              rock-solid account protection and verifiable order processing.
            </p>
          </div>

          <div className="cards-grid-4">
            <div className="feature-card">
              <div className="feature-icon-wrapper icon-blue">
                <Lock size={22} />
              </div>
              <h3 className="feature-card-title">Secure Accounts</h3>
              <p className="feature-card-desc">
                Protected authentication with stateless JWT tokens, BCrypt password hashing, and granular customer account security controls.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper icon-indigo">
                <CreditCard size={22} />
              </div>
              <h3 className="feature-card-title">Trusted Transactions</h3>
              <p className="feature-card-desc">
                Server-authoritative price validation, mock payment verification, and immutable transaction status tracking across every order.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper icon-teal">
                <ShoppingBag size={22} />
              </div>
              <h3 className="feature-card-title">Complete Shopping Journey</h3>
              <p className="feature-card-desc">
                Browse catalog products, manage wishlist and cart, execute structured checkout, track deliveries, and handle returns smoothly.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper icon-purple">
                <Layers size={22} />
              </div>
              <h3 className="feature-card-title">Intelligent Protection</h3>
              <p className="feature-card-desc">
                Engineered to model behavioral and transactional relations, laying the foundation for intelligent anomaly and risk detection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          4. SECTION 3: HOW IT WORKS
          ───────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="landing-section section-sunken">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">Platform Pipeline</span>
            <h2 className="section-title">How the Shopping Experience Works</h2>
            <p className="section-subtitle">
              A transparent, end-to-end e-commerce flow with continuous verification at every stage.
            </p>
          </div>

          {/* 6-Step Visual Pipeline */}
          <div className="pipeline-steps-grid">
            {[
              { num: '01', title: 'Browse Products', desc: 'Search category catalogs with live price and rating filters', icon: <Search size={20} /> },
              { num: '02', title: 'Cart & Wishlist', desc: 'Save favorites and prepare orders with quantity checks', icon: <Heart size={20} /> },
              { num: '03', title: 'Secure Checkout', desc: 'Select validated shipping addresses and review order details', icon: <Lock size={20} /> },
              { num: '04', title: 'Sandbox Payment', desc: 'Execute simulated card or UPI payments with immediate receipt', icon: <CreditCard size={20} /> },
              { num: '05', title: 'Order Tracking', desc: 'Monitor status progression from processing to shipped and delivered', icon: <Truck size={20} /> },
              { num: '06', title: 'Reviews & Returns', desc: 'Leave verified ratings or request returns with tracked refunds', icon: <RotateCcw size={20} /> },
            ].map((step) => (
              <div key={step.num} className="pipeline-card">
                <div className="pipeline-card-header">
                  <div className="pipeline-icon">{step.icon}</div>
                  <span className="pipeline-step-num">{step.num}</span>
                </div>
                <h3 className="pipeline-title">{step.title}</h3>
                <p className="pipeline-desc">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Intelligent Protection Banner underneath */}
          <div className="protection-layer-card">
            <div className="protection-layer-icon">
              <Shield size={28} />
            </div>
            <div className="protection-layer-content">
              <h3 className="protection-layer-title">Integrated Anomaly Protection Layer</h3>
              <p className="protection-layer-desc">
                The platform is designed to use transaction and behavioral relationships to support intelligent anomaly detection,
                helping maintain a trusted environment for customers and verified merchants.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          5. SECTION 4: PLATFORM CAPABILITIES
          ───────────────────────────────────────────────────────── */}
      <section id="platform-capabilities" className="landing-section">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">Implemented Features</span>
            <h2 className="section-title">Built with Comprehensive Capabilities</h2>
            <p className="section-subtitle">
              Everything you need for a modern shopping platform, implemented and verified.
            </p>
          </div>

          <div className="capabilities-grid">
            {[
              { title: 'Customer Accounts', desc: 'Profile details, shipping addresses, password changes, and preferences', icon: <KeyRound size={20} /> },
              { title: 'Product Discovery', desc: 'Instant search, category filters, price sorting, and stock status', icon: <Search size={20} /> },
              { title: 'Cart & Wishlist', desc: 'Persistent cart, item counts, price calculations, and wishlist save', icon: <ShoppingBag size={20} /> },
              { title: 'Structured Checkout', desc: 'Address selection, order summary, coupon application, and total validation', icon: <Lock size={20} /> },
              { title: 'Sandbox Payments', desc: 'Simulated payment processing with instant success and failure handling', icon: <CreditCard size={20} /> },
              { title: 'Order Lifecycle', desc: 'Live status timeline from Pending to Shipped, Delivered, or Cancelled', icon: <Truck size={20} /> },
              { title: 'Customer Reviews', desc: 'Post star ratings and written reviews on verified purchases', icon: <Star size={20} /> },
              { title: 'Returns & Refunds', desc: 'Request item returns with return reasons and track refund settlements', icon: <RotateCcw size={20} /> },
              { title: 'Invoice Access', desc: 'Instant downloadable PDF invoices and printable receipt summaries', icon: <FileText size={20} /> },
              { title: 'Live Notifications', desc: 'Real-time order status updates, delivery alerts, and security notices', icon: <Bell size={20} /> },
            ].map((cap, i) => (
              <div key={i} className="capability-card">
                <div className="capability-icon">{cap.icon}</div>
                <div>
                  <h3 className="capability-title">{cap.title}</h3>
                  <p className="capability-desc">{cap.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          6. SECTION 5: SECURITY BY DESIGN
          ───────────────────────────────────────────────────────── */}
      <section id="security-by-design" className="landing-section section-sunken">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">Architecture</span>
            <h2 className="section-title">Security by Design</h2>
            <p className="section-subtitle">
              Strict backend validation and modern web standards ensure your data and transactions remain private and tamper-resistant.
            </p>
          </div>

          <div className="security-cards-grid">
            <div className="security-card">
              <div className="security-card-header">
                <div className="security-card-icon icon-blue">
                  <KeyRound size={22} />
                </div>
                <h3 className="security-card-title">Stateless JWT Auth</h3>
              </div>
              <p className="security-card-desc">
                Protected authorization with cryptographically signed JSON Web Tokens, short-lived sessions, and automatic token expiry handling.
              </p>
            </div>

            <div className="security-card">
              <div className="security-card-header">
                <div className="security-card-icon icon-indigo">
                  <Lock size={22} />
                </div>
                <h3 className="security-card-title">BCrypt Password Hashing</h3>
              </div>
              <p className="security-card-desc">
                Industry-standard salted password hashing ensuring credentials are never stored or exposed in plaintext.
              </p>
            </div>

            <div className="security-card">
              <div className="security-card-header">
                <div className="security-card-icon icon-teal">
                  <Database size={22} />
                </div>
                <h3 className="security-card-title">Server-Authoritative Pricing</h3>
              </div>
              <p className="security-card-desc">
                All prices, coupons, and totals are strictly computed on the backend server, preventing client-side price manipulation.
              </p>
            </div>

            <div className="security-card">
              <div className="security-card-header">
                <div className="security-card-icon icon-purple">
                  <Shield size={22} />
                </div>
                <h3 className="security-card-title">Role-Based Access Control</h3>
              </div>
              <p className="security-card-desc">
                Strict separation between Customer, Merchant/Seller, and Administrator permissions with backend ownership validation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          7. SECTION 6: INTELLIGENT PROTECTION
          ───────────────────────────────────────────────────────── */}
      <section id="intelligent-protection" className="landing-section">
        <div className="landing-container">
          <div className="intelligent-spotlight-card">
            <div className="spotlight-content">
              <span className="section-tag" style={{ color: '#04DB7E' }}>Security Intelligence</span>
              <h2 className="spotlight-title">
                Intelligent Protection for Digital Commerce
              </h2>
              <p className="spotlight-desc">
                Shopivo is designed to go beyond traditional isolated transaction checks by analyzing relationships
                between users, orders, devices, payments, and behavioral activity to identify unusual patterns.
              </p>
              <div className="spotlight-signals-grid">
                <div className="signal-pill">
                  <span className="signal-dot" /> User Entity Relations
                </div>
                <div className="signal-pill">
                  <span className="signal-dot" /> Order Frequency Patterns
                </div>
                <div className="signal-pill">
                  <span className="signal-dot" /> Payment Method Integrity
                </div>
                <div className="signal-pill">
                  <span className="signal-dot" /> Behavioral Consistency
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          8. SECTION 7: TRUST & TRANSPARENCY
          ───────────────────────────────────────────────────────── */}
      <section className="landing-section section-sunken">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">Customer Confidence</span>
            <h2 className="section-title">Built on Trust and Transparency</h2>
            <p className="section-subtitle">
              Clear records, verifiable reviews, and accessible receipts give you complete visibility into every transaction.
            </p>
          </div>

          <div className="trust-metrics-grid">
            <div className="trust-metric-card">
              <div className="trust-metric-icon">
                <FileText size={24} />
              </div>
              <h3 className="trust-metric-title">Instant Invoices</h3>
              <p className="trust-metric-desc">Download detailed itemized invoice PDFs directly after checkout.</p>
            </div>

            <div className="trust-metric-card">
              <div className="trust-metric-icon">
                <Star size={24} />
              </div>
              <h3 className="trust-metric-title">Verified Reviews</h3>
              <p className="trust-metric-desc">Customer ratings submitted only on fulfilled, confirmed orders.</p>
            </div>

            <div className="trust-metric-card">
              <div className="trust-metric-icon">
                <RotateCcw size={24} />
              </div>
              <h3 className="trust-metric-title">Transparent Returns</h3>
              <p className="trust-metric-desc">Track return request status and settlement progress step by step.</p>
            </div>

            <div className="trust-metric-card">
              <div className="trust-metric-icon">
                <Bell size={24} />
              </div>
              <h3 className="trust-metric-title">Real-Time Alerts</h3>
              <p className="trust-metric-desc">Immediate alerts for order placement, shipment dispatch, and delivery.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          9. SECTION 8: FINAL CTA
          ───────────────────────────────────────────────────────── */}
      <section className="landing-cta-section">
        <div className="landing-container">
          <div className="final-cta-card">
            <div className="final-cta-blob" />
            <h2 className="final-cta-title">Ready to experience Shopivo?</h2>
            <p className="final-cta-desc">
              Create your customer account in seconds or sign in to explore the platform.
            </p>
            <div className="final-cta-buttons">
              <Link to={ROUTES.PORTAL_SELECTION} className="btn btn-primary btn-lg">
                Get Started
                <ArrowRight size={18} />
              </Link>
              <Link to={ROUTES.PORTAL_SELECTION} className="btn btn-secondary btn-lg">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          10. PREMIUM PRODUCT FOOTER
          ───────────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-grid">
            {/* Brand / Overview Column */}
            <div className="footer-col-brand">
              <div style={{ marginBottom: '1rem' }}>
                <BrandLogo size="md" to="/" ariaLabel="Shopivo Home" />
              </div>
              <p className="footer-brand-tagline">
                A New Era of Shopping
              </p>
              <p className="footer-brand-desc">
                An intelligent e-commerce platform designed to make digital shopping more convenient, transparent, and security-aware.
              </p>
              <div className="footer-badge-wrapper">
                <span className="footer-trust-badge">
                  <span className="footer-status-dot" /> Built for modern digital commerce
                </span>
              </div>
            </div>

            {/* Column 2: Platform */}
            <div className="footer-col">
              <h4 className="footer-col-heading">Platform</h4>
              <ul className="footer-col-list">
                <li>
                  <button type="button" onClick={() => scrollToSection('platform-capabilities')} className="footer-link">
                    Product Discovery
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('platform-capabilities')} className="footer-link">
                    Cart & Wishlist
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('how-it-works')} className="footer-link">
                    Secure Checkout
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('how-it-works')} className="footer-link">
                    Order Tracking
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('platform-capabilities')} className="footer-link">
                    Customer Reviews
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('platform-capabilities')} className="footer-link">
                    Returns & Invoices
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Security & Tech */}
            <div className="footer-col">
              <h4 className="footer-col-heading">Security & Tech</h4>
              <ul className="footer-col-list">
                <li>
                  <button type="button" onClick={() => scrollToSection('security-by-design')} className="footer-link">
                    JWT Authentication
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('security-by-design')} className="footer-link">
                    BCrypt Hashing
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('security-by-design')} className="footer-link">
                    Server Validation
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('security-by-design')} className="footer-link">
                    Role-Based Access
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('intelligent-protection')} className="footer-link">
                    Relation Intelligence
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('intelligent-protection')} className="footer-link">
                    Anomaly Modeling
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Support */}
            <div className="footer-col">
              <h4 className="footer-col-heading">Support</h4>
              <ul className="footer-col-list">
                <li>
                  <Link to={ROUTES.PORTAL_SELECTION} className="footer-link">
                    Account Help
                  </Link>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('how-it-works')} className="footer-link">
                    Order Assistance
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('why-secure-ai')} className="footer-link">
                    Safe Shopping Guide
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('why-secure-ai')} className="footer-link">
                    FAQ & Verification
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 5: Trust & Standards */}
            <div className="footer-col">
              <h4 className="footer-col-heading">Trust & Standards</h4>
              <ul className="footer-col-list">
                <li>
                  <button type="button" onClick={() => scrollToSection('security-by-design')} className="footer-link">
                    Privacy Overview
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('why-secure-ai')} className="footer-link">
                    Transaction Integrity
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('security-by-design')} className="footer-link">
                    Ownership Validation
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('platform-capabilities')} className="footer-link">
                    Accessibility
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom Bar */}
          <div className="landing-footer-bottom">
            <p className="footer-copy">
              © 2026 Shopivo · Customer Platform. All rights reserved.
            </p>
            <div className="footer-bottom-badges">
              <span className="footer-bottom-badge">
                <span className="footer-status-dot-green" /> Customer Platform Active
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage

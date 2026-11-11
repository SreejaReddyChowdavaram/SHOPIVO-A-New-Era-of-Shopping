# SHOPIVO Full System Architecture

**Project:** SHOPIVO — A New Era of Shopping  
**Architecture Specification Document (Semester 1 & 2)**  
**Version:** 1.0.0 (Production-Ready Multi-Vendor Architecture)

---

## 1. Project Overview & Business Objectives

SHOPIVO is a multi-vendor e-commerce platform built to demonstrate enterprise architecture, clean role-based boundaries, server-authoritative transactions, and fraud resilience. 

### Core Business Objectives:
- **True Multi-Tenancy for Sellers:** Independent storefronts with segregated order fulfillment, catalog administration, inventory control, and revenue analytics.
- **Customer Security & Trust:** Cryptographic authentication, zero client-side price tampering, secure Razorpay payments, verified purchase reviews, and transparent return/refund workflows.
- **Unified Governance for Administrators:** Centralized product moderation, dispute handling, user verification, and activity telemetry.
- **CyberForge Design Language:** High-contrast, accessibility-focused interface utilizing `#050505` black canvas, `#101010` card elements, and `#04DB7E` emerald accents.

---

## 2. High-Level System Architecture

```mermaid
flowchart TD
    Client["Client Browsers (Desktop & Mobile)"] --> CDN["Render Global CDN / Static Site"]
    CDN --> SPA["React 19 + Vite SPA (Client Router)"]
    SPA -->|REST API over TLS /api/*| Gateway["Render Docker Web Service (Reverse Proxy)"]
    Gateway --> SB["Spring Boot 3.4.3 Application"]
    
    subgraph SpringBootApp ["SecureCommerce AI Platform (Spring Boot)"]
        SecFilter["Spring Security Filter Chain (RateLimit, CORS, JWT Auth)"]
        SecFilter --> Controllers["REST Controllers (Customer, Seller, Admin)"]
        Controllers --> Services["Business Service Layer (Transactional)"]
        Services --> JPA["Spring Data JPA / Hibernate"]
        Services --> MailClient["JavaMailSender (Brevo SMTP Client)"]
        Services --> RzpClient["Razorpay Java SDK"]
        Services --> GoogleClient["GoogleIdTokenVerifier (JWKS)"]
    end
    
    JPA --> Postgres[("Managed PostgreSQL Database")]
    MailClient --> BrevoRelay["smtp-relay.brevo.com:587"]
    RzpClient --> RazorpayAPI["api.razorpay.com"]
    GoogleClient --> GoogleJWKS["oauth2.googleapis.com"]
```

---

## 3. Authentication & Authorization Architecture

SHOPIVO implements a unified security model that enforces strict role-based access control across all operations:

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant Frontend as React Router & Redux
    participant AuthCtrl as AuthController
    participant AuthSvc as AuthService
    participant EventSvc as EventLoggingService
    participant DB as PostgreSQL (users, user_events)

    User->>Frontend: Submits Credentials (email, password, portalRole)
    Frontend->>AuthCtrl: POST /api/auth/login
    AuthCtrl->>AuthSvc: login(request)
    AuthSvc->>DB: findByEmail(email)
    
    alt User Not Found or Password Mismatch
        AuthSvc->>EventSvc: logEvent(LOGIN_FAILURE, email, reason)
        EventSvc->>DB: INSERT into user_events
        AuthSvc-->>Frontend: 401 Unauthorized (InvalidCredentialsException)
    else Role Mismatch with Selected Portal
        AuthSvc->>EventSvc: logEvent(LOGIN_FAILURE, ROLE_MISMATCH)
        EventSvc->>DB: INSERT into user_events
        AuthSvc-->>Frontend: 401 Unauthorized ("Registered as CUSTOMER...")
    else Authentication Succeeded
        AuthSvc->>EventSvc: logEvent(LOGIN_SUCCESS, user, ip, userAgent)
        EventSvc->>DB: INSERT into user_events
        AuthSvc-->>Frontend: 200 OK + JWT Bearer Token + User DTO
        Frontend->>Frontend: localStorage.setItem('sc_token', token)
        Frontend-->>User: Redirect to Role Dashboard
    end
```

---

## 4. Complete Workflow Diagrams

### A. Cart-to-Checkout & Razorpay Payment Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Cart as Cart Page
    participant OrderSvc as OrderServiceImpl
    participant RzpSvc as PaymentServiceImpl
    participant RzpAPI as Razorpay Gateway
    participant WebhookCtrl as PaymentWebhookController
    participant DB as PostgreSQL

    Customer->>Cart: Clicks "Proceed to Checkout"
    Customer->>OrderSvc: POST /api/orders (addressId, couponCode)
    OrderSvc->>DB: Server re-calculates product prices & stock availability
    OrderSvc->>DB: INSERT order (status: PENDING)
    OrderSvc->>RzpSvc: createPaymentOrder(orderId)
    RzpSvc->>RzpAPI: Orders.create(amount, currency: INR)
    RzpAPI-->>RzpSvc: razorpay_order_id
    RzpSvc->>DB: INSERT payment (status: CREATED)
    RzpSvc-->>Customer: Order Details + Razorpay Order ID + UPI URI

    Customer->>RzpAPI: Completes payment via UPI / Card
    RzpAPI->>WebhookCtrl: POST /api/payments/webhook (payment.captured)
    WebhookCtrl->>WebhookCtrl: Verify HMAC-SHA256 signature
    WebhookCtrl->>DB: Check idempotency (prevent duplicate processing)
    WebhookCtrl->>DB: UPDATE payment (status: CAPTURED)
    WebhookCtrl->>DB: UPDATE order (status: CONFIRMED)
    WebhookCtrl-->>RzpAPI: 200 OK
```

---

### B. Forgot Password & Brevo SMTP OTP Workflow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FP as ForgotPassword UI
    participant AuthCtrl as AuthController
    participant OtpSvc as PasswordResetService
    participant MailSvc as SmtpEmailService
    participant Brevo as Brevo SMTP Relay
    participant DB as PostgreSQL (password_reset_otps)

    User->>FP: Enter email & select portal (Customer/Seller/Admin)
    FP->>AuthCtrl: POST /api/auth/forgot-password/request-otp
    AuthCtrl->>OtpSvc: requestOtp(email, portalRole)
    OtpSvc->>MailSvc: isConfigured()
    
    alt SMTP Unconfigured
        OtpSvc-->>FP: HTTP 503 Service Unavailable (Zero records saved)
    else SMTP Configured
        OtpSvc->>DB: Invalidate prior unconsumed OTPs for user
        OtpSvc->>OtpSvc: Generate 6-digit SecureRandom code
        OtpSvc->>DB: INSERT hashed OTP (BCrypt), 10m expiry, attempts: 0
        OtpSvc->>MailSvc: sendPasswordResetOtp(email, code, 10)
        MailSvc->>Brevo: STARTTLS, Authenticated MIME dispatch
        Brevo-->>User: Delivers corporate branded transactional email
        OtpSvc-->>FP: 200 OK ("Verification code dispatched")
        
        User->>FP: Enters 6-digit OTP
        FP->>AuthCtrl: POST /api/auth/forgot-password/verify-otp
        AuthCtrl->>OtpSvc: verifyOtp(email, otp)
        OtpSvc->>DB: Verify hash, expiry (<10m), attempts (<5)
        OtpSvc-->>FP: 200 OK + Single-Use Reset Token (UUID)
        
        User->>FP: Enters new password + confirms
        FP->>AuthCtrl: POST /api/auth/forgot-password/reset-password
        AuthCtrl->>OtpSvc: resetPassword(token, newPassword)
        OtpSvc->>DB: UPDATE user password_hash (BCrypt cost-12)
        OtpSvc->>DB: Consume reset token (single-use)
        OtpSvc-->>FP: 200 OK ("Password updated successfully")
    end
```

---

### C. Multi-Seller Product Lifecycle

```mermaid
stateDiagram-v2
    [*] --> DraftOrPending: Seller submits new product via AddProduct
    DraftOrPending --> Approved: Admin Reviews & Approves
    DraftOrPending --> Rejected: Admin Rejects with Rejection Reason
    Rejected --> DraftOrPending: Seller amends details & resubmits
    Approved --> InStock: Seller manages inventory (Stock > 0)
    InStock --> LowStock: Stock drops below threshold
    LowStock --> OutOfStock: Stock depleted to 0
    OutOfStock --> InStock: Seller updates stock in Inventory
    Approved --> Inactive: Seller or Admin disables listing
    Inactive --> Approved: Seller or Admin reactivates listing
```

---

## 5. Main Database Entity Relationships

```mermaid
erDiagram
    USERS ||--o{ ADDRESSES : "has"
    USERS ||--o{ PRODUCTS : "sells (SELLER)"
    USERS ||--o{ ORDERS : "places (CUSTOMER)"
    USERS ||--o{ REVIEWS : "writes (CUSTOMER)"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ PASSWORD_RESET_OTPS : "requests"
    USERS ||--o{ USER_EVENTS : "triggers"
    
    CATEGORIES ||--o{ PRODUCTS : "categorizes"
    
    PRODUCTS ||--o{ CART_ITEMS : "added to"
    PRODUCTS ||--o{ WISHLIST_ITEMS : "saved in"
    PRODUCTS ||--o{ ORDER_ITEMS : "purchased as"
    PRODUCTS ||--o{ REVIEWS : "reviewed by"
    
    ORDERS ||--o{ ORDER_ITEMS : "contains"
    ORDERS ||--o{ PAYMENTS : "paid through"
    ORDERS ||--o{ RETURN_REQUESTS : "returns initiated on"
    
    RETURN_REQUESTS ||--o{ REFUNDS : "refund issued for"
    PAYMENTS ||--o{ REFUNDS : "refund credited against"
```

---

## 6. Security, Rate Limiting & Error Architecture

1. **Defense in Depth:**
   - **Frontend:** Client-side sanitization, Redux state encapsulation, route guard layers (`ProtectedRoute`, `RoleRoute`).
   - **Gateway / Transport:** TLS termination, Render reverse proxy headers, strict CORS policy (`http://localhost:5173`, `https://*.onrender.com`).
   - **API Layer:** `RateLimitingFilter` enforces a token-bucket algorithm (maximum 10 login attempts per minute, 5 registrations per minute per IP address).
   - **Data Layer:** Server-authoritative calculations, BCrypt cost-12 password hashing, parameterized JPA queries preventing SQL injection, Hibernate entity validation (`ddl-auto: validate`).

2. **Standardized Error Envelope:**
   All errors resolve through `GlobalExceptionHandler` returning a uniform structure:
   ```json
   {
     "success": false,
     "message": "Human-readable error explanation",
     "timestamp": "2026-11-11T02:00:00Z",
     "errorCode": "INVALID_CREDENTIALS"
   }
   ```


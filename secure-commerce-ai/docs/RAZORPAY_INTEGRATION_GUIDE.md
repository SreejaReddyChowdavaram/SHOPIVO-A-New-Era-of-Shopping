# SHOPIVO — Production Razorpay Payment Integration & Operations Guide

**Platform:** SHOPIVO — A New Era of Shopping  
**Stack:** React 19 (Vite) + Java 21 LTS (Spring Boot 3.4.3) + PostgreSQL 16 + Razorpay  
**Revision Date:** November 2026  
**Status:** Certified Test Mode & Production-Ready Architecture

---

## Table of Contents
1. [Architecture Overview & Payment Lifecycle](#1-architecture-overview--payment-lifecycle)
2. [Environment Configuration](#2-environment-configuration)
3. [Local Setup Instructions](#3-local-setup-instructions)
4. [Razorpay Test Mode Setup](#4-razorpay-test-mode-setup)
5. [Render Production Deployment Configuration](#5-render-production-deployment-configuration)
6. [Webhook Ingestion & Idempotency](#6-webhook-ingestion--idempotency)
7. [Comprehensive Payment Testing Instructions](#7-comprehensive-payment-testing-instructions)
8. [Multi-Vendor Marketplace: Razorpay Route Architecture](#8-multi-vendor-marketplace-razorpay-route-architecture)
9. [Live Mode Go-Live Activation Checklist](#9-live-mode-go-live-activation-checklist)
10. [Security & Compliance Principles](#10-security--compliance-principles)

---

## 1. Architecture Overview & Payment Lifecycle

SHOPIVO decouples frontend payment initiation from backend authoritative verification. **The frontend is never trusted with payment amounts, captured statuses, or signatures.**

```
[ Customer Browser ]         [ SHOPIVO Backend ]          [ PostgreSQL DB ]          [ Razorpay API ]
        │                             │                           │                         │
 1. POST /api/orders                  │                           │                         │
   (addressId, couponCode) ─────────> │                           │                         │
        │                       Validate stock & calculate        │                         │
        │                       authoritative totalAmount         │                         │
        │                             │ ── Save Order (PENDING) ─>│                         │
        │ <── 201 Created (orderId) ─ │                           │                         │
        │                             │                           │                         │
 2. POST /payments/create-gateway-order                           │                         │
        │ ──────────────────────────> │                           │                         │
        │                       Fetch order amount from DB        │                         │
        │                       (Paise = amount * 100)            │                         │
        │                             │ ──────────────────────────────────────────────> POST /v1/orders
        │                             │ <────────────────────────────────────────────── gwOrderId: "order_..."
        │                             │ ── Save Payment (INITIATED) ──────────────────────>│
        │ <── GatewayOrderDto ─────── │                           │                         │
        │     (orderId, gwOrderId, keyId, amountInPaise)          │                         │
        │                             │                           │                         │
 3. Open Razorpay Checkout Modal      │                           │                         │
    Customer pays with UPI/Card/NetBanking                        │                         │
    Modal closes with payment tokens:                             │                         │
    - razorpay_payment_id             │                           │                         │
    - razorpay_order_id               │                           │                         │
    - razorpay_signature              │                           │                         │
        │                             │                           │                         │
 4. POST /payments/verify-gateway-payment                         │                         │
    (tokens above) ─────────────────> │                           │                         │
        │                       1. Constant-time HMAC-SHA256      │                         │
        │                          using RAZORPAY_KEY_SECRET      │                         │
        │                       2. GET /v1/payments/{paymentId} ──────────────────────────> GET /v1/payments/{id}
        │                       3. Check amount & currency=INR    │ <────────────────────── status: "captured"
        │                       4. Check gw status == captured    │                         │
        │                             │ ── Mark Payment (SUCCESS) ────────────────────────>│
        │                             │ ── Mark Order (CONFIRMED) ────────────────────────>│
        │                             │ ── Dispatch Notification ─────────────────────────>│
        │ <── 200 OK (PaymentResponse)│                           │                         │
        │                             │                           │                         │
 5. Redirect to Order Details         │                           │                         │
```

---

## 2. Environment Configuration

### Backend (`backend/.env` & Render Web Service Environment Variables)

| Variable | Required | Allowed Values | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `RAZORPAY_MODE` | **Yes** | `TEST` or `LIVE` | Operating mode. Enforces key validation on startup. | `TEST` |
| `RAZORPAY_KEY_ID` | **Yes** | String (`rzp_test_*` or `rzp_live_*`) | Razorpay API Key ID. Provided to frontend. | `rzp_test_51AbCdEfGhIjKl` |
| `RAZORPAY_KEY_SECRET` | **Yes** | String (Never commit!) | Razorpay API Key Secret. Kept strictly on backend. | *(Private Secret)* |
| `RAZORPAY_WEBHOOK_SECRET` | **Yes** | String (Never commit!) | Secret configured in Razorpay Dashboard for webhook HMAC. | *(Private Secret)* |
| `RAZORPAY_CURRENCY` | No | `INR` (Default) | Transaction currency. | `INR` |

### Frontend (`frontend/.env.local` & Render Static Site Environment Variables)

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | **Yes** | Base API path pointing to Spring Boot backend `/api` | `http://localhost:8080/api` or `https://shopivo-backend.onrender.com/api` |
| `VITE_RAZORPAY_KEY_ID` | Optional | Public Razorpay Key ID fallback (backend also provides key dynamically) | `rzp_test_51AbCdEfGhIjKl` |

> [!CAUTION]
> **Strict Security Barrier:**  
> Never define `VITE_RAZORPAY_KEY_SECRET` or `VITE_RAZORPAY_WEBHOOK_SECRET`. Vite exposes all `VITE_*` variables to the client browser bundle.

---

## 3. Local Setup Instructions

1. **Clone and enter repository:**
   ```bash
   cd "secure-commerce-ai"
   ```

2. **Configure Backend Environment:**
   Create or edit `backend/.env`:
   ```bash
   DB_URL=jdbc:postgresql://localhost:5432/securecommerce
   DB_USERNAME=postgres
   DB_PASSWORD=your_local_postgres_password
   JWT_SECRET=your_local_dev_jwt_secret_at_least_32_characters_long
   RAZORPAY_MODE=TEST
   RAZORPAY_KEY_ID=rzp_test_your_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
   CORS_ORIGINS=http://localhost:5173
   ```

3. **Configure Frontend Environment:**
   Create or edit `frontend/.env.local`:
   ```bash
   VITE_API_URL=http://localhost:8080/api
   VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
   ```

4. **Verify Backend Compilation & Tests:**
   ```bash
   cd backend
   .\mvnw.cmd clean test -Dtest=PaymentGatewayIntegrationTest
   ```

5. **Start Development Servers:**
   - **Backend:** `.\mvnw.cmd spring-boot:run`
   - **Frontend:** `cd ../frontend && npm run dev`

---

## 4. Razorpay Test Mode Setup

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Look at the top-left toggle and verify it is switched to **Test Mode** (orange badge).
3. Navigate to **Account & Settings > API Keys**.
4. Click **Generate Test Key**.
5. Copy the **Key ID** (`rzp_test_...`) and **Key Secret**.
6. Store them safely in your local `backend/.env`.

---

## 5. Render Production Deployment Configuration

### 1. Backend Service (`shopivo-backend`)
In the Render Dashboard under **Environment**:

1. `SPRING_PROFILES_ACTIVE`: `prod`
2. `RAZORPAY_MODE`: `TEST` (or `LIVE` when approved)
3. `RAZORPAY_KEY_ID`: `rzp_test_...`
4. `RAZORPAY_KEY_SECRET`: `<your_razorpay_key_secret>` (Hidden value)
5. `RAZORPAY_WEBHOOK_SECRET`: `<your_razorpay_webhook_secret>` (Hidden value)
6. Ensure database environment variables (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`) are connected to `shopivo-db`.
7. `CORS_ORIGINS`: `https://shopivo-frontend.onrender.com`

### 2. Frontend Static Site (`shopivo-frontend`)
In the Render Dashboard under **Environment**:

1. `VITE_API_URL`: `https://shopivo-backend.onrender.com/api`
2. `VITE_RAZORPAY_KEY_ID`: `rzp_test_...` (Public Key ID only)

---

## 6. Webhook Ingestion & Idempotency

### Webhook Configuration in Razorpay Dashboard
1. Go to **Settings > Webhooks > Add New Webhook** (or Edit existing).
2. **Webhook URL:**  
   `https://shopivo-a-new-era-of-shopping.onrender.com/api/payments/webhook/razorpay`
3. **Secret:** Set a strong webhook secret and save the identical string in `RAZORPAY_WEBHOOK_SECRET`.
4. **Active Events to subscribe (11 events):**
   - `qr_code.credited` *(CRITICAL for Dynamic UPI QR payment capture)*
   - `qr_code.closed`
   - `payment.captured`
   - `payment.authorized`
   - `payment.failed`
   - `order.paid`
   - `refund.created`
   - `refund.processed`
   - `refund.failed`
   - `payment.dispute.created`
   - `payment.dispute.won`

### How to Add `qr_code.credited` to an Existing Webhook in Razorpay Dashboard
1. Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Ensure the top mode toggle is set to **Test Mode** (or Live Mode if updating production).
3. Go to **Account & Settings** (left sidebar) -> under **API Keys and Webhooks**, click **Webhooks**.
4. Find your existing webhook URL: `https://shopivo-a-new-era-of-shopping.onrender.com/api/payments/webhook/razorpay`.
5. Click the **Edit** action icon (or row menu).
6. Under **Active Events**, locate **QR Code** section and check:
   - ☑ `qr_code.credited`
   - ☑ `qr_code.closed`
7. Click **Save** / **Update Webhook**. Razorpay will immediately begin dispatching QR credit notifications.

### Idempotency & Security Architecture
- **HMAC-SHA256 Signature:** Evaluated over the raw UTF-8 HTTP request body using `RAZORPAY_WEBHOOK_SECRET`. If signature does not match, returns `HTTP 400 Bad Request`.
- **Deduplication:** Razorpay sends event identifiers in the `X-Razorpay-Event-Id` header (or JSON `id`). SHOPIVO persists processed event IDs in `payment_webhook_events`. Repeated webhooks are acknowledged immediately (`200 OK`) and ignored without duplicate order fulfillment.
- **Monotonic Lifecycle:** Out-of-order events cannot downgrade an already `SUCCESS` payment or `CONFIRMED` order.

---

## 7. Comprehensive Payment Testing Instructions

Use Razorpay's simulated payment credentials during checkout in Test Mode:

### A. Test UPI
- In the Razorpay modal, select **UPI**.
- Enter Virtual Payment Address (VPA): `success@razorpay` or `customer@okhdfcbank`.
- Click **Pay**. In Test Mode, Razorpay provides a simulation screen to choose **Success** or **Failure**.
- To simulate failure: use `failure@razorpay`.

### B. Test Cards
| Card Type | Card Number | Expiry | CVV | OTP | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Success Domestic Visa** | `4111 1111 1111 1111` | Any future date | `123` | Any 6 digits | Payment Captured & Order Confirmed |
| **Success Mastercard** | `5123 4567 8901 2346` | Any future date | `123` | Any 6 digits | Payment Captured & Order Confirmed |
| **Declined Card** | `4000 0000 0000 1002` | Any future date | `123` | N/A | Payment Failed (Order remains PENDING, retry allowed) |
| **Insufficient Funds** | `4000 0000 0000 1005` | Any future date | `123` | N/A | Payment Failed |

### C. Test Net Banking
- Select any listed test bank (e.g., HDFC, ICICI, SBI).
- Select **Success** or **Failure** on the simulated bank redirection gateway.

---

## 8. Multi-Vendor Marketplace: Razorpay Route Architecture

SHOPIVO operates a multi-vendor catalog where customer carts may contain items sold by different verified sellers (`OrderItem.seller`).

### What Standard Razorpay Checkout Does vs. Does Not Do
- **Standard Checkout:** All money collected is credited 100% to SHOPIVO's primary merchant account. It **does not** automatically split payments among individual sellers.
- **Razorpay Route:** The official marketplace solution that performs automated fund split, commission retention, and seller transfers.

### Razorpay Route Component Architecture

```
                       [ Customer Payment: ₹3,000 ]
                                    │
                                    ▼
                     [ SHOPIVO Master Account ]
                                    │
                 ┌──────────────────┴──────────────────┐
                 ▼                                     ▼
        [ Platform Retention ]                [ Razorpay Route ]
        10% Commission: ₹300                           │
                                    ┌──────────────────┴──────────────────┐
                                    ▼                                     ▼
                          [ Seller A Linked Acc ]               [ Seller B Linked Acc ]
                          acc_123456789                         acc_987654321
                          Item Total: ₹1,500                   Item Total: ₹1,500
                          Payout: ₹1,350                       Payout: ₹1,350
                          (₹150 retained)                      (₹150 retained)
```

### Marketplace Implementation Requirements

1. **Seller Linked Accounts:**
   - Each seller must be registered as a Razorpay Linked Account (`acc_...`) via Razorpay Accounts API or OAuth onboarding.
   - Required seller KYC: Business registration, PAN/GSTIN, Bank Account Number, and IFSC code.
2. **Transfer Creation:**
   - When creating or capturing payment for an order with multiple sellers, `transfers` array is attached:
   ```json
   {
     "transfers": [
       {
         "account": "acc_seller_A",
         "amount": 135000,
         "currency": "INR",
         "notes": { "order_id": "101", "seller_id": "5" }
       },
       {
         "account": "acc_seller_B",
         "amount": 135000,
         "currency": "INR",
         "notes": { "order_id": "101", "seller_id": "8" }
       }
     ]
   }
   ```
3. **Platform Fee Calculation Formula:**
   $$\text{Platform Commission} = \sum (\text{OrderItem.lineTotal} \times \text{CommissionRate})$$
   $$\text{Seller Share} = \text{OrderItem.lineTotal} - \text{Commission}$$
4. **Refund Reversals:**
   When an admin approves a customer return for an item, Razorpay Route reverses the transfer from that specific seller's linked account (`reverse_all: 1` or partial reversal).

> [!IMPORTANT]
> **Route Compliance Requirement:**  
> Razorpay Route requires formal underwriting and approval from Razorpay Risk & Compliance. Until Route is activated on your live merchant account, SHOPIVO runs standard gateway capture and manages seller payouts via scheduled periodic bank settlement.

---

## 9. Live Mode Go-Live Activation Checklist

Before switching from TEST to LIVE mode:

- [ ] Complete full Company KYC on Razorpay Dashboard.
- [ ] Connect and verify business current bank account for automated payouts.
- [ ] Generate Live Mode API Keys (`rzp_live_...`).
- [ ] In Render backend environment:
  - Set `RAZORPAY_MODE=LIVE`
  - Set `RAZORPAY_KEY_ID=rzp_live_...`
  - Set `RAZORPAY_KEY_SECRET=<live_secret>`
  - Set `RAZORPAY_WEBHOOK_SECRET=<live_webhook_secret>`
- [ ] In Render frontend environment:
  - Set `VITE_RAZORPAY_KEY_ID=rzp_live_...`
- [ ] Configure live webhook URL on Razorpay Dashboard pointing to `https://<backend-domain>/api/payments/webhook/razorpay`.
- [ ] Execute a live ₹1 UPI transaction using Google Pay / PhonePe to confirm end-to-end capture.
- [ ] Test refunding the ₹1 transaction from SHOPIVO Admin Returns page to confirm refund reversal.

---

## 10. Security & Compliance Principles

1. **Zero Secret Exposure:** `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are never referenced in frontend code, git repositories, or terminal logs.
2. **Server-Side Price Authority:** The frontend never sends payable amounts. Amounts are always recalculated from server-side database records.
3. **Constant-Time Verification:** All signature verification uses `MessageDigest.isEqual` to prevent timing attacks.
4. **No Raw Card Storage:** SHOPIVO stores only `card_last4`, `gateway_method`, and provider references (`transaction_id`). Full PANs, CVVs, and banking passwords never enter or traverse SHOPIVO servers (PCI-DSS SAQ-A compliant).


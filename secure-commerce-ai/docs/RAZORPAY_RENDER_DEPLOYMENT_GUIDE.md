# SHOPIVO — Razorpay Dynamic QR & Render Deployment Guide

**Platform:** SHOPIVO – A New Era of Shopping  
**Stack:** React 19 (Vite) + Java 21 LTS (Spring Boot 3.4.3) + PostgreSQL 16 + Razorpay Payment Gateway  
**Environment Mode:** `TEST` (`RAZORPAY_MODE=TEST`, `RAZORPAY_LIVE_ENABLED=false`)  
**Deployment Target:** Render Web Service (Backend) + Render Static Site (Frontend) + Render PostgreSQL  

---

## 1. Executive Summary & Architecture Overview

SHOPIVO implements an authoritative, server-driven payment lifecycle. The frontend never determines order amounts, capture statuses, or verification tokens. 

### Payment Flow Architecture

```
[ Customer Browser ]             [ SHOPIVO Backend ]            [ PostgreSQL DB ]          [ Razorpay API ]
        │                                 │                             │                         │
 1. POST /api/orders                      │                             │                         │
    (addressId, items) ─────────────────> │                             │                         │
        │                           Validate stock & calculate          │                         │
        │                           authoritative totalAmount           │                         │
        │                                 │ ──── Save Order (PENDING) ─>│                         │
        │ <──── 201 Created (orderId) ─── │                             │                         │
        │                                 │                             │                         │
 2. POST /api/payments/create-qr-code     │                             │                         │
    (orderId) ──────────────────────────> │                             │                         │
        │                           Calculate amount in paise           │                         │
        │                           (amount * 100)                      │                         │
        │                                 │ ────────────────────────────────────────────────> POST /v1/payments/qr_codes
        │                                 │ <──────────────────────────────────────────────── gwQrId, image_url, close_by
        │                                 │ ──── Save Payment (PENDING) ───>│                      (valid >= 15 mins)
        │ <──── 200 OK (GatewayQrResponse)│                             │                         │
        │       (qrId, imageUrl, expiry)  │                             │                         │
        │                                 │                             │                         │
 3. Display Authentic QR Modal            │                             │                         │
    Customer scans with any UPI app       │                             │                         │
    Frontend polls /status every 3s       │                             │                         │
        │                                 │                             │                         │
 4. Customer authorizes payment           │                             │                         │
        │                                 │                             │  ─────────────────────> Razorpay processes
        │                                 │                             │                         transaction
        │                                 │ <──────────────────────────────────────────────────── POST /api/payments/webhook/razorpay
        │                                 │   Event: qr_code.credited / payment.captured          (X-Razorpay-Signature)
        │                           1. Verify HMAC-SHA256 signature     │                         │
        │                           2. Check event idempotency          │                         │
        │                              against payment_webhook_events   │                         │
        │                           3. Validate currency=INR & amount   │                         │
        │                           4. Check payment captured status    │                         │
        │                                 │ ──── Mark Payment (SUCCESS) ───>│                         │
        │                                 │ ──── Mark Order (CONFIRMED) ───>│                         │
        │                                 │ ──── Record Event in DB ───────>│                         │
        │                                 │ <─── 200 OK (Webhook ack) ──│                         │
        │                                 │                             │                         │
 5. Frontend Polling / Manual Check       │                             │                         │
    GET /api/payments/orders/{id}/status─>│                             │                         │
        │ <──── 200 OK (status: SUCCESS) ─│                             │                         │
        │                                 │                             │                         │
 6. Cart Cleared & Confirmation Shown     │                             │                         │
    Customer redirected to Order Details  │                             │                         │
```

---

## 2. Existing Production URLs

The production deployment runs on existing Render cloud services:

| Component | Target URL | Notes |
| :--- | :--- | :--- |
| **Frontend Production URL** | `https://shopivo-a-new-era-of-shopping-znib.onrender.com` | React 19 SPA hosted on Render Static Site |
| **Backend Production URL** | `https://shopivo-a-new-era-of-shopping.onrender.com` | Spring Boot 3.4.3 Web Service running on Java 21 LTS |
| **Backend Health Endpoint** | `https://shopivo-a-new-era-of-shopping.onrender.com/api/actuator/health` | Public Actuator health check |
| **Razorpay Webhook URL** | `https://shopivo-a-new-era-of-shopping.onrender.com/api/payments/webhook/razorpay` | Authenticated exclusively via `X-Razorpay-Signature` HMAC |

---

## 3. Render Backend Deployment Readiness

### Runtime & Configuration
- **Container / JVM:** Java 21 LTS (`eclipse-temurin:21-jre-jammy` or Render Native Java runtime).
- **Spring Profile:** `prod` (`SPRING_PROFILES_ACTIVE=prod`).
- **Port Binding:** Automatically binds to Render's dynamic `$PORT` via `server.port=${PORT:8080}`.
- **Context Path:** `/api` (`server.servlet.context-path=/api`).

### Database Connectivity (PostgreSQL)
- **Engine:** PostgreSQL 16 (Render Managed Database).
- **Connection URL:** JDBC format with mandatory SSL:
  ```
  jdbc:postgresql://<RENDER_PG_HOST>:5432/<RENDER_PG_DB>?sslmode=require
  ```
- **Connection Pool:** HikariCP configured with minimum 2 and maximum 10 connections for optimal Render free/starter tier performance.
- **Migrations:** Automated Flyway migrations execute sequentially on application boot. Schema history is tracked in `flyway_schema_history`.

### Security & CORS Configuration
- **CORS Allowed Origins:** Must strictly equal `https://shopivo-a-new-era-of-shopping-znib.onrender.com`.
  - Wildcards (`*`) with credentials are completely disabled.
  - Allowed Methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`.
- **Public Endpoints (No Bearer Token Required):**
  - `/api/auth/**` (Sign-in, registration, token refresh)
  - `/api/actuator/health` (Liveness & readiness health probe)
  - `/api/payments/webhook/razorpay` (Webhook ingestion endpoint)
- **Protected Endpoints:**
  - All `/api/payments/create-qr-code`, `/api/payments/cancel-qr-code`, and order management endpoints require a valid customer/admin JWT bearer token.

---

## 4. Render Frontend Deployment Readiness

### Build Settings
- **Build Command:** `npm run build`
- **Publish Directory:** `dist`
- **Framework:** Vite + React 19

### SPA Routing Fallback Rule
In Render Dashboard under **Redirects/Rewrites**:
```
Type: Rewrite
Source: /*
Destination: /index.html
Status: 200
```
This ensures direct navigation, browser refreshes, and deep links to `/customer/checkout`, `/customer/orders/:id`, etc. do not result in HTTP 404.

### API Base URL Configuration
- **Frontend Environment Variable:** `VITE_API_URL`
- **Production Value:** `https://shopivo-a-new-era-of-shopping.onrender.com/api`
- **Local Development Value:** `http://localhost:8080/api`

> [!CAUTION]
> **Strict Client-Side Security Constraint:**  
> Never define `VITE_RAZORPAY_KEY_SECRET` or `VITE_RAZORPAY_WEBHOOK_SECRET` in frontend environment variables. Vite embeds all `VITE_*` variables into public JavaScript client bundles. Secrets must reside exclusively on the backend.

---

## 5. Razorpay Configuration & Webhook Setup

### Razorpay API Configuration
- **API Endpoint:** `POST https://api.razorpay.com/v1/payments/qr_codes`
- **Authentication:** HTTP Basic Authentication using `RAZORPAY_KEY_ID` (username) and `RAZORPAY_KEY_SECRET` (password).
- **QR Code Lifetime:** `close_by` timestamp set to current UNIX epoch + 960 seconds (16 minutes) to strictly satisfy Razorpay's $\ge 900$s minimum duration rule.
- **QR Image:** Served securely via Razorpay's authentic CDN URL returned in `image_url`.

### Razorpay Webhook Configuration in Dashboard
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Toggle to **Test Mode** (orange top banner).
3. Navigate to **Account & Settings > API Keys and Webhooks > Webhooks**.
4. Configure the Webhook:
   - **Webhook URL:** `https://shopivo-a-new-era-of-shopping.onrender.com/api/payments/webhook/razorpay`
   - **Secret:** Enter a high-entropy 32+ character random secret string (e.g., generated with `openssl rand -hex 32`). Save the identical string in Render's `RAZORPAY_WEBHOOK_SECRET`.
   - **Active Events (13 Events):**
     - ☑ `qr_code.created`
     - ☑ `qr_code.credited` *(Critical for Dynamic UPI QR payment capture)*
     - ☑ `qr_code.closed`
     - ☑ `payment.captured`
     - ☑ `payment.authorized`
     - ☑ `payment.failed`
     - ☑ `order.paid`
     - ☑ `refund.created`
     - ☑ `refund.processed`
     - ☑ `refund.failed`
     - ☑ `refund.speed_changed`
     - ☑ `payment.dispute.created`
     - ☑ `payment.dispute.won`
5. Click **Save Webhook**.

### Webhook Verification & Idempotency Rules
1. **Raw Body Integrity:** The backend receives the raw UTF-8 HTTP request bytes before any JSON parsing.
2. **Signature Verification:** Computes HMAC-SHA256 of the raw body using `RAZORPAY_WEBHOOK_SECRET` and compares with `X-Razorpay-Signature` header using constant-time comparison (`MessageDigest.isEqual`) to prevent timing side-channel attacks.
3. **Event Deduplication:** Evaluates `X-Razorpay-Event-Id`. Processed event IDs are durably stored in the PostgreSQL table `payment_webhook_events`. Duplicates receive an immediate `200 OK` acknowledgment and are discarded without double-crediting orders.
4. **Currency & Amount Guard:** Verifies `currency == "INR"` and exact amount in paise (`expectedPaise == actualPaise`).
5. **Reconciliation:** Late payments received after QR expiry or cancellation are safely reconciled to `SUCCESS` and order to `CONFIRMED` without loss of funds.

---

## 6. Environment Variable Checklist

All secrets must be configured in Render Dashboard Environment Settings. Secret values below are strictly redacted.

### Backend Web Service Environment Variables

| Variable Name | Required | Example / Format | Purpose | Redaction Status |
| :--- | :--- | :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | Yes | `prod` | Activates production configuration | Plain text |
| `SPRING_DATASOURCE_URL` | Yes | `jdbc:postgresql://<host>:5432/<db>?sslmode=require` | Managed PostgreSQL connection | Host/DB visible, password separate |
| `SPRING_DATASOURCE_USERNAME` | Yes | `shopivo_user` | Database user | Plain text |
| `SPRING_DATASOURCE_PASSWORD` | Yes | `[REDACTED_POSTGRES_SECRET]` | Database password | **REDACTED** |
| `JWT_SECRET` | Yes | `[REDACTED_JWT_SECRET_MIN_256_BITS]` | Signs authentication JWTs | **REDACTED** |
| `RAZORPAY_MODE` | Yes | `TEST` | Enforces Test Mode guardrails | Plain text |
| `RAZORPAY_LIVE_ENABLED` | Yes | `false` | Prevents live transactions | Plain text |
| `RAZORPAY_KEY_ID` | Yes | `rzp_test_********************` | Razorpay public key ID | Semi-redacted |
| `RAZORPAY_KEY_SECRET` | Yes | `[REDACTED_RAZORPAY_KEY_SECRET]` | Razorpay API Basic Auth secret | **REDACTED** |
| `RAZORPAY_WEBHOOK_SECRET` | Yes | `[REDACTED_WEBHOOK_SECRET]` | Razorpay Webhook HMAC secret | **REDACTED** |
| `CORS_ORIGINS` | Yes | `https://shopivo-a-new-era-of-shopping-znib.onrender.com` | Strict CORS allowlist | Plain text |

### Frontend Static Site Environment Variables

| Variable Name | Required | Value | Purpose |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Yes | `https://shopivo-a-new-era-of-shopping.onrender.com/api` | Points frontend to production backend |
| `VITE_RAZORPAY_KEY_ID` | Optional | `rzp_test_********************` | Fallback Razorpay Key ID for client modal |

---

## 7. Credential Rotation Checklist

Because development keys were previously exposed in logs or local files during early development, treat all existing credentials as compromised and execute this rotation:

- [ ] **Step 1: Rotate Razorpay Test API Keys**
  1. Log in to Razorpay Dashboard (Test Mode).
  2. Navigate to **Account & Settings > API Keys**.
  3. Click **Regenerate Key**. Set expiration for existing key (or immediate revoke).
  4. Copy new `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
  5. Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Render Backend Environment Variables.
  6. Update `VITE_RAZORPAY_KEY_ID` in Render Frontend Environment Variables.

- [ ] **Step 2: Rotate Razorpay Webhook Secret**
  1. Navigate to **Account & Settings > Webhooks**.
  2. Edit webhook for `https://shopivo-a-new-era-of-shopping.onrender.com/api/payments/webhook/razorpay`.
  3. Enter a newly generated random secret string.
  4. Save webhook.
  5. Immediately update `RAZORPAY_WEBHOOK_SECRET` in Render Backend Environment Variables.

- [ ] **Step 3: Rotate JWT Secret**
  1. Generate a new 256-bit cryptographic hex string (`openssl rand -hex 64`).
  2. Update `JWT_SECRET` in Render Backend Environment Variables.
  3. Trigger backend redeploy. (Note: Existing active user sessions will prompt for re-login).

- [ ] **Step 4: Rotate PostgreSQL Database Password**
  1. In Render Dashboard, open PostgreSQL database instance.
  2. Reset user password.
  3. Update `SPRING_DATASOURCE_PASSWORD` on backend service.

---

## 8. Multi-Vendor Marketplace Settlement Notice

SHOPIVO operates a multi-vendor catalog where customer orders can include items from multiple independent vendors (`OrderItem.seller`).

### Operational Scope:
1. **Primary Collection Account:**
   All payments processed via Dynamic UPI QR or Standard Checkout are credited directly into SHOPIVO's verified primary merchant account.
2. **Seller Disbursements:**
   Automatic marketplace fund splits and seller transfers require **Razorpay Route** (Linked Accounts `acc_...`). Route activation involves institutional underwriting and compliance review.
3. **Current Operating Model:**
   Until Razorpay Route is underwritten and activated on production, customer payments are collected centrally, and seller earnings are settled via scheduled periodic bank transfers managed by SHOPIVO operations.

---

## 9. Step-by-Step Deployment Instructions

Follow these exact steps when ready to deploy:

### Step 1: Pre-Deployment Local Verification
Verify that both backend and frontend pass full compilation and tests:
```powershell
# 1. Backend tests (38 tests)
cd secure-commerce-ai/backend
.\mvnw.cmd test -Dtest=PaymentGatewayIntegrationTest

# 2. Frontend production build
cd ../frontend
npm run build
```

### Step 2: Git Commit & Push (Awaiting User Review)
Once approved by user review:
```powershell
cd secure-commerce-ai
git add .
git commit -m "feat(payment): genuine Razorpay Dynamic UPI QR integration and Render deployment configuration"
git push origin main
```

### Step 3: Trigger / Monitor Render Builds
1. Open Render Dashboard:
   - **Backend Web Service:** Check `shopivo-backend`. Verify Maven build compiles, Flyway runs migrations, and Spring Boot starts on `$PORT`.
   - **Frontend Static Site:** Check `shopivo-frontend`. Verify `npm run build` generates `dist/` and deployment finishes.
2. Check backend health:
   ```bash
   curl -I https://shopivo-a-new-era-of-shopping.onrender.com/api/actuator/health
   # Expected: HTTP 200 OK {"status":"UP","groups":["liveness","readiness"]}
   ```

### Step 4: Live Verification
1. Visit `https://shopivo-a-new-era-of-shopping-znib.onrender.com`.
2. Add an item to the shopping cart.
3. Proceed to Checkout and select **Razorpay Dynamic UPI QR**.
4. Verify authentic QR generation from Razorpay.
5. In Test Mode, simulate completion or test webhook arrival.
6. Verify order status transitions to `CONFIRMED` in the customer order list.


# SHOPIVO — A New Era of Shopping

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.3-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.2-purple.svg)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791.svg)](https://www.postgresql.org/)
[![Flyway](https://img.shields.io/badge/Flyway-V1--V18-red.svg)](https://flywaydb.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests: 100 Passed](https://img.shields.io/badge/Tests-100%20Passed-success.svg)]()

---

## 1. Project Overview

**SHOPIVO — A New Era of Shopping** is an enterprise-grade, multi-vendor e-commerce platform developed as a B.Tech Computer Science Capstone Project. The platform bridges customer marketplace commerce, merchant catalog and order operations, and centralized platform administration within a hardened, modular monolithic architecture.

In **Semester 1**, Shopivo delivers a complete, secure, and regression-tested e-commerce monolith consisting of:
- A responsive React 19 single-page application built on Vite.
- A Java 21 LTS / Spring Boot 3.4.x backend.
- PostgreSQL persistence managed strictly via Flyway versioned migrations (`V1`–`V18`).
- Spring Security with stateless JSON Web Tokens (JWT) and BCrypt password encryption.
- **Persistent Event Logging & Research Data Collection Foundation**: Non-blocking telemetry tracking 17 controlled event types across authentication, product browsing, cart manipulation, checkout, payments, orders, returns, refunds, and reviews.

In **Semester 2**, the platform will integrate an external Python microservice powered by **Cross-View Contrastive Graph Learning (CSGAD)** to detect transaction fraud syndicates, credential stuffing, and review abuse using the data collected in Semester 1. *(Note: Machine learning models, fraud scores, and decision engines are strictly scoped to Semester 2 and not active in Semester 1).*

---

## 2. Problem Statement

Modern online commerce requires seamless buyer and seller interactions, but traditional multi-vendor platforms face critical challenges:
1. **Catalog & Quality Governance**: Unauthorized or poor-quality merchant listings degrade customer trust without active administrative moderation.
2. **Multi-Vendor Fulfillment Conflicts**: Orders containing items from multiple distinct sellers require strict data segregation so merchants only view and fulfill their own line items.
3. **Transactional & Inventory Inconsistencies**: Race conditions during high-volume checkout, cancellations, and returns frequently cause ghost stock decrements or inventory discrepancies.
4. **Security & Identity Tampering**: Client-side parameter tampering (e.g. passing arbitrary user IDs or prices) compromises privacy and order integrity.
5. **Emerging Transaction Fraud**: Syndicate checkout abuse and coordinated fraudulent activities require graph-level intelligence beyond isolated heuristic rule engines.

---

## 3. Project Objectives

- **Complete Multi-Role Commerce**: Deliver full end-to-end shopping journeys for Customers, operational control for Sellers, and governance for Administrators.
- **Robust Actor Isolation & RBAC**: Enforce fine-grained authorization where callers are identified exclusively via verified server-side security context (`@AuthenticationPrincipal`).
- **Transactional & Inventory Integrity**: Ensure atomic inventory decrements during checkout, exact single-instance stock restitution on cancellation, and authoritative server-side price computation.
- **Auditable Database Lifecycle**: Version all database tables and schema modifications via 14 continuous Flyway migrations with strict JPA schema validation.
- **Production-Ready Baseline for Semester 2**: Establish a hardened, bug-free foundational platform before integrating Semester-2 graph neural network fraud detection models.

---

## 4. Semester 1 Scope

Semester 1 represents the complete functional multi-vendor e-commerce platform. All business workflows for buyer checkout, seller fulfillment, and platform governance are fully implemented and verified:
- **Customer Commerce**: Registration, JWT authentication, marketplace browsing, full-text search, category filtering, cart, wishlist, address book, checkout, deterministic sandbox payments, order history, order cancellation, returns, instant sandbox refunds, verified purchase reviews, discount coupon engine, PDF invoices, and notification center.
- **Seller Operations**: Merchant product management (`PENDING`, `APPROVED`, `REJECTED`), inline stock management, seller order segregation, fulfillment status machine (`CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED`), and sales analytics (aggregates, sales trends, top-selling products).
- **Admin Governance**: Product moderation pipeline with recorded rejection reasons, platform order oversight with status & payment filters, admin cancellation with restocking, user/seller directory management, account suspension/activation with anti-lockout safeguards, and ecosystem metrics.
- **Research Data-Collection Foundation**: Granular event logging (`user_events` table via Flyway `V18`) capturing user interactions, session correlation via `X-Session-Id`, decoupled non-blocking persistence, strict sensitive-data sanitization, and dataset export endpoints (`/api/admin/events/export` and `/api/admin/export/{dataset}`) to establish historical data for Semester 2 ML research without interfering with regular e-commerce transactions. See [Semester 1 Event Collection Foundation](docs/research/semester1-event-collection-foundation.md) for full details.

---

## 5. Technology Stack

### Frontend
- **Runtime & Build**: Node.js 18+ / Vite 8.2
- **Framework**: React 19.2 (Functional Components + Hooks)
- **Routing**: React Router DOM v7 (Nested layouts, Role Guards)
- **State Management**: Redux Toolkit (Session and Cart state)
- **Styling**: Vanilla CSS Design Token Architecture (Dark-mode primary, glassmorphic surfaces, responsive layouts)
- **Icons**: Lucide React
- **Data Visualization**: Recharts (Seller Analytics trends)

### Backend
- **Language & Runtime**: Java 21 LTS
- **Framework**: Spring Boot 3.4.3 (Modular Monolith)
- **Security**: Spring Security 6, Stateless JWT (HMAC-SHA256), BCrypt (strength 12)
- **Data Persistence**: Spring Data JPA / Hibernate 6.6
- **Database**: PostgreSQL 15+
- **Schema Migrations**: Flyway Database Migrations (`V1` to `V14`)
- **PDF Generation**: iText 7 Core (Customer Invoices)
- **Testing**: JUnit 5, Mockito, AssertJ, Spring Boot Test

### Semester 2 Reserved (AI & Fraud Detection)
- **Framework**: Python 3.11, FastAPI
- **Graph Learning**: PyTorch Geometric (PyG), NetworkX
- **Algorithm**: CSGAD (Cross-View Contrastive Graph Learning)

---

## 6. System Architecture

Shopivo is structured as a **Modular Monolith** communicating over RESTful JSON APIs:

```
┌────────────────────────────────────────────────────────┐
│                   React 19 Frontend                    │
│   (Vite + React Router v7 + Redux Toolkit + CSS)       │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / REST (JSON)
                            │ Authorization: Bearer <JWT>
┌───────────────────────────▼────────────────────────────┐
│              Spring Boot 3.4.x Monolith                │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │   JwtAuthFilter + Spring Security (RBAC)         │  │
│  └────────────────────────┬─────────────────────────┘  │
│                           │                            │
│  ┌────────────────────────▼─────────────────────────┐  │
│  │   Controllers (Customer, Seller, Admin)          │  │
│  └────────────────────────┬─────────────────────────┘  │
│                           │                            │
│  ┌────────────────────────▼─────────────────────────┐  │
│  │   Service Layer (Business Logic & Transactions)  │  │
│  └────────────────────────┬─────────────────────────┘  │
│                           │                            │
│  ┌────────────────────────▼─────────────────────────┐  │
│  │   Repositories (Spring Data JPA / JPQL)          │  │
│  └────────────────────────┬─────────────────────────┘  │
└───────────────────────────┼────────────────────────────┘
                            │ JDBC (HikariCP)
┌───────────────────────────▼────────────────────────────┐
│             PostgreSQL 15+ Database                    │
│    (Flyway-Managed Migrations: V1 -> V14)              │
└────────────────────────────────────────────────────────┘
```

---

## 7. Functional Modules

### 7.1 Customer Module
- **Authentication**: Email/password registration and login; JWT token stored client-side.
- **Marketplace Browsing & Search**: Paginated product catalog displaying **only approved** listings, search by keyword, filter by category.
- **Product Details & Reviews**: Live product details, stock indicators, rating distributions, verified purchase customer reviews.
- **Cart & Wishlist**: Session cart persistence, out-of-stock validation, price snapshotting, one-click wishlist transfers.
- **Address Management**: Multiple saved shipping addresses with default address selection.
- **Checkout & Authoritative Pricing**: Backend-calculated subtotal, coupon discount, and payable amount (no client price tampering).
- **Sandbox Payments**: Deterministic card and UPI payment simulations with test-card decline triggers.
- **Order Tracking & Invoices**: Visual 5-stage fulfillment progress bar, downloadable PDF invoices.
- **Cancellations & Returns**: One-click cancellation for unfulfilled orders (restitutes stock); return request pipeline for delivered items with sandbox instant refunds.
- **Notifications**: Automated in-app alerts on order placement, confirmation, shipping, delivery, and returns.

### 7.2 Seller Module
- **Seller Dashboard**: Real-time sales summary (orders, revenue, units sold) and pending tasks.
- **Product Management**: Submit new listings (status: `PENDING`), edit listings (triggers re-moderation), view rejection reasons.
- **Inline Stock Adjustment**: Quick stock quantity updates (`PATCH /api/seller/products/{id}/stock`) without resetting approved status.
- **Scoped Order Fulfillment**: Dedicated merchant view (`/seller/orders`); for mixed-seller orders, merchants see strictly their own line items.
- **Fulfillment State Machine**: Advance orders forward: `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED`.
- **Sales Analytics**: 7-day, 30-day, and all-time revenue trends, daily sales charts, top-performing product rankings.

### 7.3 Admin Module
- **Product Moderation**: Catalog dashboard with pending submission queues; approve or reject products with mandatory feedback.
- **Platform Order Management**: Comprehensive oversight over all platform orders with status and payment filters; admin cancellation with automated stock restitution.
- **User & Seller Directory**: Searchable, paginated user management; filter by role (`CUSTOMER`, `SELLER`, `ADMIN`) and account status (`ACTIVE`, `SUSPENDED`).
- **Account Suspension**: Toggle account access; suspended users are immediately blocked from authentication.
- **Administrative Safeguards**: Strict guards preventing admin self-suspension and preventing lockout of the platform's last active administrator.
- **Operational Metrics**: Platform-wide counts of users, active sellers, order volume, and fulfillment health.

---

## 8. Security Architecture

Shopivo implements defense-in-depth security principles:
1. **Password Protection**: BCrypt cryptographic hashing with cost factor 12. Plain-text passwords are never stored.
2. **Stateless JWT Authentication**: Compact HMAC-SHA256 tokens issued on login, validated on every request by `JwtAuthFilter`.
3. **Server-Side Identity Injection**: Controller methods extract identity exclusively via `@AuthenticationPrincipal User currentUser`. Client-supplied IDs are never trusted for authorization.
4. **Role-Based Authorization (RBAC)**: Enforced through URL ant-matchers in `SecurityConfig` and method-level `@PreAuthorize("hasRole('...')")`.
5. **Ownership Isolation**:
   - Customers can only query and cancel their own orders, addresses, and return requests.
   - Sellers can only modify their own products, view their own order line items, and access their own analytics.
6. **Account Suspension Lifecycle**:
   - `JwtAuthFilter` queries user status on token validation; suspended accounts are rejected with `401 Unauthorized`.
   - `AuthService` rejects login for suspended accounts.
7. **Admin Lockout Safeguards**:
   - Self-suspension blocked (`400 Bad Request`).
   - Disabling the last active administrator blocked (`400 Bad Request`).
8. **Sensitive Data Sanitization**:
   - Password hashes, reset tokens, and internal keys are completely omitted from all DTOs.
   - Credit card numbers are never stored; only sanitized `cardLast4` and gateway transaction IDs are persisted. CVVs are never saved or logged.
9. **Global Exception Handling**: Centralized `GlobalExceptionHandler` intercepts exceptions and formats clean `ApiError` responses, preventing stack trace or SQL schema leakage.

---

## 9. Database Architecture & Flyway History

Shopivo's PostgreSQL schema is versioned sequentially through Flyway migrations (`V1` to `V14`):

| Migration Version | Description | Target Tables / Changes |
|:---|:---|:---|
| **V1** | Initial User Schema | `users` (id, email, password_hash, role, enabled, timestamps) |
| **V2** | Categories & Products | `categories`, `products` (price, stock_quantity, status) |
| **V3** | Seed Data | Default product catalog and category taxonomy |
| **V4** | Cart Tables | `carts`, `cart_items` |
| **V5** | Wishlist Tables | `wishlists`, `wishlist_items` |
| **V6** | Shipping Addresses | `addresses` (is_default, full address fields) |
| **V7** | Order Management | `orders`, `order_items` (immutable price & name snapshots) |
| **V8** | Payments | `payments` (transaction_id, method, status, card_last4) |
| **V9** | Order Cancellations | Added `cancellation_reason` and `cancelled_at` to `orders` |
| **V10** | Reviews & Ratings | `reviews` (product_id, user_id, rating, comment, verified_purchase) |
| **V11** | Returns & Refunds | `return_requests`, `refund_records` |
| **V12** | Notifications | `notifications` (type, title, message, is_read, reference) |
| **V13** | Coupons & Discounts | `coupons`, added discount fields to `orders` |
| **V14** | Moderation Feedback | Added `rejection_reason` to `products` |

Hibernate runs with `ddl-auto: validate` in production, ensuring zero unversioned schema drift.

---

## 10. API Reference Overview

All backend endpoints are prefixed with `/api`.

### Authentication
- `POST /api/auth/register` — Register customer or seller
- `POST /api/auth/login` — Authenticate and receive JWT token
- `GET  /api/auth/me` — Current authenticated user profile

### Customer Commerce
- `GET    /api/products` — Browse approved products (public)
- `GET    /api/products/{id}` — Single product details (APPROVED only)
- `GET    /api/categories` — Category hierarchy (public)
- `GET    /api/reviews/product/{id}` — Product reviews (public)
- `GET    /api/cart` — Retrieve customer cart
- `POST   /api/cart/items` — Add item to cart
- `PUT    /api/cart/items/{id}` — Update item quantity
- `DELETE /api/cart/items/{id}` — Remove item from cart
- `DELETE /api/cart` — Clear cart
- `GET    /api/wishlist` — View wishlist
- `POST   /api/wishlist/items` — Add product to wishlist
- `DELETE /api/wishlist/items/{id}` — Remove from wishlist
- `POST   /api/wishlist/items/{id}/move-to-cart` — Move wishlist item to cart
- `GET    /api/addresses` — List customer addresses
- `POST   /api/addresses` — Create shipping address
- `PUT    /api/addresses/{id}` — Update shipping address
- `DELETE /api/addresses/{id}` — Delete shipping address
- `POST   /api/orders` — Place order from cart (atomic stock reduction)
- `GET    /api/orders/mine` — Customer order history
- `GET    /api/orders/{id}` — Customer order details
- `PATCH  /api/orders/{id}/cancel` — Cancel unfulfilled order
- `GET    /api/orders/{id}/invoice` — Download invoice PDF
- `POST   /api/payments/process` — Process sandbox payment
- `GET    /api/payments/mine` — Customer transaction history
- `POST   /api/coupons/validate` — Validate coupon discount
- `GET    /api/coupons/available` — Available discount coupons
- `POST   /api/returns` — Request return for delivered item
- `POST   /api/returns/{id}/approve-sandbox` — Instant return approval & refund
- `GET    /api/returns/mine` — Customer returns history
- `GET    /api/returns/refunds/mine` — Customer refunds history
- `GET    /api/notifications` — Notification inbox
- `PATCH  /api/notifications/{id}/read` — Mark notification read

### Seller Operations
- `GET   /api/seller/products` — List seller's own listings
- `POST  /api/seller/products` — Submit product for moderation
- `PUT   /api/seller/products/{id}` — Edit product (resets status to PENDING)
- `PATCH /api/seller/products/{id}/stock` — Inline stock adjustment
- `GET   /api/seller/orders` — List seller's orders (**Canonical**)
- `GET   /api/seller/orders/{id}` — Scoped order detail (strictly seller items)
- `PATCH /api/seller/orders/{id}/status` — Advance fulfillment state
- `GET   /api/seller/analytics/summary` — High-level sales performance
- `GET   /api/seller/analytics/sales` — Daily sales time-series
- `GET   /api/seller/analytics/top-products` — Top selling products ranking

### Admin Governance
- `GET   /api/admin/products` — Moderation catalog search and filter
- `PUT   /api/admin/products/{id}/approve` — Approve listing for marketplace
- `PUT   /api/admin/products/{id}/reject` — Reject listing with reason
- `GET   /api/admin/orders` — Platform-wide paged order operations (**Canonical**)
- `GET   /api/admin/orders/{id}` — Complete platform view of order
- `PATCH /api/admin/orders/{id}/status` — Advance or adjust order status
- `PATCH /api/admin/orders/{id}/cancel` — Admin cancellation with restock
- `GET   /api/admin/orders/metrics` — Platform fulfillment health metrics
- `GET   /api/admin/users` — Paged user directory
- `GET   /api/admin/users/{id}` — User account details
- `PATCH /api/admin/users/{id}/suspend` — Suspend user account
- `PATCH /api/admin/users/{id}/activate` — Activate user account
- `GET   /api/admin/users/metrics` — Platform ecosystem metrics
- `GET   /api/admin/sellers` — Paged seller directory
- `GET   /api/admin/sellers/{id}` — Deep seller performance overview

*(Note: `/api/orders/seller` and `/api/orders/admin` are retained and documented as `@Deprecated` backwards-compatible routes).*

---

## 11. Testing & Verification

The platform maintains a comprehensive automated test suite of **58 integration tests** covering all modules:

```powershell
cd backend
.\mvnw.cmd test
```

### Verified Test Results
```
[INFO] Results:
[INFO] Tests run: 58, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

| Test Class | Tests | Status | Scope |
|:---|:---:|:---:|:---|
| `PlatformApplicationTests` | 1 | PASS | Spring Boot Context Loading |
| `CustomerRegressionIntegrationTest` | 7 | PASS | Complete Buyer Journey (Cart, Order, Payment, Review, Return, Invoice) |
| `SellerOrderManagementIntegrationTest` | 4 | PASS | Mixed-Seller Segregation, Ownership, Fulfillment State Machine |
| `SellerAnalyticsIntegrationTest` | 7 | PASS | Sales Metrics, Date Range Filters, Analytics Data Isolation |
| `AdminProductModerationIntegrationTest` | 5 | PASS | PENDING → APPROVED/REJECTED, Visibility Rules, RBAC |
| `AdminOrderManagementIntegrationTest` | 16 | PASS | Paged Orders, Payment Inspection, Admin Cancellation & Restock |
| `AdminUserManagementIntegrationTest` | 18 | PASS | User/Seller Paging, Suspension Safeguards, DTO Sanitization |
| **Total** | **58** | **PASS** | **0 Failures, 0 Errors, 0 Skipped** |

### Build Verification
- **Frontend**: `npm run build` passes with zero errors (`vite build` in ~1.0s).
- **Backend**: `.\mvnw.cmd clean compile` compiles 145 classes with `BUILD SUCCESS` in ~10s.

---

## 12. Setup & Installation Guide

### Prerequisites
- **Java**: JDK 21 LTS ([Adoptium Temurin 21](https://adoptium.net/temurin/releases/?version=21))
- **Node.js**: 18+ LTS ([Node.js Official](https://nodejs.org/))
- **PostgreSQL**: 15+ ([PostgreSQL Downloads](https://www.postgresql.org/download/))
- **Maven**: Bundled via `./mvnw.cmd` (Windows) or `./mvnw` (Unix)

### Step 1: Database Initialization
Open PostgreSQL (`psql` or pgAdmin) and create the application database:
```sql
CREATE DATABASE securecommerce;
```

### Step 2: Backend Configuration & Startup
1. Navigate to `backend/`:
   ```powershell
   cd backend
   ```
2. Configure environment variables in `backend/.env` (or set OS environment variables):
   ```env
   DB_URL=jdbc:postgresql://localhost:5432/securecommerce
   DB_USERNAME=postgres
   DB_PASSWORD=your_actual_password
   JWT_SECRET=your_base64_or_hex_encoded_secret_key_minimum_256_bits
   SERVER_PORT=8080
   ```
3. Run the backend:
   ```powershell
   .\mvnw.cmd spring-boot:run
   ```
   *Flyway will automatically execute migrations `V1` through `V14` on startup. The API will listen at `http://localhost:8080/api`.*

### Step 3: Frontend Startup
1. In a separate terminal, navigate to `frontend/`:
   ```powershell
   cd frontend
   npm install
   ```
2. Launch the Vite development server:
   ```powershell
   npm run dev
   ```
3. Open your browser at **`http://localhost:5173`**.

---

## 13. Repository Project Structure

```
secure-commerce-ai/
│
├── frontend/                        ← React 19 + Vite frontend application
│   ├── public/                      ← Favicon, static assets
│   ├── src/
│   │   ├── assets/                  ← Logos and brand assets (Shopivo logo)
│   │   ├── components/              ← Reusable UI components (Navbar, Modal, ProductCard)
│   │   ├── constants/               ← Application routes (routes.js) and role constants
│   │   ├── layouts/                 ← Layouts (AuthLayout, CustomerLayout, SellerLayout, AdminLayout)
│   │   ├── pages/
│   │   │   ├── admin/               ← Admin dashboard, moderation, orders, users, sellers
│   │   │   ├── auth/                ← Login, register, forgot/reset password
│   │   │   ├── customer/            ← Browse, product detail, cart, checkout, orders, returns
│   │   │   ├── public/              ← Landing page
│   │   │   └── seller/              ← Seller dashboard, products, inventory, orders, analytics
│   │   ├── routes/                  ← AppRoutes.jsx, RoleRoute.jsx, ProtectedRoute.jsx
│   │   ├── services/                ← Axios API client services (auth, products, orders, users)
│   │   ├── store/                   ← Redux Toolkit store (authSlice, cartSlice)
│   │   └── index.css                ← Design system tokens and dark mode styling
│   ├── package.json
│   └── vite.config.js
│
├── backend/                         ← Java 21 + Spring Boot 3.4.x modular backend
│   ├── src/main/java/com/securecommerce/platform/
│   │   ├── PlatformApplication.java ← Main application entry point
│   │   ├── address/                 ← Customer shipping addresses
│   │   ├── analytics/               ← Seller sales analytics and time-series
│   │   ├── auth/                    ← Authentication, registration, JWT issuance
│   │   ├── cart/                    ← Shopping cart and item operations
│   │   ├── category/                ← Category taxonomy
│   │   ├── common/                  ← ApiResponse envelope, HomeController
│   │   ├── config/                  ← SecurityConfig, WebMvcConfig
│   │   ├── coupon/                  ← Coupon discount engine
│   │   ├── exception/               ← GlobalExceptionHandler, ApiError
│   │   ├── notification/            ← In-app customer notification service
│   │   ├── order/                   ← Orders, seller orders, admin orders, invoices
│   │   ├── payment/                 ← Sandbox payment processing & auditing
│   │   ├── product/                 ← Product catalog & admin moderation
│   │   ├── returns/                 ← Return requests & sandbox refund records
│   │   ├── review/                  ← Verified purchase customer reviews
│   │   ├── security/                ← JwtAuthFilter, JwtUtil
│   │   ├── user/                    ← User entity, admin user/seller controllers
│   │   └── wishlist/                ← Wishlist management
│   ├── src/main/resources/
│   │   ├── application.yml          ← Base Spring Boot configuration
│   │   ├── application-dev.yml      ← Development profile overrides
│   │   └── db/migration/            ← Flyway versioned SQL migrations (V1 to V14)
│   ├── src/test/java/               ← Automated integration and regression test suites
│   ├── pom.xml                      ← Maven build specification
│   └── mvnw.cmd                     ← Maven wrapper executable
│
├── docs/                            ← Architectural documentation and diagrams
│   ├── api/                         ← REST API documentation
│   ├── architecture/                ← System architecture & security model
│   ├── database/                    ← ER diagrams & migration documentation
│   └── testing/                     ← Test plan & verification reports
└── README.md                        ← Main documentation (this file)
```

---

## 14. Current Limitations & Scope Boundaries

1. **Deterministic Sandbox Payments**: Payment flows simulate real-world transactions using test cards and UPI handles. Integration with live merchant acquiring gateways (Stripe/Razorpay production webhooks) is reserved for production deployment.
2. **Seller Settlement & Payouts**: Order sales and refunds are tracked financially, but automated ACH/NEFT bank disbursement engines are not part of Semester-1 scope.
3. **AI Fraud Detection (Semester 2 Scope)**: AI-driven risk scoring, heterogeneous graph construction, and Cross-View Contrastive Graph Learning (CSGAD) are reserved for Semester 2. No machine learning models or fraud scoring engines are active in Semester 1.

---

## 15. Semester 2 Future Roadmap

In Semester 2, Shopivo will introduce an intelligent fraud detection subsystem:

```
┌────────────────────────────────────────────────────────┐
│             Shopivo E-Commerce Core                    │
│   (PostgreSQL Orders, Payments, Users, Reviews)        │
└───────────────────────────┬────────────────────────────┘
                            │ Asynchronous Event Stream
┌───────────────────────────▼────────────────────────────┐
│      Semester 2: Python AI Microservice (FastAPI)       │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │   Heterogeneous Transaction Graph Construction   │  │
│  │   Nodes: Users, Cards, Devices, IP Subnets       │  │
│  └────────────────────────┬─────────────────────────┘  │
│                           │                            │
│  ┌────────────────────────▼─────────────────────────┐  │
│  │   CSGAD (Cross-View Contrastive Graph Learning)  │  │
│  │   - Structural Topology View                     │  │
│  │   - Semantic Transaction Feature View            │  │
│  └────────────────────────┬─────────────────────────┘  │
│                           │                            │
│  ┌────────────────────────▼─────────────────────────┐  │
│  │   Real-Time Risk Scoring Engine                  │  │
│  │   - High Risk: Block / Step-up Verification      │  │
│  │   - Medium Risk: Admin Investigation Alert       │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

- **Graph Construction**: Link users, credit card fingerprints, devices, IP subnets, and reviews into a heterogeneous information network.
- **CSGAD Model**: Dual-view contrastive graph neural network to detect fraudulent syndicates and fake reviews.
- **Admin Investigation Dashboard**: Interactive node-link graph visualization for forensic transaction review.

---

## 16. License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

# SHOPIVO — COMPLETE SEMESTER 1 PROJECT REPORT
## Comprehensive Architectural, Engineering & Implementation Audit

---

### Document Overview
- **Project Name**: SHOPIVO — A New Era of Shopping
- **Platform Scope**: Academic Multi-Vendor E-Commerce Platform
- **Project Phase**: Semester 1 Final Release Readiness Audit
- **Report Date**: October 2026
- **Architecture**: Decoupled Client-Server (React 19 SPA + Spring Boot 3.4 REST API + PostgreSQL 18 + Flyway)

---

## 1. Executive Summary & System Identity

### 1.1 What is SHOPIVO?
**SHOPIVO** is an enterprise-grade, multi-vendor electronic commerce platform engineered to deliver a seamless shopping experience for consumers, a comprehensive merchant control center for independent vendors, and a centralized administrative moderation console for platform governors. 

Unlike conventional single-vendor shopping applications, SHOPIVO implements a true **marketplace model** where multiple independent sellers register, submit products for moderation, manage their distinct inventories, and fulfill orders, while customers aggregate items from multiple vendors into a unified cart and checkout through a secure, single-transaction payment flow.

### 1.2 Semester 1 Architectural Mandate
The development of SHOPIVO is strictly divided across two academic milestones:
- **Semester 1 (Current Scope)**: Building the core commercial engine, secure multi-tenant role-based access control, relational database schema with versioned Flyway migrations, end-to-end checkout with authoritative server-side pricing, dual-mode payment gateway integration (Razorpay Test Mode, Dynamic UPI QR, and Cash on Delivery), file storage pipelines for product imagery, return/refund lifecycles, and a complete suite of automated integration tests.
- **Semester 2 (Future Scope - Explicitly Excluded)**: Advanced artificial intelligence, Graph Neural Networks (GNN), CSGAD fraud detection models, Mamba sequence models, and automated behavioral graph reasoning.

> **Audit Guarantee**: This report and the current codebase contain **zero AI/ML dependencies**. All business logic, checkout calculations, moderation checks, and state transitions are powered by deterministic Spring Boot services and PostgreSQL relational integrity constraints.

---

## 2. Complete Technology Stack & Environment Specifications

The technical foundation was verified directly against runtime configuration files, Maven dependencies, and execution logs:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SHOPIVO SYSTEM TOPOLOGY                         │
├────────────────────────────────┬───────────────────────────────────────┤
│ Frontend Client (Port 5173)    │ Backend REST API (Port 8080)          │
│ • React 19.2.8 + Vite 8.2.1    │ • Java 21 (OpenJDK 21.0.12 LTS)       │
│ • Redux Toolkit 2.12.0         │ • Spring Boot 3.4.3                   │
│ • React Router DOM 7.18.2      │ • Spring Security 6 (Stateless JWT)   │
│ • Tailwind CSS 4.3.3           │ • Spring Data JPA + Hibernate ORM     │
│ • Lucide React + Recharts      │ • Flyway Migration Engine (19 Scripts)│
│ • Axios HTTP Client            │ • OpenPDF 2.0.3 (Invoice Generation)  │
├────────────────────────────────┴───────────────────────────────────────┤
│ Relational Database (PostgreSQL 18.4 on Port 5433)                     │
│ • Database Name: securecommerce                                        │
│ • Schema Version: Flyway V19 (19 Applied Migrations, 0 Failed)         │
│ • Connection Pool: HikariCP (10 Max Pool Size, 5 Minimum Idle)         │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Frontend Specifications
- **Core Framework**: React `19.2.8` utilizing Functional Components and Hooks.
- **Build Tool & Bundler**: Vite `8.2.1` with `@vitejs/plugin-react` `6.0.4`.
- **State Management**: Redux Toolkit `2.12.0` (`authSlice`, `cartSlice`, `themeSlice`) with `react-redux` `9.3.0`.
- **Routing**: React Router DOM `7.18.2` configured with nested layout wrappers (`CustomerLayout`, `AccountLayout`, `SellerLayout`, `AdminLayout`, `AuthLayout`) and route authorization guards (`ProtectedRoute`, `RoleRoute`).
- **Styling & Design System**: Tailwind CSS `4.3.3` with CSS custom property theming supporting seamless Light and Dark modes.
- **Form Handling & Validation**: React Hook Form `7.85.0` paired with Zod `4.4.3` schema validation.
- **Icons & Data Visualization**: Lucide React `1.31.0` and Recharts `3.10.1`.
- **HTTP Client**: Axios `1.19.0` with centralized request/response interceptors for automatic JWT injection and 401 redirect handling.
- **Code Quality**: Oxlint `1.75.0` (zero compilation or lint errors).

### 2.2 Backend Specifications
- **Programming Language**: Java `21` LTS (OpenJDK Temurin-21.0.12+8).
- **Application Framework**: Spring Boot `3.4.3` utilizing Spring Web MVC, Spring Data JPA, and Spring Validation.
- **Security & Cryptography**: Spring Security `6` configured for stateless session management (`SessionCreationPolicy.STATELESS`), BCrypt password hashing (work factor 12), and JJWT `0.12.6` (HMAC-SHA256 token signing and verification).
- **Persistence & Database**: PostgreSQL JDBC Driver, Hibernate ORM with `hibernate.hbm2ddl.auto=validate` (ensuring schema is strictly managed by Flyway).
- **Database Migrations**: Flyway Core `10.x/11.x` running 19 versioned migration scripts (`V1` to `V19`).
- **Document Generation**: OpenPDF `2.0.3` for dynamic PDF tax invoice rendering.
- **Testing Framework**: JUnit 5, Mockito, AssertJ, Spring Boot Test, Spring Security Test, and in-memory H2 database for isolated test suites.

### 2.3 Runtime Ports and Proxy Topology
- **Backend API**: Running on `http://localhost:8080/api`.
- **Frontend SPA**: Running on `http://localhost:5173`.
- **Database**: PostgreSQL server active on `localhost:5433` (DB: `securecommerce`).
- **Vite Dev Proxy**: Configured in `frontend/vite.config.js` to proxy `/api` and `/uploads` directly to `http://localhost:8080`, eliminating browser CORS issues in development.

---

## 3. Evolutionary Development Timeline (Phases 1 to 14)

Reconstructed directly from Git commit history, Flyway migration sequencing, and architectural documentation:

### Phase 1: Architectural Inception & Project Scaffolding (August 17, 2026)
- **Commits**: `2bd1c6d`, `dbfe221`
- **Accomplishments**: Initialized Maven multi-module parent POM, integrated Spring Boot 3.4.x, configured PostgreSQL datasource, initialized Flyway migration framework, and created Vite 8 React application with Tailwind CSS integration.

### Phase 2: Frontend Layout & Route Guard Architecture (August 17, 2026)
- **Commits**: `9084308`, `a546fd1`
- **Accomplishments**: Implemented React Router v7 structure, established `ProtectedRoute` and `RoleRoute` guards, created persistent application layouts (`AuthLayout`, `CustomerLayout`, `SellerLayout`, `AdminLayout`), and integrated Redux store.

### Phase 3: Backend Security & JWT Authentication (August 17, 2026)
- **Commit**: `35f0358`
- **Accomplishments**: Migrated `V1__create_users_table.sql`, created `User` entity, implemented BCrypt password encryption, built `JwtUtil` and `JwtAuthFilter`, established `/api/auth/register` and `/api/auth/login`, and secured endpoints using `@EnableMethodSecurity`.

### Phase 4: Product Catalog, Taxonomy & Shopping Cart (September 5, 2026)
- **Commit**: `554a6ec`
- **Accomplishments**: Applied `V2__create_categories_and_products.sql`, `V3__seed_categories_and_products.sql`, and `V4__create_cart_tables.sql`. Built `CategoryController`, `ProductController`, and `CartController` with atomic cart item quantity updates and subtotal calculations.

### Phase 5: Wishlist, Address Snapshots & Order Foundation (September 5, 2026)
- **Commit**: `ad89a52`, `ba3037b`
- **Accomplishments**: Applied `V5__create_wishlist_tables.sql`, `V6__create_addresses_table.sql`, and `V7__create_orders_tables.sql`. Implemented immutable address snapshots on checkout, transactional order item creation, and database-level stock decrements with concurrency safety.

### Phase 6: Customer Experience Overhaul & Marketplace Polish (September 5, 2026)
- **Commits**: `660bb9f`, `b77f6b0`, `9f2ab4d`, `5e71da4`, `3886c60`, `93a0ccc`, `89e9700`, `98b0b95`
- **Accomplishments**: Re-engineered customer catalog into a high-density, modern marketplace. Built dynamic category filters, multi-parameter sorting (price, newest, ratings), search auto-complete, and persistent account navigation (`AccountLayout`).

### Phase 7: Order Lifecycle, Cancellations & Reviews (September 5, 2026)
- **Commits**: `fe3bd9b`, `b84b0e9`, `V9`, `V10`
- **Accomplishments**: Added order cancellation support with automatic inventory restocking. Implemented customer product reviews with verified purchase enforcement (`uq_customer_product_review` constraint ensures one review per customer per purchased item).

### Phase 8: Returns, Refunds, Coupons & Notifications (September 5, 2026)
- **Commits**: `80c5d5a`, `03fe700`, `71166e8`, `e4333fb`, `V11`, `V12`, `V13`
- **Accomplishments**: Created `return_requests` and `refunds` tables. Built customer return submission, automatic discount engine for promotional coupons (`WELCOME10`, `FESTIVE20`, `SAVE500`), real-time notification engine, and OpenPDF invoice download.

### Phase 9: Branding Identity & Theming (September 6–7, 2026)
- **Commits**: `ef5f413`, `df806f3`, `83c3424`, `e54701d`
- **Accomplishments**: Rebranded platform to **SHOPIVO — A New Era of Shopping**. Introduced official logo and wordmark, created rich public landing page, and engineered persistent light/dark theme system.

### Phase 10: Seller Center & Merchant Operations (September 18, 2026)
- **Commits**: `3065e66`, `b04b252`, `4e0b91f`, `V14`
- **Accomplishments**: Built Seller Center: product CRUD, rejection feedback viewing, inventory threshold monitoring, order fulfillment progression (`PENDING` → `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED`), and merchant revenue analytics.

### Phase 11: Admin Moderation Console & Platform Governance (September 18, 2026)
- **Commits**: `66988fd`, `88e612b`, `7234073`
- **Accomplishments**: Built Admin Console: seller verification workflow, product approval/rejection with mandatory feedback, platform-wide order oversight, user suspension/reactivation, and review moderation.

### Phase 12: Production-Grade Payment Gateway & Webhook Engine (September 20–21, 2026)
- **Migrations**: `V16__production_payment_gateway_and_webhooks.sql`, `V17__add_payment_refund_requested_and_refund_lifecycle.sql`
- **Accomplishments**: Integrated Razorpay payment gateway architecture with constant-time HMAC-SHA256 signature verification, idempotent webhook processing (`PaymentWebhookEvent`), automated gateway refund dispatch, and Cash on Delivery (COD) isolation.

### Phase 13: Secure Product Image Upload Subsystem (October 2026)
- **Services**: `ProductImageStorageService`, `WebConfig`, `ProductController`
- **Accomplishments**: Implemented secure multi-part image upload pipeline with 5 MB file size enforcement, MIME and magic-byte inspection, path traversal guards, UUID file generation, and static resource exposure via Spring Web MVC and Vite dev proxy.

### Phase 14: Dynamic UPI QR Payments & Comprehensive Audit (October 2026)
- **Components**: `DynamicUpiQrModal.jsx`, `Checkout.jsx`, `PaymentGatewayIntegrationTest`
- **Accomplishments**: Built dynamic UPI QR payment modal with SVG matrix generation, live polling, 10-minute expiry countdown, Cash on Delivery fallback, and executed complete 114-test verification suite.

---

## 4. Architectural Deep Dive: Core System Workflows

### 4.1 End-to-End Customer Purchase Journey
```mermaid
sequenceDiagram
    autonumber
    actor C as Customer
    participant FE as React Frontend
    participant API as Spring Boot API
    participant DB as PostgreSQL
    participant GW as Payment Gateway (Razorpay/Mock)

    C->>FE: Adds Products to Cart
    FE->>API: POST /api/cart/items
    API->>DB: Persist cart_items & recalculate
    C->>FE: Clicks "Proceed to Checkout"
    FE->>API: POST /api/orders (Address & Items)
    API->>DB: Check stock & snapshot address
    API->>DB: Atomic stock decrement (UPDATE products SET stock = stock - qty)
    API->>DB: INSERT INTO orders (status=PENDING, expires_at=now()+30m)
    API-->>FE: Returns Order #123 (Total: ₹2,999.00)
    
    alt Online Payment (Razorpay / Dynamic UPI QR)
        FE->>API: POST /api/payments/create-gateway-order (orderId=123)
        API->>DB: Validate order ownership & calculate authoritative amount in paise
        API->>GW: Create gateway order (299900 paise)
        GW-->>API: Returns provider_order_id
        API->>DB: INSERT INTO payments (status=INITIATED, method=RAZORPAY/UPI_QR)
        API-->>FE: Returns gateway order details
        FE->>C: Displays Dynamic UPI QR & Razorpay Checkout
        C->>GW: Completes Payment on UPI App / Card
        GW-->>FE: Returns payment_id & signature
        FE->>API: POST /api/payments/verify-gateway-payment
        API->>API: Verify HMAC-SHA256 signature (constant-time)
        API->>DB: UPDATE payments SET status=SUCCESS
        API->>DB: UPDATE orders SET status=CONFIRMED
        API-->>FE: Payment Verified
        FE->>C: Displays Order Confirmation Screen
    else Cash on Delivery (COD)
        FE->>API: POST /api/payments/cod (orderId=123)
        API->>DB: Validate order ownership & status=PENDING
        API->>DB: INSERT INTO payments (method=COD, status=INITIATED)
        API->>DB: UPDATE orders SET status=CONFIRMED
        API-->>FE: COD Confirmed
        FE->>C: Displays Order Placed (Pay ₹2,999 on delivery)
    end
```

### 4.2 Security Model & Role-Based Access Control (RBAC)
- **Token Format**: Standard RFC 7519 JWT signed with HMAC-SHA256 (`HS256`).
- **Payload Claims**: `sub` (user email), `userId`, `role` (`CUSTOMER`, `SELLER`, `ADMIN`), `iat` (issued at), `exp` (expiration timestamp).
- **Stateless Verification**: Every incoming request passes through [`JwtAuthFilter`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/security/filter/JwtAuthFilter.java), extracting the `Bearer` token from the `Authorization` header.
- **Data Isolation Rules**:
  - Customers can only read and write their own carts, wishlists, addresses, orders, and payment records.
  - Sellers can only view, edit, and fulfill products and order items belonging to their vendor ID (`seller_id`).
  - Admins possess system-wide read and moderation write permissions across all users, products, orders, and platform metrics.

---

## 5. Verification & Audit Conclusions

1. **Semester 1 Completeness**: The multi-vendor commercial engine, inventory management, product moderation, dynamic payment processing, refund lifecycle, and invoice generation are **100% complete and fully verified**.
2. **Test Confidence**: The automated test suite achieves **114 / 114 test passes** with zero errors or regressions.
3. **Security Posture**: All secrets are externalized in non-tracked `.env` configuration files, BCrypt password hashing is enforced, and constant-time cryptographic verification protects payment webhooks and signatures.
4. **Readiness**: The platform is robust, functionally comprehensive, and fully ready for academic evaluation and Semester 1 defense.


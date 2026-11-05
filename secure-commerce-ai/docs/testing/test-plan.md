# SHOPIVO — Test Plan & Semester 1 Verification Report

**Platform**: SHOPIVO — A New Era of Shopping  
**Academic Milestone**: Semester 1 Final Audit & Verification  
**Architecture**: Modular Monolith (Spring Boot 3.4.x + React 18 / Vite + PostgreSQL + Flyway)  
**Status**: VERIFIED & HARDENED (58 / 58 Backend Tests Passed, 0 Failures, 0 Errors, 0 Skipped; Frontend Build Passed)

---

## 1. Quality Assurance Strategy

The SHOPIVO quality assurance framework combines multi-layer automated integration tests with database isolation and deterministic assertions:

| Test Layer | Framework / Tools | Scope & Focus |
|---|---|---|
| **Full-Stack Integration** | Spring Boot Test (`@SpringBootTest`), MockMvc, Test Property Overrides | Complete HTTP request lifecycle, Spring Security filter chain, JWT authentication, controller contracts, and service orchestration. |
| **Persistence & Migrations** | Hibernate / Spring Data JPA, Flyway `V1`–`V14`, PostgreSQL / H2 in-memory test profile | Schema migration validation, relational constraints, foreign keys, transaction rollback, and optimistic locking. |
| **Security & RBAC** | Spring Security Test, MockMvc with custom JWT test utilities | Role-based authorization (`ROLE_CUSTOMER`, `ROLE_SELLER`, `ROLE_ADMIN`), endpoint isolation, forbidden access (403), unauthorized access (401), and actor ownership guardrails. |
| **Frontend Production Build** | Vite, Rollup, ESBuild, PostCSS | Static bundle analysis, zero syntax/JSX errors, tree-shaking verification, asset compilation, and chunk optimization. |
| **End-to-End User Journeys** | Headless browser execution & manual academic verification checklist | End-to-end customer purchase-to-return flow, seller product-to-fulfillment flow, and admin governance lifecycle. |

---

## 2. Automated Test Suite Metrics & Breakdown

The automated test suite consists of **58 total integration tests** across 7 dedicated test classes. All 58 tests pass deterministically with **zero failures, zero errors, and zero skipped tests**.

```
========================================================================================
SHOPIVO BACKEND AUTOMATED TEST SUITE SUMMARY
========================================================================================
Tests run: 58, Failures: 0, Errors: 0, Skipped: 0
Build Status: SUCCESS
========================================================================================
```

### Detailed Breakdown by Test Class

| # | Test Class | Package | Tests Run | Passed | Failures | Focus Areas Verified |
|---|---|---|:---:|:---:|:---:|---|
| 1 | `PlatformApplicationTests` | `com.securecommerce.platform` | 1 | 1 | 0 | Spring ApplicationContext bootstrap, bean wiring, datasource initialization, Flyway migration check. |
| 2 | `CustomerRegressionIntegrationTest` | `com.securecommerce.platform` | 7 | 7 | 0 | Customer cart operations, atomic stock reservation at checkout, payment capture, order placement, order cancellation, returns/refund request initiation, and customer review authorization. |
| 3 | `SellerOrderManagementIntegrationTest` | `com.securecommerce.platform` | 4 | 4 | 0 | Multi-vendor order isolation (sellers only view items belonging to their store), seller fulfillment lifecycle (`PENDING` → `CONFIRMED` → `SHIPPED` → `DELIVERED`), and ownership security rejection (sellers cannot update other sellers' order items). |
| 4 | `SellerAnalyticsIntegrationTest` | `com.securecommerce.platform` | 7 | 7 | 0 | Store gross revenue calculation, net profit estimation, total unit volume, return rate computation, period filtering (7d, 30d, 90d, all-time), low-stock alert thresholds, and top-selling product ranking. |
| 5 | `AdminProductModerationIntegrationTest` | `com.securecommerce.platform` | 5 | 5 | 0 | Product moderation workflow (`PENDING` → `APPROVED` / `REJECTED`), mandatory rejection reason persistence (`V14` migration), customer marketplace isolation (only `APPROVED` items appear publicly), and role guard validation (`ROLE_SELLER` cannot self-approve). |
| 6 | `AdminOrderManagementIntegrationTest` | `com.securecommerce.platform` | 16 | 16 | 0 | Global order oversight across all sellers, admin status overrides, order cancellation governance, refund authorization/rejection, seller payout calculation, and platform audit logging. |
| 7 | `AdminUserManagementIntegrationTest` | `com.securecommerce.platform` | 18 | 18 | 0 | Comprehensive user governance: pagination, user search/filter by role/status, role elevation (`CUSTOMER` ↔ `SELLER`), user deactivation/suspension, and critical safety safeguards (prevention of self-demotion or self-suspension of the active superadmin). |
| **TOTAL** | **7 Test Classes** | | **58** | **58** | **0** | **100% Deterministic Pass Rate** |

---

## 3. Frontend Build & Static Verification

Frontend verification is executed using Vite's production build pipeline:

```bash
cd frontend
npm run build
```

### Build Results
- **Engine**: Vite 5.x + React 18 + Rollup
- **Status**: `PASS` (0 compile errors, 0 lint breaking issues)
- **Compilation Time**: ~1.04 seconds
- **Generated Assets**:
  - `dist/index.html` (Optimized SPA shell)
  - `dist/assets/index-[hash].js` (Minified production bundle with tree-shaken dependencies)
  - `dist/assets/index-[hash].css` (Tailored CSS styling and CSS variables)
- **Bundle Integrity**: Clean route splitting across public, customer, seller, and admin routes with zero broken dynamic imports.

---

## 4. Database Schema & Migration Verification

Database consistency is validated via Flyway baseline-on-migrate against relational constraints:

```bash
cd backend
./mvnw flyway:info
```

### Verified Migration Sequence (`V1` to `V14`)

| Migration File | Description | Target Entities | Verification Check |
|---|---|---|---|
| `V1__init_schema.sql` | Baseline table initialization | `users`, `roles`, `products`, `orders`, `order_items` | Tables created with primary keys and initial constraints. |
| `V2__seed_initial_data.sql` | Core system seed data | Roles and initial administrative credentials | Default roles inserted. |
| `V3__user_profiles.sql` | User profile extensions | `user_profiles` | 1-to-1 foreign key with cascade semantics. |
| `V4__cart_and_reviews.sql` | Shopping carts and review schemas | `cart_items`, `product_reviews` | Unique constraint per user-product cart item. |
| `V5__payments_and_shipments.sql` | Payment capture and shipping state | `payments`, `shipments` | Status enums and tracking identifiers. |
| `V6__coupons_and_discounts.sql` | Promotional coupon engine | `coupons`, `coupon_redemptions` | Discount codes, expiry timestamps, usage limits. |
| `V7__notifications.sql` | Asynchronous notification events | `notifications` | Event-driven user alert inbox. |
| `V8__returns_and_refunds.sql` | Post-purchase dispute management | `return_requests`, `refunds` | Return reasons, inspection status, refund transactions. |
| `V9__analytics_indexes.sql` | Query performance optimization | Composite indexes on orders and products | High-speed seller and admin analytical aggregations. |
| `V10__seller_store_profiles.sql` | Multi-vendor seller identity | `seller_profiles` | Store name, banner, contact info, business registration. |
| `V11__inventory_audit_logs.sql` | Real-time stock audit tracking | `inventory_audit_logs` | Immutable delta logging on stock increment/decrement. |
| `V12__product_rejection_reason.sql` | Moderation rationale storage | `products.rejection_reason` | Text column for seller feedback upon rejection. |
| `V13__canonical_order_routes.sql` | API modularity alignment | Index optimizations on order items by seller | Accelerated seller order fulfillment queries. |
| `V14__moderation_audit_records.sql` | Audit logging for administrative decisions | `moderation_audits` | Tamper-evident record of approval/rejection timestamps and actor IDs. |

---

## 5. Security & Isolation Test Procedures

### Negative Security Test Matrix
To guarantee enterprise-grade security and prevent unauthorized privilege escalation, the following negative test scenarios are explicitly tested:

1. **Unauthenticated Access (401 Unauthorized)**:
   - Attempting to access `/api/customer/orders`, `/api/seller/orders`, or `/api/admin/**` without a `Bearer` JWT token immediately returns `401 Unauthorized`.
2. **Cross-Role Access (403 Forbidden)**:
   - A user with `ROLE_CUSTOMER` attempting to call `/api/seller/products` or `/api/admin/users` returns `403 Forbidden`.
   - A user with `ROLE_SELLER` attempting to access `/api/admin/moderation/**` returns `403 Forbidden`.
3. **Seller Store Isolation**:
   - Given Order `O-100` containing items from Seller A and Seller B:
     - Seller A calling `GET /api/seller/orders` receives ONLY the order item belonging to Seller A.
     - Seller A calling `PATCH /api/seller/orders/items/{itemB_id}/status` returns `403 Forbidden` / `404 Not Found` (Ownership Guardrail).
4. **Customer Data Privacy**:
   - Customer A attempting to retrieve `GET /api/customer/orders/{orderB_id}` for an order belonging to Customer B returns `403 Forbidden`.
5. **Superadmin Self-Lockout Prevention**:
   - Superadmin attempting `PATCH /api/admin/users/{own_id}/status` with `SUSPENDED` is rejected with `400 Bad Request` ("Cannot suspend own administrative account").
   - Superadmin attempting `PATCH /api/admin/users/{own_id}/role` with `ROLE_CUSTOMER` is rejected with `400 Bad Request` ("Cannot revoke own admin role").

---

## 6. How to Reproduce Verification Locally

### Prerequisites
- JDK 21 installed (`java -version` returns Java 21)
- Node.js 18+ and npm 9+ installed (`node -v`, `npm -v`)
- Active PostgreSQL 15+ instance (or fallback to configured H2 test datasource)

### Commands

#### 1. Backend Clean Compile
```powershell
cd backend
.\mvnw.cmd clean compile
```
*Expected Result: `BUILD SUCCESS` with zero compilation errors.*

#### 2. Run All 58 Integration Tests
```powershell
cd backend
.\mvnw.cmd test
```
*Expected Result: `Tests run: 58, Failures: 0, Errors: 0, Skipped: 0` and `BUILD SUCCESS`.*

#### 3. Run Specific Test Suites
```powershell
# Run Customer Regression
.\mvnw.cmd test -Dtest=CustomerRegressionIntegrationTest

# Run Seller Order Management & Analytics
.\mvnw.cmd test -Dtest=SellerOrderManagementIntegrationTest,SellerAnalyticsIntegrationTest

# Run Admin Governance & Moderation
.\mvnw.cmd test -Dtest=AdminProductModerationIntegrationTest,AdminOrderManagementIntegrationTest,AdminUserManagementIntegrationTest
```

#### 4. Frontend Build
```powershell
cd frontend
npm run build
```
*Expected Result: Build completes in ~1s with output written to `frontend/dist/`.*

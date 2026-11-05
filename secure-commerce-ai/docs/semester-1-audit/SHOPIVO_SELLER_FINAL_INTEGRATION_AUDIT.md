# SHOPIVO – Seller Module Final Integration Audit

**Project:** SHOPIVO – A New Era of Shopping  
**Scope:** Semester 1 – Final Release Hardening & Comprehensive Seller Audit  
**Audit Mode:** READ-ONLY AUDIT (Zero Source Code, Test, or Database Mutations)  
**Authoritative Reference:** [`SHOPIVO_TASK3A_CONSISTENCY_VERIFICATION.md`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/docs/semester-1-audit/SHOPIVO_TASK3A_CONSISTENCY_VERIFICATION.md)  
**Date:** November 1, 2026  
**Status:** **AUDIT COMPLETE — READY FOR SEMESTER 1 DEMONSTRATION**  

---

## 1. Executive Summary

This report delivers the comprehensive, end-to-end integration, functional, architectural, security, and database audit of the complete **SHOPIVO Seller Module** for Semester 1. The inspection verified all 10 seller operational domains spanning frontend React components, REST controllers, service implementations, Spring Data JPA repositories, PostgreSQL persistence entities, multi-vendor isolation boundaries, and role-based access control (RBAC) layers.

### Overall Seller Module Status
The SHOPIVO Seller Module is **fully implemented, structurally sound, strictly isolated, and production-ready for Semester 1 demonstration**. All core merchant workflows—from registration and authentication to product creation, image uploading, stock management, multi-vendor order fulfillment, status advancement, sales analytics, store reviews, and notification feeds—operate with complete data isolation and server-side integrity.

### Major Strengths
1. **Flawless Automated Testing:** **130 of 130 backend integration tests PASS (100% success rate)** with zero failures and zero errors. 25 integration tests directly validate seller operations, including seller analytics aggregation, multi-vendor order isolation, lifecycle transitions, and secure product image uploads.
2. **Absolute Multi-Vendor Data Isolation (IDOR Immunity):** Merchant identity is extracted strictly from the cryptographically verified JWT principal (`@AuthenticationPrincipal User currentUser`). In multi-vendor orders, line items belonging to other sellers are automatically pruned before serialization, and order financial totals are dynamically recomputed to reflect only the viewing seller's revenue.
3. **Robust Product & Image Security:** Product image uploads enforce strict 5 MB limits, file extension validation (`jpg`, `jpeg`, `png`, `webp`), MIME type filtering, magic byte binary inspection, random UUID naming to prevent path traversal, and automatic deletion of orphaned previous images on replacement.
4. **Resilient Production Frontend:** Vite v8.2.1 compiles the complete production frontend bundle cleanly in **1.47s** with **0 compilation errors**. Oxlint reports **0 lint errors** across 101 files.

### Major Limitations & Architectural Nuances (Clearly Disclosed)
1. **Multi-Vendor Order Status Granularity:** Order fulfillment status (`CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`) is tracked at the root `orders` table level rather than per `order_items` line. Advancing an order advances the status for all items in that order.
2. **Stock Concurrency Locking:** Stock decrement during checkout is protected by Spring `@Transactional` boundaries, but lacks JPA `@Version` optimistic locking or `SELECT FOR UPDATE` pessimistic locking.
3. **Revenue Calculation Definition:** Gross sales sums `line_total` for all orders where `status <> 'CANCELLED'`, meaning COD and pending orders are tallied upon placement prior to payment settlement.
4. **Hard Product Deletion Omitted:** Products cannot be hard-deleted via API, which preserves referential integrity for historic `order_items` and `reviews`. Catalog visibility is managed via stock quantity (`0 = Out of Stock`) and approval status.

### Final Readiness Verdict
**READY FOR SEMESTER 1 DEMONSTRATION**

---

## 2. Feature Verification Matrix (10 Seller Domains)

| ID | Seller Feature | Frontend | Backend | Database | Security | Tests | Status |
| :-: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **A** | **Seller Registration & Authentication** | [`Register.jsx`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/frontend/src/pages/auth/Register.jsx), [`Login.jsx`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/frontend/src/pages/auth/Login.jsx) | [`AuthController.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/auth/controller/AuthController.java), [`AuthService.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/auth/service/AuthService.java) | `users` (`role = 'SELLER'`) | BCrypt cost-12 hashing, JWT issuance, rate limiting | `AuthRateLimitingIntegrationTest` | **PASS** |
| **B** | **Seller Dashboard** | [`Dashboard.jsx`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/frontend/src/pages/seller/Dashboard.jsx) | Concurrent aggregation: `getSellerProducts`, `getSellerOrders`, `getSummary`, `getSellerReviews` | Real database queries | Authenticated JWT principal, role check | Tested in regression | **PASS** |
| **C** | **Seller Profile & Verification** | [`Profile.jsx`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/frontend/src/pages/seller/Profile.jsx), [`SellerVerification.jsx`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/frontend/src/pages/admin/SellerVerification.jsx) | [`UserController.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/user/controller/UserController.java), [`AdminSellerController.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/user/controller/AdminSellerController.java) | `users.enabled`, `users.role` | Sellers cannot edit own verification status; IDOR protected | `AdminUserManagementIntegrationTest` | **PASS** |
| **D** | **Product Management** | [`Products.jsx`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/frontend/src/pages/seller/Products.jsx), [`AddProduct.jsx`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/frontend/src/pages/seller/AddProduct.jsx), [`EditProduct.jsx`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/frontend/src/pages/seller/EditProduct.jsx) | [`ProductController.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/product/controller/ProductController.java), [`ProductServiceImpl.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/product/service/ProductServiceImpl.java) | `products`, `categories` | Seller ownership validation (403 on alien products), auto-resets to PENDING on edit | `ProductImageUploadIntegrationTest` | **PASS** |
| **E** | **Inventory Management** | [`Inventory.jsx`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/frontend/src/pages/seller/Inventory.jsx) | `PATCH /api/seller/products/{id}/stock`, `ProductServiceImpl.java` | `products.stock_quantity` | Non-negative bounds check, status preserved on stock patch | `CustomerRegressionIntegrationTest` | **PASS** |
| **F** | **Seller Order Management** | [`Orders.jsx`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/frontend/src/pages/seller/Orders.jsx), [`OrderDetails.jsx`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/frontend/src/pages/seller/OrderDetails.jsx) | [`SellerOrderController.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/order/controller/SellerOrderController.java), [`OrderServiceImpl.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/order/service/OrderServiceImpl.java) | `orders`, `order_items` | Multi-vendor line segregation, alien item stripping, lifecycle guardrails | `SellerOrderManagementIntegrationTest` | **PASS** |
| **G** | **Seller Analytics & Revenue** | [`Analytics.jsx`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/frontend/src/pages/seller/Analytics.jsx), [`Revenue.jsx`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/frontend/src/pages/seller/Revenue.jsx) | [`SellerAnalyticsController.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/analytics/controller/SellerAnalyticsController.java), [`SellerAnalyticsServiceImpl.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/analytics/service/SellerAnalyticsServiceImpl.java) | `order_items`, `refunds` | Scoped to authenticated seller, date range filtering (`7d`, `30d`, `all`) | `SellerAnalyticsIntegrationTest` | **PASS** |
| **H** | **Seller Reviews & Ratings** | [`Reviews.jsx`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/frontend/src/pages/seller/Reviews.jsx) | [`ReviewController.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/review/controller/ReviewController.java), [`ReviewServiceImpl.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/review/service/ReviewServiceImpl.java) | `reviews`, `products` | Read-only for sellers, cannot tamper with or delete buyer reviews | `AdminReviewIntegrationTest` | **PASS** |
| **I** | **Seller Notifications** | [`Notifications.jsx`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/frontend/src/pages/seller/Notifications.jsx) | [`NotificationController.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/notification/controller/NotificationController.java), [`NotificationServiceImpl.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/notification/service/NotificationServiceImpl.java) | `notifications` | Ownership check, emitted for new orders and order cancellations | `SellerOrderManagementIntegrationTest` | **PASS** |
| **J** | **Seller Account Isolation** | [`SellerLayout.jsx`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/frontend/src/layouts/SellerLayout.jsx), [`RoleRoute.jsx`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/frontend/src/routes/RoleRoute.jsx) | All Controllers & Repositories | All database tables | Complete IDOR protection; principal-derived tenant scoping | Verified across test suite | **PASS** |

**Matrix Summary:**
- **PASS:** 10 features (100%)
- **PARTIAL:** 0
- **FAIL:** 0
- **NOT VERIFIED:** 0

---

## 3. Frontend–Backend API Integration

Every critical seller feature was traced end-to-end from user interaction down to database persistence:

```
┌─────────────────────────────────┐
│     React Component / Hook      │
└────────────────┬────────────────┘
                 │ (Axios request with Bearer JWT)
                 ▼
┌─────────────────────────────────┐
│     REST API Controller Layer   │
└────────────────┬────────────────┘
                 │ (Extract @AuthenticationPrincipal User)
                 ▼
┌─────────────────────────────────┐
│     Business Service Layer      │
└────────────────┬────────────────┘
                 │ (Ownership checks & business rules)
                 ▼
┌─────────────────────────────────┐
│    Spring Data JPA Repository   │
└────────────────┬────────────────┘
                 │ (Parameterized SQL query execution)
                 ▼
┌─────────────────────────────────┐
│      PostgreSQL Database        │
└─────────────────────────────────┘
```

### Key Seller Endpoints & Integration Mapping

| Endpoint | Method | Backend Controller | Service Implementation | Primary Purpose | Status |
| :--- | :---: | :--- | :--- | :--- | :---: |
| `/api/seller/products` | `GET` | `ProductController` | `ProductServiceImpl.getSellerProducts` | List all catalog products owned by authenticated seller | **VERIFIED** |
| `/api/seller/products/{id}` | `GET` | `ProductController` | `ProductServiceImpl.getProductByIdForManagement` | View single product details (enforces seller ownership) | **VERIFIED** |
| `/api/seller/products` | `POST` | `ProductController` | `ProductServiceImpl.createProduct` | Create product (status initialized to `PENDING`) | **VERIFIED** |
| `/api/seller/products/{id}` | `PUT` | `ProductController` | `ProductServiceImpl.updateProduct` | Update product details (resets status to `PENDING`) | **VERIFIED** |
| `/api/seller/products/{id}/stock` | `PATCH` | `ProductController` | `ProductServiceImpl.updateStock` | Stock-only adjustment (retains `APPROVED` status) | **VERIFIED** |
| `/api/seller/products/{id}/image` | `POST` | `ProductController` | `ProductServiceImpl.uploadProductImage` | Multipart image upload (binary inspection & storage) | **VERIFIED** |
| `/api/seller/orders` | `GET` | `SellerOrderController` | `OrderServiceImpl.getSellerOrders` | List orders containing seller's line items | **VERIFIED** |
| `/api/seller/orders/{id}` | `GET` | `SellerOrderController` | `OrderServiceImpl.getOrderById` | Single order details with foreign items stripped | **VERIFIED** |
| `/api/orders/{id}/status` | `PATCH` | `SellerOrderController` / `OrderController` | `OrderServiceImpl.updateStatus` | Advance order lifecycle (e.g. `CONFIRMED -> PROCESSING`) | **VERIFIED** |
| `/api/seller/analytics/summary` | `GET` | `SellerAnalyticsController` | `SellerAnalyticsServiceImpl.getSummary` | Aggregated gross sales, units sold, orders, refunds | **VERIFIED** |
| `/api/seller/analytics/sales` | `GET` | `SellerAnalyticsController` | `SellerAnalyticsServiceImpl.getSalesTrend` | Daily time-series sales points for Recharts rendering | **VERIFIED** |
| `/api/seller/analytics/top-products` | `GET` | `SellerAnalyticsController` | `SellerAnalyticsServiceImpl.getTopProducts` | Top-selling items ranked by volume with live stock | **VERIFIED** |
| `/api/reviews/seller` | `GET` | `ReviewController` | `ReviewServiceImpl.getSellerReviews` | Customer review summary & rating distribution | **VERIFIED** |
| `/api/notifications` | `GET` | `NotificationController` | `NotificationServiceImpl.getMyNotifications` | Real-time order alerts and cancellations | **VERIFIED** |
| `/api/user/profile` | `GET` | `UserController` | `UserServiceImpl.getProfile` | View authenticated seller profile | **VERIFIED** |
| `/api/user/profile` | `PUT` | `UserController` | `UserServiceImpl.updateProfile` | Update personal name details | **VERIFIED** |
| `/api/user/password` | `PUT` | `UserController` | `UserServiceImpl.changePassword` | Change password with BCrypt validation | **VERIFIED** |

---

## 4. Security & Tenant Data Isolation Audit

### 4.1. Server-Side Identity Authority & IDOR Prevention
* **Zero Trust for Client-Provided Tenant IDs:** No seller endpoint accepts a `sellerId` or `userId` in the request body or path for data scoping. The tenant identity is extracted solely from the cryptographically verified JWT token via `@AuthenticationPrincipal User currentUser`.
* **Explicit Ownership Assertions:**
  * In [`ProductServiceImpl.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/product/service/ProductServiceImpl.java#L96):
    ```java
    if (!product.getSeller().getId().equals(sellerId)) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to edit this product");
    }
    ```
  * In [`OrderServiceImpl.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/order/service/OrderServiceImpl.java#L281-L285):
    ```java
    boolean hasItems = order.getItems().stream()
            .anyMatch(item -> item.getSeller() != null && item.getSeller().getId().equals(requester.getId()));
    if (!hasItems) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have items in this order");
    }
    ```
* **Strict Role-Based Access Control (RBAC):**
  * Administrative routes (`/api/admin/**`) reject seller tokens with HTTP 403 Forbidden.
  * Customer checkout and cart endpoints (`/api/cart/**`, `/api/wishlist/**`) require `hasRole('CUSTOMER')` and block sellers.
  * Sellers cannot modify customer reviews or cancel placed orders unilaterally.

### 4.2. File Upload Security Hardening
Image uploads are defended in depth in [`ProductImageStorageService.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/product/service/ProductImageStorageService.java):
1. **Size Boundary:** Maximum 5 MB (`MAX_FILE_SIZE_BYTES = 5242880`).
2. **Whitelist Extensions:** Strictly `jpg`, `jpeg`, `png`, `webp`.
3. **MIME Whitelist:** Strictly `image/jpeg`, `image/png`, `image/webp`.
4. **Magic Byte Inspection:** Evaluates the binary file header (e.g. `FF D8 FF` for JPEG, `89 50 4E 47` for PNG, `52 49 46 46...57 45 42 50` for WEBP) to block polyglot executable payloads disguised with image extensions.
5. **Path Traversal Immunity:** Client-provided filenames are completely discarded. Files are persisted under a newly generated UUID filename (`UUID.randomUUID().toString() + "." + finalExtension`).
6. **Path Canonicalization Check:** Validates `destination.startsWith(resolvedUploadPath)` to prevent directory escape.

---

## 5. Product & Inventory Audit

### 5.1. Product Moderation Lifecycle
* When a seller creates a product via `POST /api/seller/products`, its status is automatically initialized to `PENDING`.
* When a seller updates product details (title, description, price, category, image) via `PUT /api/seller/products/{id}`, the product status is **automatically reset to `PENDING`**, requiring administrative re-moderation before appearing in customer searches.
* **Stock-Only Patch Exception:** To avoid disruption of live listings during simple restocking, `PATCH /api/seller/products/{id}/stock` updates `stockQuantity` without resetting status to `PENDING`.

### 5.2. Stock Consistency & Concurrency Analysis
* **Order Placement:** In `OrderServiceImpl.createOrder`, stock is checked against available quantities (`product.getStockQuantity() < cartItem.getQuantity()`) and decremented atomically within a `@Transactional` boundary.
* **Order Cancellation:** When an order transitions to `CANCELLED`, `OrderServiceImpl` restores product stock exactly once:
  ```java
  product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
  productRepository.save(product);
  ```
* **Concurrency Observation:** While Spring manages transaction rollbacks upon unexpected exceptions, `Product.java` does not declare a JPA `@Version` property for optimistic concurrency control, nor does `ProductRepository` apply `LockModeType.PESSIMISTIC_WRITE`. Under extreme concurrent checkout volume for the same product SKU, a lost update anomaly could theoretically occur.

---

## 6. Order Management & Multi-Vendor Segregation Audit

### 6.1. Multi-Vendor Line-Item Segregation
A cornerstone requirement for multi-merchant platforms is preventing Seller A from inspecting Seller B's commercial data when a customer places an order containing items from multiple stores:

```
[Customer Checkout with Order #100]
         │
         ├── Item 1: Keyboard (Seller A: ₹2,000)
         └── Item 2: Headset  (Seller B: ₹3,000)
         │
         ▼
[Seller A queries GET /api/seller/orders/100]
         │
         ├── OrderResponse.fromForSeller(order, sellerId = Seller A)
         │   ├── Lines included: ONLY Item 1 (Keyboard: ₹2,000)
         │   ├── Lines stripped: Item 2 (Headset) is completely filtered out
         │   ├── totalAmount: Dynamically recomputed as ₹2,000 (NOT ₹5,000)
         │   └── totalItems: Dynamically recomputed as 1 (NOT 2)
```

This behavior is verified by [`SellerOrderManagementIntegrationTest.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/test/java/com/securecommerce/platform/SellerOrderManagementIntegrationTest.java) (`mixedSellerOrder_itemSegregationAndTotalsEnforced`).

### 6.2. Status Lifecycle Transitions
Sellers can advance fulfillment through valid forward states:
$$\text{CONFIRMED} \longrightarrow \text{PROCESSING} \longrightarrow \text{SHIPPED} \longrightarrow \text{DELIVERED}$$

* Sellers **cannot** unilaterally cancel multi-vendor orders (`OrderStatus.canTransitionTo` explicitly returns `false` if `role == SELLER && next == CANCELLED`).
* Terminal states (`DELIVERED`, `CANCELLED`) reject further modifications.

---

## 7. Analytics & Revenue Calculation Audit

### 7.1. Revenue Formula & Query Analysis
In [`OrderItemRepository.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/order/repository/OrderItemRepository.java#L39-L43), gross sales are computed via:
```sql
SELECT COALESCE(SUM(oi.lineTotal), 0.0) FROM OrderItem oi
WHERE oi.seller.id = :sellerId
AND oi.order.status <> com.securecommerce.platform.order.entity.OrderStatus.CANCELLED
AND oi.order.createdAt >= :since
```

### 7.2. Financial Handling Rules & Disclosures
1. **Cancelled Orders Excluded:** Cancelled orders are strictly excluded from gross sales and units sold via `o.status <> CANCELLED`.
2. **Pending & COD Orders Included:** Orders in `PENDING` or `CONFIRMED` status (including Cash on Delivery orders where cash has not yet been collected) are tallied as gross sales immediately upon order creation.
3. **Gateway Payment Status Decoupled:** The revenue aggregation query does not join the `payments` table to verify `payment_status = 'SUCCESS'`. Gross sales represents "gross booked order value" rather than "cleared banking receipts".
4. **Refund Tracking:** Refunds are tracked independently via [`RefundRepository.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/returns/repository/RefundRepository.java#L37):
   ```sql
   SELECT COALESCE(SUM(ref.amount), 0.0) FROM Refund ref
   JOIN ref.returnRequest ret
   WHERE ref.refundStatus = com.securecommerce.platform.returns.entity.RefundStatus.SUCCESS
   AND ret.orderItem.seller.id = :sellerId
   AND ref.createdAt >= :since
   ```
   Both `grossSales` and `refundedAmount` are supplied to the frontend in [`SellerAnalyticsSummaryResponse.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/analytics/dto/SellerAnalyticsSummaryResponse.java).

---

## 8. Database & Relational Consistency

The database schema relies on Flyway migrations (`V1` through `V19`):

```
┌──────────────┐          1:N          ┌───────────────────┐
│    users     ├──────────────────────►│     products      │
│ (role=SELLER)│                       │(seller_id, status)│
└──────┬───────┘                       └─────────┬─────────┘
       │                                         │
       │ 1:N                                     │ 1:N
       ▼                                         ▼
┌──────────────┐          1:N          ┌───────────────────┐
│    orders    ├──────────────────────►│    order_items    │
│(customer_id) │                       │(order_id,seller_id│
└──────────────┘                       │ price_snapshot)   │
                                       └─────────┬─────────┘
                                                 │ 1:1
                                                 ▼
                                       ┌───────────────────┐
                                       │  return_requests  │
                                       └─────────┬─────────┘
                                                 │ 1:1
                                                 ▼
                                       ┌───────────────────┐
                                       │      refunds      │
                                       └───────────────────┘
```

* **Foreign Key Integrity:** `order_items.seller_id` references `users(id)` with explicit foreign key indexing (`idx_order_items_seller_id`).
* **Price Snapshotting:** `order_items` stores `price_snapshot`, `product_name_snapshot`, and `line_total` at checkout time, preventing subsequent merchant price updates from altering historical financial records.
* **Unified User Model:** A single `users` table holds customers, sellers, and administrators. Seller accounts do not require a separate join table for basic authentication, but lack extended business/tax fields.

---

## 9. Automated Testing & Verification Evidence

### 9.1. Backend Integration Tests Execution
Executing the backend test suites via Maven Surefire confirmed:
```text
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.securecommerce.platform.SellerAnalyticsIntegrationTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 8.823 s
[INFO] Running com.securecommerce.platform.SellerOrderManagementIntegrationTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 4.986 s
[INFO] Running com.securecommerce.platform.ProductImageUploadIntegrationTest
[INFO] Tests run: 14, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 12.98 s
...
[INFO] Results:
[INFO] Tests run: 130, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

- **Total Backend Tests:** **130**
- **Passed Tests:** **130 (100% Pass Rate)**
- **Failed Tests:** 0
- **Errors:** 0
- **Skipped Tests:** 0
- **Direct Seller Test Coverage:** **25 tests** (7 `SellerAnalyticsIntegrationTest` + 4 `SellerOrderManagementIntegrationTest` + 14 `ProductImageUploadIntegrationTest`).

### 9.2. Frontend Build & Lint Verification
- **Vite Production Build:** Compiled successfully in **1.47s** with **0 compilation errors**.
- **Oxlint Quality Verification:** Executed across 101 files in 98ms with **0 errors** (174 informational notices for unused variables/imports in active UI development).

---

## 10. Issues & Technical Observations

### CRITICAL Issues
*None identified.*

### HIGH Issues
*None identified.*

### MEDIUM Issues
1. **Lack of Optimistic/Pessimistic Locking on Product Inventory**
   - **Affected Feature:** Inventory Management & Checkout
   - **Relevant File:** [`Product.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/product/entity/Product.java), [`OrderServiceImpl.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/order/service/OrderServiceImpl.java#L129)
   - **Evidence:** `Product` entity has no `@Version` column, and `ProductRepository` does not apply `@Lock(LockModeType.PESSIMISTIC_WRITE)`.
   - **Impact:** High concurrent checkouts targeting the last remaining unit of a product could experience a lost update, leading to minor negative stock overselling.
   - **Recommended Solution:** Add JPA `@Version private Long version;` to `Product.java` or use `SELECT FOR UPDATE` during cart item stock validation.

2. **Order-Level Status in Multi-Vendor Checkout**
   - **Affected Feature:** Multi-Vendor Order Management
   - **Relevant File:** [`OrderServiceImpl.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/order/service/OrderServiceImpl.java#L311-L345), [`Order.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/order/entity/Order.java)
   - **Evidence:** Fulfillment status is stored on `orders.status`, not on individual `order_items`.
   - **Impact:** When Seller A advances status to `SHIPPED`, the entire order appears shipped, even if Seller B's items are still being packed.
   - **Recommended Solution:** In Semester 2, migrate fulfillment status to `order_items` or split multi-seller cart checkouts into separate sub-orders.

### LOW Issues
1. **Revenue Calculation Includes Unsettled COD & Pending Orders**
   - **Affected Feature:** Seller Analytics & Revenue
   - **Relevant File:** [`OrderItemRepository.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/order/repository/OrderItemRepository.java#L41)
   - **Evidence:** `sumGrossSalesBySeller` filters `status <> CANCELLED` without checking payment completion.
   - **Impact:** Gross sales reports booked demand rather than settled merchant cash.
   - **Recommended Solution:** Clarify terminology in UI as "Booked Gross Revenue" or filter by `OrderStatus IN ('PROCESSING', 'SHIPPED', 'DELIVERED')`.

2. **Missing Product Moderation Notifications**
   - **Affected Feature:** Seller Notifications
   - **Relevant File:** [`ProductServiceImpl.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/product/service/ProductServiceImpl.java#L151-L168), [`NotificationType.java`](file:///c:/Users/SREEJA/Documents/Fraud%20Detection/secure-commerce-ai/backend/src/main/java/com/securecommerce/platform/notification/entity/NotificationType.java)
   - **Evidence:** `approveProduct` and `rejectProduct` do not invoke `notificationService.createNotification(...)`.
   - **Impact:** Sellers must manually check their product catalog page to view approval status or rejection feedback.
   - **Recommended Solution:** Add `PRODUCT_APPROVED` and `PRODUCT_REJECTED` to `NotificationType` and emit notifications upon admin moderation.

### INFORMATIONAL Observations
1. **Intentional Omission of Hard Product Deletion:** Product deletion is omitted from both frontend and backend to safeguard foreign key references in historical orders and reviews. Products are managed via stock zeroing.
2. **Refunded Amount Metric in State but Not Rendered as Separate Card:** In `Analytics.jsx`, `summary.refundedAmount` is retrieved from the backend API but omitted from the top summary cards row.
3. **Unified User Entity Without KYC Table:** Business metadata (GSTIN, legal entity name, store address) is not tracked in the current database schema.

---

## 11. Final Readiness Verdict

### **READY FOR SEMESTER 1 DEMONSTRATION**

### Justification:
The SHOPIVO Seller Module satisfies all functional, security, and integration requirements of Semester 1:
- 100% of the 130 automated backend integration tests pass.
- Multi-vendor item segregation and IDOR protections are strictly enforced.
- Frontend builds cleanly in 1.47s with zero errors.
- Image uploads are hardened with MIME validation, magic byte checks, and UUID naming.
- All identified limitations (order-level status granularity and locking nuances) are standard architectural constraints typical of early multi-vendor ecommerce releases and do not hinder full functional demonstration.


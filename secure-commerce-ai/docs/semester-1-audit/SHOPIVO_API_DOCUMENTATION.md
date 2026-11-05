# SHOPIVO — REST API INVENTORY & SPECIFICATION
## Comprehensive Endpoints, Security Constraints & Request/Response Models

---

### Global API Specifications
- **Base URI Path**: `http://localhost:8080/api`
- **Default Content Type**: `application/json;charset=UTF-8`
- **Authentication Scheme**: HTTP Bearer Token (`Authorization: Bearer <jwt_token>`)
- **JSON Serialization Rules**: ISO-8601 timestamps, camelCase properties, null values excluded.

---

## 1. Authentication APIs (`/api/auth`)

| Method | Endpoint | Description | Auth | Role | Request Body | Response Summary |
|---|---|---|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user account (Customer or Seller). | None | Public | `RegisterRequest` (email, password, firstName, lastName, role, storeName) | `AuthResponse` (token, user details) [HTTP 201] |
| `POST` | `/api/auth/login` | Authenticate existing user credentials. | None | Public | `LoginRequest` (email, password) | `AuthResponse` (JWT token, user profile, role) [HTTP 200] |

---

## 2. Customer Profile & Addresses (`/api/users`, `/api/addresses`)

| Method | Endpoint | Description | Auth | Role | Request Body / Params | Response Summary |
|---|---|---|---|---|---|---|
| `GET` | `/api/users/profile` | Retrieve profile of the currently authenticated user. | Required | Any | Header token | `UserResponse` (id, email, name, role) |
| `PUT` | `/api/users/profile` | Update profile information (first name, last name, phone). | Required | Any | `UpdateProfileRequest` | `UserResponse` (updated details) |
| `POST` | `/api/users/change-password` | Update account password with BCrypt re-encryption. | Required | Any | `ChangePasswordRequest` (oldPassword, newPassword) | Success message string [HTTP 200] |
| `GET` | `/api/addresses` | List all saved delivery addresses for authenticated customer. | Required | `CUSTOMER` | None | `List<AddressResponse>` |
| `POST` | `/api/addresses` | Add a new shipping address to the customer's address book. | Required | `CUSTOMER` | `AddressRequest` (name, phone, line1, city, state, pin, defaultFlag) | `AddressResponse` [HTTP 201] |
| `PUT` | `/api/addresses/{id}` | Update an existing saved delivery address. | Required | `CUSTOMER` | Path `{id}`, `AddressRequest` | `AddressResponse` |
| `DELETE` | `/api/addresses/{id}` | Delete a saved delivery address. | Required | `CUSTOMER` | Path `{id}` | HTTP 204 No Content |
| `PATCH` | `/api/addresses/{id}/default` | Set a specific address as the primary default address. | Required | `CUSTOMER` | Path `{id}` | `AddressResponse` |

---

## 3. Catalog & Taxonomy APIs (`/api/products`, `/api/categories`)

| Method | Endpoint | Description | Auth | Role | Request Body / Params | Response Summary |
|---|---|---|---|---|---|---|
| `GET` | `/api/products` | Browse approved products with multi-filter and sort options. | None | Public | Query params: `search`, `category`, `minPrice`, `maxPrice`, `sortBy`, `direction`, `page`, `size` | `Page<ProductResponse>` |
| `GET` | `/api/products/{id}` | Retrieve comprehensive product details by ID. | None | Public | Path `{id}` | `ProductResponse` (details, seller, category) |
| `GET` | `/api/categories` | List all product categories in the catalog. | None | Public | None | `List<CategoryResponse>` |
| `GET` | `/api/categories/{id}` | Retrieve category metadata by ID. | None | Public | Path `{id}` | `CategoryResponse` |
| `POST` | `/api/products` | Submit new product for catalog moderation (status `PENDING`). | Required | `SELLER` | `ProductRequest` (name, categoryId, price, stock, description) | `ProductResponse` [HTTP 201] |
| `PUT` | `/api/products/{id}` | Update product pricing, description, or stock. | Required | `SELLER` | Path `{id}`, `ProductRequest` | `ProductResponse` |
| `DELETE` | `/api/products/{id}` | Remove a product from the seller's catalog. | Required | `SELLER` | Path `{id}` | HTTP 204 No Content |
| `POST` | `/api/products/{id}/image` | Secure multi-part product image upload (JPEG, PNG, WEBP, <= 5MB). | Required | `SELLER` | Path `{id}`, `MultipartFile file` | `ProductImageUploadResponse` (imageUrl) [HTTP 200] |

---

## 4. Shopping Cart & Wishlist APIs (`/api/cart`, `/api/wishlist`)

| Method | Endpoint | Description | Auth | Role | Request Body / Params | Response Summary |
|---|---|---|---|---|---|---|
| `GET` | `/api/cart` | Retrieve customer's active shopping cart and subtotal. | Required | `CUSTOMER` | None | `CartResponse` (items, subtotal, totalQuantity) |
| `POST` | `/api/cart/items` | Add product to cart with designated quantity. | Required | `CUSTOMER` | `CartItemRequest` (productId, quantity) | `CartResponse` [HTTP 200] |
| `PUT` | `/api/cart/items/{id}` | Update quantity of a line item in the cart. | Required | `CUSTOMER` | Path `{id}`, `CartItemRequest` (quantity) | `CartResponse` |
| `DELETE` | `/api/cart/items/{id}` | Remove a specific item from the cart. | Required | `CUSTOMER` | Path `{id}` | `CartResponse` |
| `DELETE` | `/api/cart` | Clear all items from the customer's cart. | Required | `CUSTOMER` | None | HTTP 204 No Content |
| `GET` | `/api/wishlist` | Retrieve all items currently in customer's wishlist. | Required | `CUSTOMER` | None | `WishlistResponse` (items) |
| `POST` | `/api/wishlist/toggle/{productId}` | Toggle item on or off the customer's wishlist. | Required | `CUSTOMER` | Path `{productId}` | `WishlistResponse` |
| `DELETE` | `/api/wishlist/items/{productId}` | Remove a product from customer's wishlist. | Required | `CUSTOMER` | Path `{productId}` | `WishlistResponse` |

---

## 5. Orders & Invoices APIs (`/api/orders`)

| Method | Endpoint | Description | Auth | Role | Request Body / Params | Response Summary |
|---|---|---|---|---|---|---|
| `POST` | `/api/orders` | Place new order with atomic stock decrement and address snapshot. | Required | `CUSTOMER` | `OrderRequest` (addressId, couponCode, items) | `OrderResponse` (orderId, total, status `PENDING`) [HTTP 201] |
| `GET` | `/api/orders` | List order history for the authenticated customer. | Required | `CUSTOMER` | Query params: `page`, `size` | `Page<OrderResponse>` |
| `GET` | `/api/orders/{id}` | Retrieve complete order details, item snapshots, and tracking history. | Required | `CUSTOMER` | Path `{id}` | `OrderResponse` |
| `POST` | `/api/orders/{id}/cancel` | Cancel order in `PENDING` or `CONFIRMED` status; restocks inventory. | Required | `CUSTOMER` | Path `{id}`, `CancelOrderRequest` (reason) | `OrderResponse` (status `CANCELLED`) |
| `GET` | `/api/orders/{id}/invoice` | Stream rendered PDF tax invoice generated dynamically via OpenPDF. | Required | `CUSTOMER` | Path `{id}` | `application/pdf` binary stream [HTTP 200] |

---

## 6. Payment & Webhook APIs (`/api/payments`)

| Method | Endpoint | Description | Auth | Role | Request Body / Params | Response Summary |
|---|---|---|---|---|---|---|
| `POST` | `/api/payments/create-gateway-order` | Calculate authoritative order amount in paise and create gateway order. | Required | `CUSTOMER` | `CreateGatewayOrderRequest` (orderId) | `GatewayOrderDto` (providerOrderId, amountInPaise, currency) [HTTP 200] |
| `POST` | `/api/payments/verify-gateway-payment` | Verify HMAC-SHA256 signature and confirm order payment. | Required | `CUSTOMER` | `VerifyPaymentRequest` (orderId, providerOrderId, providerPaymentId, signature) | `PaymentResponse` (status `SUCCESS`) [HTTP 200] |
| `POST` | `/api/payments/cod` | Confirm order placement via Cash on Delivery (zero gateway charges). | Required | `CUSTOMER` | `ProcessCodPaymentRequest` (orderId) | `PaymentResponse` (method `COD`, status `INITIATED`) [HTTP 200] |
| `GET` | `/api/payments/order/{id}` | Retrieve payment status for an order (powers dynamic QR polling). | Required | `CUSTOMER` | Path `{id}` | `PaymentResponse` (status, method, amount) |
| `POST` | `/api/payments/webhook/razorpay` | Public gateway webhook listener with constant-time signature validation. | None | Public | Webhook JSON payload, `X-Razorpay-Signature` header | `Map<String, String>` (`status: ok`) [HTTP 200] |
| `POST` | `/api/payments/process` | Legacy payment simulation endpoint (decommissioned). | Required | Any | Legacy payment request | HTTP 410 GONE |

---

## 7. Returns & Refunds APIs (`/api/returns`)

| Method | Endpoint | Description | Auth | Role | Request Body / Params | Response Summary |
|---|---|---|---|---|---|---|
| `POST` | `/api/returns` | Submit return request for an eligible delivered item. | Required | `CUSTOMER` | `ReturnRequestDto` (orderId, orderItemId, reason, note) | `ReturnResponse` (status `REQUESTED`) [HTTP 201] |
| `GET` | `/api/returns` | List return requests submitted by authenticated customer. | Required | `CUSTOMER` | Query params: `page`, `size` | `Page<ReturnResponse>` |
| `GET` | `/api/returns/refunds` | List all processed refunds and transaction references for customer. | Required | `CUSTOMER` | Query params: `page`, `size` | `Page<RefundResponse>` |
| `GET` | `/api/returns/{id}` | Retrieve details and status of a specific return request. | Required | `CUSTOMER` | Path `{id}` | `ReturnResponse` |

---

## 8. Reviews & Ratings APIs (`/api/reviews`)

| Method | Endpoint | Description | Auth | Role | Request Body / Params | Response Summary |
|---|---|---|---|---|---|---|
| `POST` | `/api/reviews` | Submit verified product review (rating 1-5, review text). | Required | `CUSTOMER` | `ReviewRequest` (productId, rating, reviewText) | `ReviewResponse` [HTTP 201] |
| `GET` | `/api/reviews/product/{productId}` | Retrieve all customer reviews and average rating for a product. | None | Public | Path `{productId}` | `ReviewSummaryResponse` (reviews, avgRating) |
| `GET` | `/api/reviews/eligibility/{productId}` | Check whether current customer is eligible to review product. | Required | `CUSTOMER` | Path `{productId}` | `ReviewEligibilityResponse` (canReview, orderId) |
| `GET` | `/api/reviews/my` | List all reviews submitted by the authenticated customer. | Required | `CUSTOMER` | None | `List<ReviewResponse>` |

---

## 9. Coupons & Promotions APIs (`/api/coupons`)

| Method | Endpoint | Description | Auth | Role | Request Body / Params | Response Summary |
|---|---|---|---|---|---|---|
| `POST` | `/api/coupons/apply` | Validate coupon code against subtotal and return discount amount. | Required | `CUSTOMER` | `ApplyCouponRequest` (code, orderAmount) | `CouponResponse` (code, discountAmount, finalAmount) |
| `GET` | `/api/coupons/active` | List public active discount coupons. | Required | `CUSTOMER` | None | `List<CouponResponse>` |

---

## 10. Notifications APIs (`/api/notifications`)

| Method | Endpoint | Description | Auth | Role | Request Body / Params | Response Summary |
|---|---|---|---|---|---|---|
| `GET` | `/api/notifications` | Retrieve in-app notifications for authenticated user. | Required | Any | Query params: `page`, `size` | `Page<NotificationResponse>` |
| `PUT` | `/api/notifications/{id}/read` | Mark a specific notification as read. | Required | Any | Path `{id}` | HTTP 200 OK |
| `PUT` | `/api/notifications/read-all` | Mark all notifications for current user as read. | Required | Any | None | HTTP 200 OK |

---

## 11. Seller Operations APIs (`/api/seller`)

| Method | Endpoint | Description | Auth | Role | Request Body / Params | Response Summary |
|---|---|---|---|---|---|---|
| `GET` | `/api/seller/orders` | List customer orders containing products sold by this vendor. | Required | `SELLER` | Query params: `status`, `page`, `size` | `Page<SellerOrderResponse>` |
| `GET` | `/api/seller/orders/{id}` | View line items and customer delivery info for seller's order. | Required | `SELLER` | Path `{id}` | `SellerOrderResponse` |
| `PATCH` | `/api/seller/orders/{id}/status` | Update fulfillment status (`CONFIRMED` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED`). | Required | `SELLER` | Path `{id}`, `UpdateOrderStatusRequest` (newStatus) | `SellerOrderResponse` |
| `GET` | `/api/seller/analytics/overview` | High-level metrics: total revenue, completed orders, low stock. | Required | `SELLER` | None | `SellerAnalyticsSummaryResponse` |
| `GET` | `/api/seller/analytics/trends` | 30-day daily sales points for revenue and volume visualization. | Required | `SELLER` | Query param: `days` | `List<DailySalesPoint>` |
| `GET` | `/api/seller/analytics/top-products` | Top-selling products ranked by sales volume and earnings. | Required | `SELLER` | Query param: `limit` | `List<TopSellingProductResponse>` |
| `GET` | `/api/seller/reviews` | Reviews and ratings specifically left on this vendor's catalog. | Required | `SELLER` | None | `SellerReviewSummaryResponse` |

---

## 12. Administrative Governance APIs (`/api/admin`)

| Method | Endpoint | Description | Auth | Role | Request Body / Params | Response Summary |
|---|---|---|---|---|---|---|
| `GET` | `/api/admin/metrics` | System-wide platform metrics (revenue, user counts, order counts). | Required | `ADMIN` | None | `AdminSummaryMetricsResponse` |
| `GET` | `/api/admin/customers` | Paginated list of registered customers with order summary. | Required | `ADMIN` | Query params: `page`, `size`, `search` | `Page<AdminUserListItemResponse>` |
| `GET` | `/api/admin/users/{id}` | Detailed account history, orders, and activity for a user. | Required | `ADMIN` | Path `{id}` | `AdminUserDetailResponse` |
| `PATCH` | `/api/admin/users/{id}/status` | Suspend or activate a user account (`enabled` = true/false). | Required | `ADMIN` | Path `{id}`, `UpdateUserStatusRequest` (enabled) | `AdminUserListItemResponse` |
| `GET` | `/api/admin/sellers` | Paginated directory of vendors with verification and sales data. | Required | `ADMIN` | Query params: `status`, `page`, `size` | `Page<AdminSellerListItemResponse>` |
| `GET` | `/api/admin/sellers/{id}` | Deep inspection of vendor profile, products, and store performance. | Required | `ADMIN` | Path `{id}` | `AdminSellerDetailResponse` |
| `PATCH` | `/api/admin/sellers/{id}/verify` | Approve or reject seller verification status. | Required | `ADMIN` | Path `{id}`, `VerifySellerRequest` (status, reason) | `AdminSellerListItemResponse` |
| `GET` | `/api/admin/products/pending` | List products awaiting administrative moderation approval. | Required | `ADMIN` | None | `List<ProductResponse>` |
| `PATCH` | `/api/admin/products/{id}/approve` | Approve product to be published to customer marketplace. | Required | `ADMIN` | Path `{id}` | `ProductResponse` (status `APPROVED`) |
| `PATCH` | `/api/admin/products/{id}/reject` | Reject product and provide feedback to vendor. | Required | `ADMIN` | Path `{id}`, `RejectProductRequest` (reason) | `ProductResponse` (status `REJECTED`) |
| `GET` | `/api/admin/orders` | Global order ledger across all sellers on the platform. | Required | `ADMIN` | Query params: `status`, `page`, `size` | `Page<OrderResponse>` |
| `GET` | `/api/admin/orders/{id}` | Detailed platform order view with full line item and seller audit. | Required | `ADMIN` | Path `{id}` | `OrderResponse` |
| `PATCH` | `/api/admin/orders/{id}/status` | Administrative override of order status. | Required | `ADMIN` | Path `{id}`, `UpdateOrderStatusRequest` (newStatus) | `OrderResponse` |
| `GET` | `/api/admin/payments` | Financial audit ledger of all platform payments and methods. | Required | `ADMIN` | Query params: `page`, `size` | `Page<PaymentResponse>` |
| `GET` | `/api/admin/reviews` | System-wide review log for platform moderation. | Required | `ADMIN` | Query params: `page`, `size` | `Page<ReviewResponse>` |
| `DELETE` | `/api/admin/reviews/{id}` | Remove fraudulent, abusive, or spam review from platform. | Required | `ADMIN` | Path `{id}` | HTTP 204 No Content |
| `GET` | `/api/admin/events` | Passive transactional and user event audit log. | Required | `ADMIN` | Query params: `page`, `size` | `Page<UserEventResponse>` |
| `GET` | `/api/admin/reports` | Platform operational summary reports (sales, category share). | Required | `ADMIN` | Query params: `from`, `to` | `PlatformReportResponse` |

---

## 13. System Health & Public Root APIs

| Method | Endpoint | Description | Auth | Role | Response Summary |
|---|---|---|---|---|---|
| `GET` | `/api` | Root browser status check returning platform identity banner. | None | Public | String: `SecureCommerce Platform API is running.` |
| `GET` | `/api/actuator/health` | Spring Boot Actuator application health indicator. | None | Public | JSON: `{"status": "UP"}` [HTTP 200] |
| `GET` | `/uploads/products/{fileName}` | Static resource handler serving uploaded product imagery. | None | Public | Binary image file (`image/jpeg`, `image/png`, `image/webp`) [HTTP 200] |


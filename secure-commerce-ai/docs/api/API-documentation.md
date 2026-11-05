# REST API Specification Reference

**Project**: SHOPIVO — A New Era of Shopping  
**Base URL**: `http://localhost:8080/api`  
**Authentication**: HTTP Header `Authorization: Bearer <JWT>`  
**Response Envelope**: Standard `ApiResponse<T>` JSON  

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2026-09-19T00:00:00Z"
}
```

---

## 1. Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Role | Purpose | Parameters / Body |
|:---|:---|:---:|:---|:---|
| `POST` | `/auth/register` | Public | Register customer or seller account | Body: `email`, `password`, `firstName`, `lastName`, `role` (`CUSTOMER` or `SELLER`) |
| `POST` | `/auth/login` | Public | Authenticate user and issue JWT | Body: `email`, `password` |
| `GET` | `/auth/me` | Authenticated | Retrieve profile of authenticated caller | Header: `Authorization: Bearer <token>` |

---

## 2. Customer Endpoints

### 2.1 Catalog & Browsing
| Method | Endpoint | Role | Purpose | Parameters / Body |
|:---|:---|:---:|:---|:---|
| `GET` | `/products` | Public | Browse approved products | Query: `page` (default 0), `size` (default 12), `categoryId`, `search` |
| `GET` | `/products/{id}` | Public | Single product details | Path: `id` (Returns `404` if not `APPROVED`) |
| `GET` | `/categories` | Public | Category taxonomy list | None |
| `GET` | `/reviews/product/{id}` | Public | Rating breakdown & verified reviews | Path: `id` |

### 2.2 Cart & Wishlist
| Method | Endpoint | Role | Purpose | Parameters / Body |
|:---|:---|:---:|:---|:---|
| `GET` | `/cart` | `CUSTOMER` | View cart with live subtotal | None |
| `POST` | `/cart/items` | `CUSTOMER` | Add product to cart | Body: `productId`, `quantity` |
| `PUT` | `/cart/items/{itemId}` | `CUSTOMER` | Update quantity (0 = remove) | Path: `itemId`, Query: `quantity` |
| `DELETE` | `/cart/items/{itemId}` | `CUSTOMER` | Remove item from cart | Path: `itemId` |
| `DELETE` | `/cart` | `CUSTOMER` | Clear entire cart | None |
| `GET` | `/wishlist` | `CUSTOMER` | View saved wishlist | None |
| `POST` | `/wishlist/items` | `CUSTOMER` | Add product to wishlist | Query: `productId` |
| `DELETE` | `/wishlist/items/{itemId}` | `CUSTOMER` | Remove from wishlist | Path: `itemId` |
| `POST` | `/wishlist/items/{itemId}/move-to-cart` | `CUSTOMER` | Transfer wishlist item to cart | Path: `itemId` |

### 2.3 Addresses
| Method | Endpoint | Role | Purpose | Parameters / Body |
|:---|:---|:---:|:---|:---|
| `GET` | `/addresses` | `CUSTOMER` | List saved shipping addresses | None |
| `POST` | `/addresses` | `CUSTOMER` | Create shipping address | Body: `fullName`, `phone`, `line1`, `line2`, `city`, `state`, `postalCode`, `country`, `isDefault` |
| `PUT` | `/addresses/{id}` | `CUSTOMER` | Update shipping address | Path: `id`, Body: address fields |
| `DELETE` | `/addresses/{id}` | `CUSTOMER` | Delete shipping address | Path: `id` |

### 2.4 Checkout & Orders
| Method | Endpoint | Role | Purpose | Parameters / Body |
|:---|:---|:---:|:---|:---|
| `POST` | `/orders` | `CUSTOMER` | Place order (atomic stock decrement) | Body: `addressId`, `couponCode` (optional) |
| `GET` | `/orders/mine` | `CUSTOMER` | View customer order history | None |
| `GET` | `/orders/{id}` | `CUSTOMER` / `ADMIN` | Order details with timeline | Path: `id` |
| `PATCH` | `/orders/{id}/cancel` | `CUSTOMER` / `ADMIN` | Cancel unfulfilled order (restocks) | Path: `id`, Body: `reason` (optional) |
| `GET` | `/orders/{id}/invoice` | `CUSTOMER` / `ADMIN` | Download invoice PDF stream | Path: `id` |

### 2.5 Payments, Coupons, Returns & Notifications
| Method | Endpoint | Role | Purpose | Parameters / Body |
|:---|:---|:---:|:---|:---|
| `POST` | `/payments/process` | `CUSTOMER` | Sandbox payment execution | Body: `orderId`, `paymentMethod` (`CARD`/`UPI`), `cardNumber`, `simulateFailure` |
| `GET` | `/payments/mine` | `CUSTOMER` | Customer payment history | None |
| `POST` | `/coupons/validate` | `CUSTOMER` | Validate coupon against cart | Body: `code` |
| `GET` | `/coupons/available` | `CUSTOMER` | Active coupons for checkout | None |
| `POST` | `/returns` | `CUSTOMER` | Submit return request | Body: `orderId`, `orderItemId`, `reason` |
| `POST` | `/returns/{id}/approve-sandbox` | `CUSTOMER` | Instant sandbox return refund | Path: `id` |
| `GET` | `/returns/mine` | `CUSTOMER` | Customer return requests | None |
| `GET` | `/returns/refunds/mine` | `CUSTOMER` | Customer refund history | None |
| `GET` | `/notifications` | `CUSTOMER` | Notification inbox | None |
| `PATCH` | `/notifications/{id}/read` | `CUSTOMER` | Mark notification as read | Path: `id` |

---

## 3. Seller Endpoints (`/api/seller`)

### 3.1 Catalog & Inventory Management
| Method | Endpoint | Role | Purpose | Parameters / Body |
|:---|:---|:---:|:---|:---|
| `GET` | `/seller/products` | `SELLER` | List seller's own products | None |
| `POST` | `/seller/products` | `SELLER` | Submit product (status: PENDING) | Body: `name`, `description`, `price`, `stockQuantity`, `imageUrl`, `categoryId` |
| `PUT` | `/seller/products/{id}` | `SELLER` | Update product (resets to PENDING) | Path: `id`, Body: product fields |
| `PATCH` | `/seller/products/{id}/stock` | `SELLER` | Inline stock adjustment (preserves APPROVED) | Path: `id`, Body: `stockQuantity` |

### 3.2 Seller Order Fulfillment
| Method | Endpoint | Role | Purpose | Parameters / Body |
|:---|:---|:---:|:---|:---|
| `GET` | `/seller/orders` | `SELLER` | **Canonical**: List orders with seller items | None |
| `GET` | `/seller/orders/{id}` | `SELLER` | Scoped order detail (strictly seller items) | Path: `id` |
| `PATCH` | `/seller/orders/{id}/status` | `SELLER` | Advance fulfillment state | Path: `id`, Body: `status` (`CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`) |
| `GET` | `/orders/seller` | `SELLER` | **@Deprecated**: Legacy seller order list | Use `/seller/orders` instead |

### 3.3 Seller Sales Analytics
| Method | Endpoint | Role | Purpose | Parameters / Body |
|:---|:---|:---:|:---|:---|
| `GET` | `/seller/analytics/summary` | `SELLER` | High-level sales performance | Query: `range` (`7d`, `30d`, `all`) |
| `GET` | `/seller/analytics/sales` | `SELLER` | Daily sales chart time-series | Query: `range` (`7d`, `30d`, `all`) |
| `GET` | `/seller/analytics/top-products` | `SELLER` | Top performing products ranking | Query: `range`, `limit` (default 5) |

---

## 4. Admin Endpoints (`/api/admin`)

### 4.1 Product Moderation
| Method | Endpoint | Role | Purpose | Parameters / Body |
|:---|:---|:---:|:---|:---|
| `GET` | `/admin/products` | `ADMIN` | Catalog moderation search & filter | Query: `status` (`PENDING`, `APPROVED`, `REJECTED`), `search` |
| `PUT` | `/admin/products/{id}/approve` | `ADMIN` | Approve listing for marketplace | Path: `id` |
| `PUT` | `/admin/products/{id}/reject` | `ADMIN` | Reject listing with reason | Path: `id`, Body: `reason` |

### 4.2 Platform Order Management
| Method | Endpoint | Role | Purpose | Parameters / Body |
|:---|:---|:---:|:---|:---|
| `GET` | `/admin/orders` | `ADMIN` | **Canonical**: Paged platform orders | Query: `status`, `paymentStatus`, `search`, `page`, `size` |
| `GET` | `/admin/orders/{id}` | `ADMIN` | Complete platform view of order | Path: `id` |
| `PATCH` | `/admin/orders/{id}/status` | `ADMIN` | Advance/adjust fulfillment state | Path: `id`, Body: `status` |
| `PATCH` | `/admin/orders/{id}/cancel` | `ADMIN` | Admin cancellation with restock | Path: `id`, Body: `reason` |
| `GET` | `/admin/orders/metrics` | `ADMIN` | Fulfillment metrics summary | None |
| `GET` | `/orders/admin` | `ADMIN` | **@Deprecated**: Legacy unpaged admin orders | Use `/admin/orders` instead |

### 4.3 User & Seller Governance
| Method | Endpoint | Role | Purpose | Parameters / Body |
|:---|:---|:---:|:---|:---|
| `GET` | `/admin/users` | `ADMIN` | Paged user directory | Query: `role` (`CUSTOMER`, `SELLER`, `ADMIN`), `status`, `search`, `page`, `size` |
| `GET` | `/admin/users/{id}` | `ADMIN` | Safe user profile inspection | Path: `id` (Password hash omitted) |
| `PATCH` | `/admin/users/{id}/suspend` | `ADMIN` | Suspend user account | Path: `id` (Safeguards against self-lockout & last admin lockout) |
| `PATCH` | `/admin/users/{id}/activate` | `ADMIN` | Activate user account | Path: `id` |
| `GET` | `/admin/users/metrics` | `ADMIN` | User ecosystem counts | None |
| `GET` | `/admin/sellers` | `ADMIN` | Paged seller directory | Query: `status`, `search`, `page`, `size` |
| `GET` | `/admin/sellers/{id}` | `ADMIN` | Deep seller operational profile | Path: `id` |
| `PATCH` | `/admin/sellers/{id}/suspend` | `ADMIN` | Suspend seller account | Path: `id` |
| `PATCH` | `/admin/sellers/{id}/activate` | `ADMIN` | Activate seller account | Path: `id` |

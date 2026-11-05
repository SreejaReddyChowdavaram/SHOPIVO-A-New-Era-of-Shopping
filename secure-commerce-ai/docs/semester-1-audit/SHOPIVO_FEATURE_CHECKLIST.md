# SHOPIVO — COMPREHENSIVE FEATURE STATUS CHECKLIST
## Semester 1 Verification Matrix: Customer, Seller, and Admin Modules

---

### Status Definitions
- **COMPLETE**: Code implemented, verified via automated integration tests, and manually/operationally validated end-to-end.
- **IMPLEMENTED**: Code exists and is unit/integration tested, but depends on live external third-party production credentials for final real-world operation.
- **PARTIAL**: Substantial implementation exists, but some secondary edge cases or non-critical views remain unlinked.
- **NOT IMPLEMENTED**: Feature not part of Semester 1 or no implementation found.
- **NOT VERIFIED**: Cannot conclusively determine runtime status without additional live infrastructure.

---

## 1. Customer Module Features (34 Features)

| # | Feature Name | Description & Customer Workflow | Frontend Component | Backend Service & Controller | API Endpoints | Database Tables | Status |
|---|---|---|---|---|---|---|---|
| 1 | **Customer Registration** | New customer registers with name, email, password, and default role `CUSTOMER`. | `Register.jsx` | `AuthServiceImpl`, `AuthController` | `POST /api/auth/register` | `users` | **COMPLETE** |
| 2 | **Customer Login** | Authenticates customer credentials and returns JWT bearer token + user profile. | `Login.jsx` | `AuthServiceImpl`, `AuthController` | `POST /api/auth/login` | `users` | **COMPLETE** |
| 3 | **JWT Authentication** | Client stores token in localStorage and attaches `Authorization: Bearer <token>` via Axios interceptors. | `api.js`, `authSlice.js` | `JwtAuthFilter`, `JwtUtil` | All protected endpoints | N/A (Stateless) | **COMPLETE** |
| 4 | **Customer Dashboard** | Account overview showing recent orders, active returns, profile shortcut, and quick links. | `customer/Dashboard.jsx` | `OrderServiceImpl`, `ReturnServiceImpl` | `GET /api/orders`, `GET /api/returns` | `orders`, `returns` | **COMPLETE** |
| 5 | **Product Browsing** | High-density marketplace catalog displaying approved products with images, price, and vendor name. | `customer/Products.jsx`, `ProductCard.jsx` | `ProductServiceImpl`, `ProductController` | `GET /api/products` | `products`, `categories`, `users` | **COMPLETE** |
| 6 | **Product Search** | Real-time text search across product names and descriptions with debounced input. | `Products.jsx`, `Navbar.jsx` | `ProductServiceImpl`, `ProductController` | `GET /api/products?search={q}` | `products` | **COMPLETE** |
| 7 | **Product Filtering** | Category pills, price range sliders, and in-stock toggles to narrow down catalog. | `Products.jsx` | `ProductServiceImpl`, `ProductController` | `GET /api/products?category={id}&minPrice={min}&maxPrice={max}` | `products`, `categories` | **COMPLETE** |
| 8 | **Product Sorting** | Sort by price (low to high, high to low), newest additions, and customer ratings. | `Products.jsx` | `ProductServiceImpl`, `ProductController` | `GET /api/products?sortBy={field}&direction={asc\|desc}` | `products` | **COMPLETE** |
| 9 | **Product Details** | Comprehensive product page with high-res image, description, seller info, stock status, and reviews. | `customer/ProductDetails.jsx` | `ProductServiceImpl`, `ProductController` | `GET /api/products/{id}` | `products`, `categories`, `users` | **COMPLETE** |
| 10 | **Product Availability** | Live stock quantity check preventing customers from adding out-of-stock items to cart. | `ProductDetails.jsx`, `Cart.jsx` | `ProductServiceImpl`, `CartServiceImpl` | `GET /api/products/{id}` | `products` | **COMPLETE** |
| 11 | **Shopping Cart** | Persistent cart aggregating items from multiple vendors into a unified customer basket. | `customer/Cart.jsx` | `CartServiceImpl`, `CartController` | `GET /api/cart` | `carts`, `cart_items`, `products` | **COMPLETE** |
| 12 | **Add to Cart** | Adds designated quantity of an approved in-stock product to the customer's cart. | `ProductCard.jsx`, `ProductDetails.jsx` | `CartServiceImpl`, `CartController` | `POST /api/cart/items` | `carts`, `cart_items` | **COMPLETE** |
| 13 | **Update Cart Quantity** | Increment or decrement item quantity directly in the cart with live subtotal recomputation. | `customer/Cart.jsx` | `CartServiceImpl`, `CartController` | `PUT /api/cart/items/{id}` | `cart_items` | **COMPLETE** |
| 14 | **Remove Cart Items** | Deletes an item from the cart and automatically updates the cart total and item badge. | `customer/Cart.jsx` | `CartServiceImpl`, `CartController` | `DELETE /api/cart/items/{id}` | `cart_items` | **COMPLETE** |
| 15 | **Wishlist Management** | Save favorite products for later purchase; toggle products on/off wishlist with heart icon. | `customer/Wishlist.jsx` | `WishlistServiceImpl`, `WishlistController` | `GET /api/wishlist`, `POST /api/wishlist/toggle/{productId}` | `wishlists`, `wishlist_items` | **COMPLETE** |
| 16 | **Checkout Flow** | Multi-step checkout: select/add delivery address, apply coupon, choose payment method, review order. | `customer/Checkout.jsx` | `OrderServiceImpl`, `OrderController` | `POST /api/orders` | `orders`, `order_items`, `addresses` | **COMPLETE** |
| 17 | **Address Management** | Save multiple delivery addresses (Home, Work), select active shipping address, add new address. | `Checkout.jsx`, `AccountLayout.jsx` | `AddressServiceImpl`, `AddressController` | `GET /api/addresses`, `POST /api/addresses`, `DELETE /api/addresses/{id}` | `addresses` | **COMPLETE** |
| 18 | **Payment Selection** | Clear selection between Option A (Online Payment: UPI, Cards, Net Banking) and Option B (COD). | `customer/Checkout.jsx` | `PaymentServiceImpl`, `PaymentController` | `POST /api/payments/create-gateway-order` | `orders`, `payments` | **COMPLETE** |
| 19 | **Dynamic UPI QR Payment** | Generates dynamic UPI QR code on checkout with exact payable amount, countdown timer, and polling. | `DynamicUpiQrModal.jsx` | `PaymentServiceImpl`, `PaymentGatewayService` | `GET /api/payments/order/{id}` | `payments`, `orders` | **COMPLETE** |
| 20 | **Razorpay Checkout SDK** | Launches official Razorpay Standard Checkout modal when running in genuine test mode credentials. | `Checkout.jsx` | `RazorpayPaymentGatewayService` | `POST /api/payments/verify-gateway-payment` | `payments`, `orders` | **IMPLEMENTED** |
| 21 | **Cash on Delivery (COD)** | Place order with zero online payment; payment status marked `INITIATED` and payable on delivery. | `Checkout.jsx` | `PaymentServiceImpl`, `PaymentController` | `POST /api/payments/cod` | `orders`, `payments` | **COMPLETE** |
| 22 | **Order Placement** | Atomic order generation with database-level inventory decrement and immutable address snapshot. | `Checkout.jsx` | `OrderServiceImpl`, `OrderController` | `POST /api/orders` | `orders`, `order_items`, `products` | **COMPLETE** |
| 23 | **Order History** | List past and present customer orders with status badges, date, item thumbnails, and total amount. | `customer/Orders.jsx` | `OrderServiceImpl`, `OrderController` | `GET /api/orders` | `orders`, `order_items` | **COMPLETE** |
| 24 | **Order Tracking** | Visual timeline displaying progression: `PENDING` → `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED`. | `customer/OrderDetails.jsx` | `OrderServiceImpl`, `OrderController` | `GET /api/orders/{id}` | `orders`, `order_items` | **COMPLETE** |
| 25 | **Order Cancellation** | Customer can cancel `PENDING` or `CONFIRMED` orders; automatically restores product stock. | `customer/OrderDetails.jsx` | `OrderServiceImpl`, `OrderController` | `POST /api/orders/{id}/cancel` | `orders`, `products` | **COMPLETE** |
| 26 | **Product Returns** | Request return on `DELIVERED` orders with reason and notes within return policy window. | `customer/Returns.jsx`, `OrderDetails.jsx` | `ReturnServiceImpl`, `ReturnController` | `POST /api/returns` | `return_requests`, `orders` | **COMPLETE** |
| 27 | **Customer Refunds** | View approved refund status and gateway transaction reference back to original payment source. | `customer/Refunds.jsx` | `ReturnServiceImpl`, `ReturnController` | `GET /api/returns/refunds` | `refunds`, `payments` | **COMPLETE** |
| 28 | **Product Reviews** | Submit verified reviews with star ratings (1–5) and feedback text after receiving delivery. | `customer/Reviews.jsx`, `ProductDetails.jsx` | `ReviewServiceImpl`, `ReviewController` | `POST /api/reviews` | `reviews`, `orders` | **COMPLETE** |
| 29 | **Product Ratings Summary** | Aggregate rating score and distribution count displayed on product cards and details. | `ProductCard.jsx`, `ProductDetails.jsx` | `ReviewServiceImpl`, `ReviewController` | `GET /api/reviews/product/{id}` | `reviews` | **COMPLETE** |
| 30 | **Coupons & Discounts** | Validate coupon code (`WELCOME10`, `FESTIVE20`, `SAVE500`) and apply percentage/fixed discount. | `customer/Checkout.jsx` | `CouponServiceImpl`, `CouponController` | `POST /api/coupons/apply` | `coupons`, `coupon_usages` | **COMPLETE** |
| 31 | **Customer Notifications** | In-app alerts for order placement, shipment updates, return approval, and promotional messages. | `customer/Notifications.jsx` | `NotificationServiceImpl`, `NotificationController` | `GET /api/notifications`, `PUT /api/notifications/{id}/read` | `notifications` | **COMPLETE** |
| 32 | **PDF Invoice Generation** | Download professional PDF tax invoice with order summary, line items, and VAT/GST details. | `customer/OrderDetails.jsx` | `OrderServiceImpl`, `OrderController` | `GET /api/orders/{id}/invoice` | `orders`, `order_items` | **COMPLETE** |
| 33 | **Customer Profile** | Edit personal details (name, phone) and view registered account metadata. | `customer/Profile.jsx` | `UserServiceImpl`, `UserController` | `GET /api/users/profile`, `PUT /api/users/profile` | `users` | **COMPLETE** |
| 34 | **Password Security** | Change password with current password verification and BCrypt re-hashing (cost 12). | `customer/Profile.jsx` | `UserServiceImpl`, `UserController` | `POST /api/users/change-password` | `users` | **COMPLETE** |

---

## 2. Seller Module Features (20 Features)

| # | Feature Name | Description & Seller Workflow | Frontend Component | Backend Service & Controller | API Endpoints | Database Tables | Status |
|---|---|---|---|---|---|---|---|
| 1 | **Seller Registration** | Vendor registers with store name, business email, phone, and role `SELLER`. | `Register.jsx` | `AuthServiceImpl`, `AuthController` | `POST /api/auth/register` | `users` | **COMPLETE** |
| 2 | **Seller Login** | Authenticates seller and redirects directly to `/seller/dashboard`. | `Login.jsx` | `AuthServiceImpl`, `AuthController` | `POST /api/auth/login` | `users` | **COMPLETE** |
| 3 | **Seller Dashboard** | Overview of store performance, total revenue, pending orders, and low-stock alerts. | `seller/Dashboard.jsx` | `SellerAnalyticsServiceImpl`, `SellerAnalyticsController` | `GET /api/seller/analytics/overview` | `products`, `order_items`, `orders` | **COMPLETE** |
| 4 | **Seller Profile** | Manage seller store profile, business contact details, and account preferences. | `seller/Profile.jsx` | `UserServiceImpl`, `UserController` | `GET /api/users/profile`, `PUT /api/users/profile` | `users` | **COMPLETE** |
| 5 | **Seller Verification Status** | Displays store badge and account verification status (`PENDING`, `VERIFIED`, `REJECTED`). | `seller/Profile.jsx`, `Dashboard.jsx` | `UserServiceImpl`, `AdminUserServiceImpl` | `GET /api/users/profile` | `users` | **COMPLETE** |
| 6 | **Product Creation** | Create new catalog product with name, category, price, stock, description, and status `PENDING`. | `seller/AddProduct.jsx` | `ProductServiceImpl`, `ProductController` | `POST /api/products` | `products`, `categories` | **COMPLETE** |
| 7 | **Product Editing** | Modify price, description, and stock quantity for seller's own products. | `seller/EditProduct.jsx` | `ProductServiceImpl`, `ProductController` | `PUT /api/products/{id}` | `products` | **COMPLETE** |
| 8 | **Product Deletion** | Remove un-ordered products from seller catalog or mark inactive. | `seller/Products.jsx` | `ProductServiceImpl`, `ProductController` | `DELETE /api/products/{id}` | `products` | **COMPLETE** |
| 9 | **Product Image Upload** | Dedicated multi-part file upload supporting JPEG, PNG, WEBP with 5 MB maximum limit. | `ProductImageSelector.jsx`, `AddProduct.jsx` | `ProductImageStorageService`, `ProductController` | `POST /api/products/{id}/image` | `products` | **COMPLETE** |
| 10 | **Image Validation** | Rigorous inspection of file extensions, MIME headers, and magic byte signatures on disk. | `ProductImageStorageService.java` | `ProductImageStorageService` | Server-side validation pipeline | File System | **COMPLETE** |
| 11 | **Product Inventory Tracking** | Real-time overview of current stock levels across all listed products. | `seller/Inventory.jsx` | `ProductServiceImpl`, `ProductController` | `GET /api/seller/products` | `products` | **COMPLETE** |
| 12 | **Stock Quantity Management** | Quick inline stock adjustment to restock inventory or set promotional inventory levels. | `seller/Inventory.jsx` | `ProductServiceImpl`, `ProductController` | `PATCH /api/seller/products/{id}/stock` | `products` | **COMPLETE** |
| 13 | **Seller Order Management** | View orders containing products sold by this specific seller; isolated from other vendors. | `seller/Orders.jsx` | `SellerOrderServiceImpl`, `SellerOrderController` | `GET /api/seller/orders` | `orders`, `order_items` | **COMPLETE** |
| 14 | **Order Fulfillment Flow** | Step-by-step dispatch workflow: `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED`. | `seller/OrderDetails.jsx` | `SellerOrderServiceImpl`, `SellerOrderController` | `PATCH /api/seller/orders/{id}/status` | `orders`, `notifications` | **COMPLETE** |
| 15 | **Order Status Updates** | Automatic customer notification dispatch upon seller changing shipment status. | `seller/OrderDetails.jsx` | `NotificationServiceImpl` | Triggered via Order status update | `notifications` | **COMPLETE** |
| 16 | **Sales Analytics** | Interactive charts (Recharts) showing daily revenue trends and order counts over 30 days. | `seller/Analytics.jsx` | `SellerAnalyticsServiceImpl`, `SellerAnalyticsController` | `GET /api/seller/analytics/trends` | `order_items`, `orders` | **COMPLETE** |
| 17 | **Revenue Breakdown** | Detailed monetary accounting of gross sales, completed orders, and net earnings. | `seller/Analytics.jsx` | `SellerAnalyticsServiceImpl` | `GET /api/seller/analytics/summary` | `order_items`, `orders` | **COMPLETE** |
| 18 | **Product Review Oversight** | View customer ratings and feedback left specifically on products owned by this seller. | `seller/Reviews.jsx` | `ReviewServiceImpl`, `ReviewController` | `GET /api/seller/reviews` | `reviews`, `products` | **COMPLETE** |
| 19 | **Seller Notifications** | Alerts when a customer places an order for the seller's product or returns are requested. | `seller/Notifications.jsx` | `NotificationServiceImpl`, `NotificationController` | `GET /api/notifications` | `notifications` | **COMPLETE** |
| 20 | **Seller Account Isolation** | Database and controller-level security checks preventing sellers from seeing other vendors' orders. | Backend `@PreAuthorize` & JPA queries | `SellerOrderServiceImpl`, `ProductServiceImpl` | All `/api/seller/**` endpoints | `users`, `products`, `orders` | **COMPLETE** |

---

## 3. Admin Module Features (16 Features)

| # | Feature Name | Description & Admin Workflow | Frontend Component | Backend Service & Controller | API Endpoints | Database Tables | Status |
|---|---|---|---|---|---|---|---|
| 1 | **Admin Login** | Secure administrative sign-in with elevated `ADMIN` role privileges. | `Login.jsx` | `AuthServiceImpl`, `AuthController` | `POST /api/auth/login` | `users` | **COMPLETE** |
| 2 | **Admin Dashboard** | High-level metrics: total platform revenue, total customers, active sellers, pending approvals. | `admin/Dashboard.jsx` | `AdminUserServiceImpl`, `AdminOrderServiceImpl` | `GET /api/admin/metrics` | `users`, `orders`, `products` | **COMPLETE** |
| 3 | **Customer Management** | Search, inspect, view order history, and suspend/reactivate customer accounts. | `admin/Customers.jsx` | `AdminUserServiceImpl`, `AdminUserController` | `GET /api/admin/customers`, `PATCH /api/admin/users/{id}/status` | `users`, `orders` | **COMPLETE** |
| 4 | **Seller Directory** | View all registered vendors, store profiles, performance summaries, and product counts. | `admin/Sellers.jsx`, `SellerDetails.jsx` | `AdminUserServiceImpl`, `AdminSellerController` | `GET /api/admin/sellers`, `GET /api/admin/sellers/{id}` | `users`, `products` | **COMPLETE** |
| 5 | **Seller Verification** | Review onboarding documents, approve or reject seller applications. | `admin/SellerVerification.jsx` | `AdminUserServiceImpl`, `AdminSellerController` | `PATCH /api/admin/sellers/{id}/verify` | `users` | **COMPLETE** |
| 6 | **Product Moderation** | Inspect unapproved products (`PENDING`) submitted by vendors before public marketplace listing. | `admin/Products.jsx` | `ProductServiceImpl`, `ProductController` | `GET /api/admin/products/pending` | `products` | **COMPLETE** |
| 7 | **Product Approval/Rejection** | One-click approval to publish; rejection requires mandatory explanatory reason sent to seller. | `admin/Products.jsx` | `ProductServiceImpl`, `ProductController` | `PATCH /api/admin/products/{id}/approve`, `reject` | `products`, `notifications` | **COMPLETE** |
| 8 | **Platform Order Oversight** | Global view of all platform orders across all sellers, filterable by status, date, or customer. | `admin/Orders.jsx`, `OrderDetails.jsx` | `AdminOrderServiceImpl`, `AdminOrderController` | `GET /api/admin/orders`, `GET /api/admin/orders/{id}` | `orders`, `order_items` | **COMPLETE** |
| 9 | **Payment Audit Log** | Comprehensive ledger of all gateway transactions, payment methods, transaction IDs, and COD logs. | `admin/Payments.jsx` | `PaymentServiceImpl`, `AdminPaymentController` | `GET /api/admin/payments` | `payments`, `orders` | **COMPLETE** |
| 10 | **Global Inventory Oversight** | Platform-wide inventory dashboard identifying out-of-stock items and vendor supply bottlenecks. | `admin/Inventory.jsx` | `ProductServiceImpl`, `ProductController` | `GET /api/admin/inventory` | `products`, `users` | **COMPLETE** |
| 11 | **Review Moderation** | Inspect customer reviews across platform; delete abusive, spam, or inappropriate reviews. | `admin/Reviews.jsx` | `ReviewServiceImpl`, `AdminReviewController` | `GET /api/admin/reviews`, `DELETE /api/admin/reviews/{id}` | `reviews` | **COMPLETE** |
| 12 | **Platform Analytics** | Visual data aggregation on GMV (Gross Merchandise Value), order volumes, and vendor growth. | `admin/Analytics.jsx` | `AdminUserServiceImpl`, `AdminOrderServiceImpl` | `GET /api/admin/analytics` | `orders`, `users` | **COMPLETE** |
| 13 | **System Reports** | Exportable operational reports on sales performance, category share, and customer acquisition. | `admin/Reports.jsx` | `AdminOrderServiceImpl` | `GET /api/admin/reports` | `orders`, `products` | **COMPLETE** |
| 14 | **Admin Notifications** | Alerts on high-value transactions, disputed returns, and new vendor registrations. | `admin/Notifications.jsx` | `NotificationServiceImpl`, `NotificationController` | `GET /api/notifications` | `notifications` | **COMPLETE** |
| 15 | **Admin Profile** | Manage system administrator credentials and security preferences. | `admin/Profile.jsx` | `UserServiceImpl`, `UserController` | `GET /api/users/profile` | `users` | **COMPLETE** |
| 16 | **Role-Based Access Control** | URL-level and method-level security ensuring non-admins receive 403 FORBIDDEN on all admin routes. | `SecurityConfig.java`, `RoleRoute.jsx` | Spring Security Filter Chain | All `/api/admin/**` endpoints | `users` | **COMPLETE** |


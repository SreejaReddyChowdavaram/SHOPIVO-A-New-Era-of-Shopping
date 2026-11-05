# Security Model & Access Control Documentation

**Project**: SHOPIVO — A New Era of Shopping  
**Scope**: Implemented Semester 1 Security Architecture  

---

## 1. Authentication & Credential Security

### 1.1 Password Storage
- Plain-text passwords are never stored or logged.
- Passwords are salted and hashed using `BCryptPasswordEncoder` with a work factor of **12** in `SecurityConfig`.
- BCrypt's adaptive hashing algorithm prevents rainbow-table and brute-force attacks.

### 1.2 Stateless JWT Issuance & Verification
- Tokens are issued upon successful credential verification in `AuthService.login()`.
- Tokens are signed with **HMAC-SHA256** using a high-entropy secret key (`JWT_SECRET`).
- Tokens contain:
  - Subject (`sub`): User ID.
  - Role claim (`role`): `CUSTOMER`, `SELLER`, or `ADMIN`.
  - Issued At (`iat`) and Expiration (`exp`).
- Validation occurs on every request via `JwtAuthFilter`:
  ```java
  if (StringUtils.hasText(token) && jwtUtil.validateToken(token)) {
      Long userId = jwtUtil.extractUserId(token);
      User user = userRepository.findById(userId).orElse(null);
      if (user != null && user.isEnabled()) {
          // Grant ROLE_<role> authority and set SecurityContextHolder
      }
  }
  ```

---

## 2. Server-Side Identity vs. Client-Supplied IDs

A core security principle of Shopivo is **authoritative server-side identity injection**:
- Authenticated endpoints **never** accept or trust a `userId`, `sellerId`, or `customerId` parameter supplied by the frontend in request bodies or query parameters.
- Identity is injected exclusively by Spring Security using `@AuthenticationPrincipal User currentUser`.
- Example from `CartController.java`:
  ```java
  @GetMapping
  public ResponseEntity<ApiResponse<CartResponse>> getCart(
          @AuthenticationPrincipal User currentUser) {
      CartResponse cart = cartService.getCart(currentUser.getId());
      return ResponseEntity.ok(ApiResponse.success("Cart retrieved", cart));
  }
  ```
- This prevents Insecure Direct Object References (IDOR) across cart, wishlist, orders, returns, and addresses.

---

## 3. Role-Based Access Control (RBAC)

Shopivo defines 3 distinct roles:
1. `ROLE_CUSTOMER`: End buyers purchasing products.
2. `ROLE_SELLER`: Approved merchants managing catalogs and fulfillment.
3. `ROLE_ADMIN`: Platform operators moderating listings and overseeing transactions.

RBAC is enforced through dual-layer defense:
1. **URL-Level Rules in `SecurityConfig`**:
   - `/api/cart/**`, `/api/wishlist/**`, `/api/addresses/**` ➔ `hasRole('CUSTOMER')`
   - `/api/seller/**` ➔ `hasRole('SELLER')`
   - `/api/admin/**` ➔ `hasRole('ADMIN')`
   - Public browse: `GET /api/products/**`, `GET /api/categories/**`, `GET /api/reviews/product/**` ➔ `permitAll()`
2. **Method-Level Annotations**:
   - `@PreAuthorize("hasRole('ADMIN')")`
   - `@PreAuthorize("hasRole('SELLER')")`
   - `@PreAuthorize("hasRole('CUSTOMER')")`
   - `@PreAuthorize("isAuthenticated()")`

---

## 4. Multi-Tenant Actor Isolation

### 4.1 Customer Data Isolation
- Customers can only access their own orders, invoices, saved addresses, return requests, and notifications.
- Any attempt by Customer A to query Customer B's order ID returns HTTP `403 Forbidden` or `404 Not Found`.

### 4.2 Seller Catalog & Order Isolation
- **Catalog Isolation**: A seller cannot update or modify another seller's product. `ProductServiceImpl.updateProduct()` and `updateStock()` verify `product.getSeller().getId().equals(sellerId)`. Unauthorized modifications return HTTP `403 Forbidden`.
- **Mixed-Seller Order Segregation**:
  - When an order contains items from both Seller A and Seller B, Seller A receives a scoped view (`OrderResponse.fromForSeller(order, sellerA.getId())`).
  - Seller A sees **only their own products and line totals**. Seller B's items, pricing, and fulfillment state are stripped from the response.
- **Analytics Isolation**: `SellerAnalyticsService` queries strictly filter by `orderItem.seller.id = :sellerId`.

---

## 5. Account Suspension & Administrative Safeguards

### 5.1 Account Suspension Lifecycle
- The `users` table contains `enabled BOOLEAN NOT NULL DEFAULT TRUE`.
- When an account is suspended:
  - `enabled` is set to `false`.
  - The user's historical data (orders, reviews, addresses, products) remains fully preserved.
  - Existing JWT tokens are rejected immediately on subsequent requests (`JwtAuthFilter` checks `user.isEnabled()`).
  - Login attempts fail with `InvalidCredentialsException` ("Account is disabled").

### 5.2 Anti-Lockout Safeguards
In `AdminUserServiceImpl`:
1. **Self-Suspension Protection**:
   ```java
   if (currentUser != null && currentUser.getId().equals(userId)) {
       throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Administrators cannot suspend their own account");
   }
   ```
2. **Last Active Admin Protection**:
   ```java
   if (targetUser.getRole() == User.Role.ADMIN) {
       long activeAdminCount = userRepository.countByRoleAndEnabled(User.Role.ADMIN, true);
       if (activeAdminCount <= 1 && targetUser.isEnabled()) {
           throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot suspend the last active administrator account");
       }
   }
   ```

---

## 6. Sensitive Data Sanitization & Privacy

1. **DTO Separation**: JPA entities containing `passwordHash` are never serialized. DTOs explicitly omit passwords, reset tokens, and internal keys.
2. **Payment Card Masking**:
   - Primary Account Numbers (PAN) and CVVs are **never stored in the database**.
   - Only the sanitized last 4 digits (`cardLast4`), card brand, and gateway transaction ID are persisted.
   - CVVs and raw card numbers are never written to application logs.
3. **No Database Leakage**: `GlobalExceptionHandler` logs technical stack traces internally at `ERROR` level but returns sanitized, user-safe `ApiError` payloads to API consumers.

---

## 7. Scope Separation: Implemented Security vs. Future Fraud Detection

| Security Aspect | Status | Scope |
|:---|:---:|:---|
| **BCrypt Password Hashing** | IMPLEMENTED | Semester 1 Core |
| **Stateless JWT Authentication** | IMPLEMENTED | Semester 1 Core |
| **Role-Based Authorization (RBAC)** | IMPLEMENTED | Semester 1 Core |
| **Server-Side Identity Injection** | IMPLEMENTED | Semester 1 Core |
| **Seller Line-Item Isolation** | IMPLEMENTED | Semester 1 Core |
| **Customer Data Isolation** | IMPLEMENTED | Semester 1 Core |
| **Account Suspension & Admin Safeguards** | IMPLEMENTED | Semester 1 Core |
| **Sensitive DTO Credential Sanitization** | IMPLEMENTED | Semester 1 Core |
| **Masked Payment Snapshotting** | IMPLEMENTED | Semester 1 Core |
| **Heterogeneous Graph Construction** | FUTURE WORK | Semester 2 AI |
| **CSGAD Contrastive Graph Learning** | FUTURE WORK | Semester 2 AI |
| **Real-Time Fraud Risk Scoring** | FUTURE WORK | Semester 2 AI |
| **Fake Review Anomaly Detection** | FUTURE WORK | Semester 2 AI |
| **Forensic Graph Investigation UI** | FUTURE WORK | Semester 2 AI |

> **IMPORTANT**: Semester 1 implements enterprise-grade deterministic authentication and authorization. It does **NOT** include machine learning models, graph anomaly detection, or AI-based fraud scoring, which are strictly reserved for Semester 2.

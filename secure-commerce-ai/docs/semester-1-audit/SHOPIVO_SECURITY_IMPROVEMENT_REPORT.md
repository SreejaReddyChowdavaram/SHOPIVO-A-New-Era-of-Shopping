# SHOPIVO — SEMESTER 1 SECURITY HARDENING & GIT SAFETY REPORT
## Application Security Audit, Defect Remediation & Verification

---

### Executive Security Summary
- **Audit Scope**: Semester 1 Security Hardening & Git Safety Audit
- **Project**: SHOPIVO — Multi-Vendor Electronic Commerce Platform
- **Scope Restriction**: Strictly Semester 1 (Zero AI, ML, GNN, CSGAD, or Mamba)
- **Git Safety Rule**: Zero commits, zero pushes, zero destructive commands; all uncommitted work preserved
- **Backend Test Status**: **114 / 114 Tests Passed (0 Failures, 0 Errors, 0 Skipped)**
- **Frontend Build Status**: **Vite v8.2.1 Built in 844ms (0 Errors)**
- **Frontend Lint Status**: **Oxlint Passed in 57ms (0 Errors, 174 Informational Warnings)**

---

## 1. Security Findings & Status Classification

| Category | Finding / Vulnerability | Status | Remediation Summary |
|---|---|---|---|
| **Demo Credentials Protection** | `SHOPIVO_ALL_ACCOUNTS_AND_CREDENTIALS.txt` was untracked by Git, presenting an accidental commit risk if `git add .` was run. | **FIXED** | Explicitly added `SHOPIVO_ALL_ACCOUNTS_AND_CREDENTIALS.txt` and `credentials.local` to `.gitignore`. Verified via `git check-ignore`. |
| **Environment Secrets Tracking** | Verified whether `.env`, `backend/.env`, or `frontend/.env` are tracked by Git. | **ALREADY SECURE** | All `.env` and `*.local` files are ignored by `.gitignore`. Only example templates (`.env.example`) are tracked. |
| **Hardcoded Secrets in Source Code** | Inspected Java source files for hardcoded JWT secrets, DB passwords, and Razorpay keys. | **ALREADY SECURE** | Secrets are loaded via Spring `@Value` expressions from environment variables. |
| **Production JWT Secret Validation** | In `application.yml`, development fallback secret `ThisIsAPlaceholderSecretThatMustBeReplacedInProductionWithA256BitKey` existed without production-profile startup guardrails. | **FIXED** | Enhanced `JwtUtil.java` constructor to inspect Spring active profiles: if `prod` or `production` profile is active, it strictly rejects the placeholder secret and mandates a secure secret of at least 256 bits (32 bytes). Added `app.jwt.secret: ${JWT_SECRET}` to `application-prod.yml`. |
| **Public Registration Privilege Escalation** | In `AuthService.register()`, `request.getRole()` was accepted without checking if an attacker submitted `role: ADMIN`. | **FIXED** | Added explicit guard in `AuthService.register()`: if `request.getRole() == User.Role.ADMIN`, the request is immediately rejected with `400 BAD REQUEST` ("Self-registration as ADMIN is not permitted"). |
| **Password Hashing** | Inspected BCrypt password storage and hashing cost factor. | **ALREADY SECURE** | BCrypt with cost factor 12 is configured in `SecurityConfig.java` (`BCryptPasswordEncoder(12)`). Plaintext passwords are never stored. |
| **Role-Based Access Control (RBAC)** | Inspected endpoint URL patterns and `@PreAuthorize` method guards across controllers. | **ALREADY SECURE** | `hasRole('ADMIN')` on all `/api/admin/**`, `hasRole('SELLER')` on `/api/seller/**`, `hasRole('CUSTOMER')` on cart/wishlist/addresses. Verified by integration tests. |
| **Customer Data Isolation** | Inspected cart, order, and address retrieval. | **ALREADY SECURE** | Carts and addresses are bound to the authenticated user ID (`@AuthenticationPrincipal User user`). Orders verify customer ownership and return `403 FORBIDDEN` on foreign order IDs. |
| **Seller Catalog & Order Isolation** | Inspected seller product updates, deletions, image uploads, and order views. | **ALREADY SECURE** | Controller and service layers strictly verify `product.seller.id == sellerId` and return `403 FORBIDDEN` if unauthorized. Order fulfillment is isolated to seller's own line items. |
| **Product Image Upload Pipeline** | Inspected file upload limits, extensions, MIME types, magic-byte inspection, and storage. | **ALREADY SECURE** | 5 MB upload limit, strict extension/MIME allowlists (`jpg`, `jpeg`, `png`, `webp`), magic-byte inspection, BufferedImage decoding, path traversal prevention (`normalize()`), and UUID file naming. |
| **CORS Configuration & Wildcards** | Inspected CORS allowed origins and credentials flags. | **FIXED** | Updated `SecurityConfig.java` to bind allowed origins to `${app.cors.allowed-origins}`, preserving `localhost:5173` and `localhost:3000` while strictly filtering out wildcard `*` to safeguard credentialed requests (`allowCredentials=true`). |
| **API Rate Limiting & Brute Force** | Inspected `/api/auth/login` and `/api/auth/register` for rate limiting. | **NEEDS IMPROVEMENT** | No rate limiter currently active on public auth endpoints. Lightweight in-memory rate-limiting architecture proposed below. |

---

## 2. Files Inspected

- **Environment & Git Safety**:
  - `secure-commerce-ai/.gitignore`
  - `secure-commerce-ai/credentials.local`
  - `secure-commerce-ai/SHOPIVO_ALL_ACCOUNTS_AND_CREDENTIALS.txt`
  - `secure-commerce-ai/backend/.env`
  - `secure-commerce-ai/backend/.env.example`
  - `secure-commerce-ai/frontend/.env.example`
- **Security & JWT Configuration**:
  - `backend/src/main/resources/application.yml`
  - `backend/src/main/resources/application-prod.yml`
  - `backend/src/main/java/com/securecommerce/platform/config/SecurityConfig.java`
  - `backend/src/main/java/com/securecommerce/platform/security/util/JwtUtil.java`
  - `backend/src/main/java/com/securecommerce/platform/security/filter/JwtAuthFilter.java`
- **Authentication & Authorization**:
  - `backend/src/main/java/com/securecommerce/platform/auth/controller/AuthController.java`
  - `backend/src/main/java/com/securecommerce/platform/auth/service/AuthService.java`
  - `backend/src/main/java/com/securecommerce/platform/auth/dto/RegisterRequest.java`
  - `backend/src/main/java/com/securecommerce/platform/auth/dto/LoginRequest.java`
  - `backend/src/main/java/com/securecommerce/platform/user/entity/User.java`
- **Data Isolation & Operations**:
  - `backend/src/main/java/com/securecommerce/platform/cart/service/CartServiceImpl.java`
  - `backend/src/main/java/com/securecommerce/platform/order/service/OrderServiceImpl.java`
  - `backend/src/main/java/com/securecommerce/platform/product/service/ProductServiceImpl.java`
  - `backend/src/main/java/com/securecommerce/platform/product/service/ProductImageStorageService.java`
  - `backend/src/main/java/com/securecommerce/platform/product/controller/ProductController.java`
  - `backend/src/main/java/com/securecommerce/platform/payment/service/PaymentServiceImpl.java`
  - `backend/src/main/java/com/securecommerce/platform/payment/gateway/RazorpayPaymentGatewayService.java`

---

## 3. Files Modified & Changes Implemented

### 3.1 `.gitignore`
- **Change**: Explicitly added `credentials.local` and `SHOPIVO_ALL_ACCOUNTS_AND_CREDENTIALS.txt` under the `# SECRETS — NEVER commit these` section.
- **Security Benefit**: Prevents local credential files containing test user passwords from being accidentally staged or committed via `git add .`.

### 3.2 `backend/src/main/java/com/securecommerce/platform/auth/service/AuthService.java`
- **Change**: Added explicit role validation to `register()`:
  ```java
  // 2. Validate role: self-registration as ADMIN is forbidden
  if (request.getRole() == User.Role.ADMIN) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Self-registration as ADMIN is not permitted");
  }
  ```
- **Security Benefit**: Eliminates a privilege escalation vector where an attacker could forge a POST request with `role: "ADMIN"` to self-register as a platform administrator.

### 3.3 `backend/src/main/java/com/securecommerce/platform/security/util/JwtUtil.java`
- **Change**: Injected Spring's `Environment env` and added startup validation:
  ```java
  if (env != null && (env.matchesProfiles("prod") || env.matchesProfiles("production"))) {
      if (secret == null || secret.isBlank() || DEFAULT_DEV_SECRET.equals(secret.trim())) {
          throw new IllegalStateException(
              "CRITICAL SECURITY CONFIGURATION ERROR: Production profile ('prod') cannot run with " +
              "the default development JWT secret placeholder. Please set a secure, random 256-bit " +
              "JWT_SECRET environment variable."
          );
      }
      if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
          throw new IllegalStateException(
              "CRITICAL SECURITY CONFIGURATION ERROR: Production JWT secret must be at least " +
              "256 bits (32 bytes) in length."
          );
      }
  }
  ```
- **Security Benefit**: Guarantees that production deployments cannot silently boot with a compromised development placeholder secret, while keeping local development and automated tests fully functional.

### 3.4 `backend/src/main/resources/application-prod.yml`
- **Change**: Configured `app.jwt.secret: ${JWT_SECRET}` under the `prod` profile.
- **Security Benefit**: Requires an externalized `JWT_SECRET` environment variable in production, preventing any fallback default from being loaded.

### 3.5 `backend/src/main/java/com/securecommerce/platform/config/SecurityConfig.java`
- **Change**: Connected `corsConfigurationSource()` to `@Value("${app.cors.allowed-origins:http://localhost:5173}")`:
  ```java
  java.util.Set<String> allowedOrigins = new java.util.LinkedHashSet<>();
  allowedOrigins.add("http://localhost:5173");
  allowedOrigins.add("http://localhost:3000");

  if (configuredCorsOrigins != null && !configuredCorsOrigins.isBlank()) {
      for (String origin : configuredCorsOrigins.split(",")) {
          String trimmed = origin.trim();
          if (!trimmed.isEmpty() && !trimmed.equals("*")) {
              allowedOrigins.add(trimmed);
          }
      }
  }
  ```
- **Security Benefit**: Ensures production deployments can inject explicit domain allowlists via `CORS_ORIGINS` while strictly blocking wildcard `*` from being combined with `allowCredentials(true)`.

---

## 4. API Security Findings & Lightweight Rate-Limiting Proposal

### Current State
- Public endpoints (`/api/auth/login`, `/api/auth/register`, `/api/products`) do not currently enforce rate-limiting.
- While BCrypt (work factor 12) introduces computational delay (~80-120ms per password verification) that naturally mitigates fast brute-force attacks, it does not prevent distributed credential stuffing or resource exhaustion attacks on single-instance nodes.

### Proposed Lightweight Implementation (Semester 1 Compatible)
- **Architecture**: In-memory token-bucket or sliding-window rate limiter filter (`RateLimitFilter`) executing before authentication.
- **Storage**: `ConcurrentHashMap<String, RequestBucket>` with TTL expiration (zero external Redis dependency).
- **Keying**: Client IP address (`X-Forwarded-For` or `request.getRemoteAddr()`) + endpoint path.
- **Thresholds**:
  - `/api/auth/login`: Maximum 10 attempts per minute per IP.
  - `/api/auth/register`: Maximum 5 registrations per minute per IP.
- **Response**: When limit exceeded, return `HTTP 429 TOO MANY REQUESTS` with `Retry-After: 60` and JSON error message.
- **Impact Analysis**: Zero breaking changes to existing endpoints; fully self-contained in Spring Boot memory; safe for local development, academic demos, and single-instance deployments.

---

## 5. Automated Verification Results

### 5.1 Backend Test Results
- **Command**: `.\mvnw.cmd test`
- **Tests Run**: **114**
- **Failures**: **0**
- **Errors**: **0**
- **Skipped**: **0**
- **Build Status**: **BUILD SUCCESS (Time: 3 min 3 sec)**

**Test Breakdown**:
- `PaymentGatewayIntegrationTest`: 29 / 29 Passed
- `AdminUserManagementIntegrationTest`: 18 / 18 Passed
- `AdminOrderManagementIntegrationTest`: 16 / 16 Passed
- `ProductImageUploadIntegrationTest`: 14 / 14 Passed
- `CustomerRegressionIntegrationTest`: 7 / 7 Passed
- `EventLoggingIntegrationTest`: 8 / 8 Passed
- `SellerAnalyticsIntegrationTest`: 7 / 7 Passed
- `AdminProductModerationIntegrationTest`: 5 / 5 Passed
- `AdminReviewIntegrationTest`: 5 / 5 Passed
- `SellerOrderManagementIntegrationTest`: 4 / 4 Passed
- `PlatformApplicationTests`: 1 / 1 Passed

### 5.2 Frontend Build & Lint Results
- **Build (`npm run build`)**: Vite v8.2.1 built client in **844ms** with **0 Errors**.
- **Lint (`npm run lint`)**: Oxlint scanned 101 files with 92 rules in **57ms** with **0 Errors** (174 informational warnings on unused imports).

---

## 6. Git Working Tree Status

### Before Changes
- Sensitive file `SHOPIVO_ALL_ACCOUNTS_AND_CREDENTIALS.txt` was reported as an untracked file (`??`).
- `credentials.local` was covered by `*.local`.
- 88 files were modified in working tree from ongoing development.

### After Changes
- `SHOPIVO_ALL_ACCOUNTS_AND_CREDENTIALS.txt` is now explicitly ignored and no longer appears in `git status`.
- `credentials.local` is explicitly ignored.
- Only security-relevant files (`.gitignore`, `AuthService.java`, `JwtUtil.java`, `application-prod.yml`, `SecurityConfig.java`) received focused, non-breaking modifications.
- **Zero commits, zero pushes, and zero file deletions occurred.**


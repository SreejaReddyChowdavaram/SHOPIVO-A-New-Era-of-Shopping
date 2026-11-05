# SHOPIVO — SEMESTER 1 API RATE LIMITING REPORT
## Lightweight In-Memory Brute-Force Protection for Authentication Endpoints

---

### Executive Summary
- **Project**: SHOPIVO — A New Era of Shopping (Academic Multi-Vendor E-Commerce Platform)
- **Scope Restriction**: Strictly Semester 1 (Zero AI, ML, GNN, CSGAD, or Mamba)
- **Infrastructure Restriction**: Zero Redis / Zero external infrastructure dependencies
- **Endpoints Protected**:
  - `POST /api/auth/login` (Standard login rate limiting)
  - `POST /api/auth/register` (Account creation spam and credential stuffing prevention)
- **Status**: **Fully Implemented, Integrated, and Verified**
- **Automated Verification**:
  - Dedicated Integration Suite: **9 / 9 Tests Passed (0 Failures, 0 Errors)**
  - Full Platform Backend Suite: **123 / 123 Tests Passed (0 Failures, 0 Errors, 0 Skipped)**
  - Frontend Production Build: **Vite v8.2.1 Built in 679ms (0 Errors)**
  - Frontend Code Quality: **Oxlint Passed on 101 files in 25ms (0 Errors, 174 Informational Warnings)**

---

## 1. Files Changed and Created

| File | Type | Changes / Purpose |
|---|---|---|
| `backend/src/main/java/com/securecommerce/platform/security/service/RateLimiterService.java` | **New** | Lightweight, thread-safe, in-memory rate limiter using `ConcurrentHashMap` with atomic `RequestBucket` per client IP. Includes configurable properties, fixed-window tracking, atomic acquisition, test isolation hooks, and `@Scheduled(fixedRate = 300000)` periodic cleanup of stale buckets. |
| `backend/src/main/java/com/securecommerce/platform/security/filter/RateLimitingFilter.java` | **New** | `OncePerRequestFilter` intercepting only `POST /auth/login` and `POST /auth/register`. Evaluates limits before authentication processing. Safely extracts client IP (untrusted proxy headers ignored by default). Returns HTTP 429 with `Retry-After` header and structured JSON body. |
| `backend/src/main/java/com/securecommerce/platform/config/SecurityConfig.java` | **Modified** | Injected `RateLimitingFilter` into the Spring Security filter chain before `LogoutFilter` (post-CORS, pre-auth), ensuring rate-limiting checks execute before password hashing or database queries, while preserving CORS headers. |
| `backend/src/main/resources/application.yml` | **Modified** | Added `app.rate-limit` configuration block defining enabled flag, login limits, register limits, time windows, and proxy trust settings with environment variable overrides. |
| `backend/src/test/java/com/securecommerce/platform/AuthRateLimitingIntegrationTest.java` | **New** | Comprehensive 9-scenario integration test suite testing below limit, limit exceeded, window reset, IP independence, spoofed header rejection, valid login passthrough, and non-auth endpoint isolation. |

---

## 2. Rate Limiting Architecture & Implementation

### 2.1 Design Objectives & In-Memory Thread Safety
The rate limiter operates entirely in-memory within the JVM heap without introducing Redis, Memcached, or external database overhead:
1. **Thread Safety**: Client buckets are managed inside `ConcurrentHashMap<String, RequestBucket>`.
2. **Atomic Window Evaluation**: Inside each `RequestBucket`, `tryAcquire(maxLimit, windowDurationMs, now)` synchronizes state transitions to guarantee atomic increment and reset across concurrent requests from the same IP.
3. **Memory Bounding & Leak Prevention**: A background `@Scheduled(fixedRate = 300000)` daemon task cleans up entries that have been inactive for more than $2\times$ the window duration, preventing memory bloat from transient IP scans.
4. **Early Exit in Security Chain**: Filter is placed early in the Spring Security filter chain. Rate-limited requests are blocked immediately before triggering expensive BCrypt calculations or Hibernate database queries.

### 2.2 Safe Client IP Identification (Anti-Spoofing)
In typical deployments, attackers can attempt to bypass IP-based rate limiting by forging HTTP headers such as `X-Forwarded-For` or `X-Real-IP`.
- **Default Mode (`app.rate-limit.trusted-proxy-enabled: false`)**: The rate limiter strictly inspects `request.getRemoteAddr()`, completely ignoring arbitrary forwarded headers from client requests.
- **Trusted Reverse Proxy Mode (`app.rate-limit.trusted-proxy-enabled: true`)**: When the application is explicitly deployed behind a trusted load balancer (e.g., AWS ALB, Nginx, Cloudflare), it safely extracts the client IP from the first element of `X-Forwarded-For` and validates it against an IP format regex (`^[0-9a-fA-F:.]+$`).

---

## 3. Configuration Properties & Default Thresholds

The rate limiter is configured directly via `application.yml` with support for environment variable overrides:

```yaml
app:
  # Rate Limiting Configuration (Authentication Endpoints)
  rate-limit:
    auth:
      enabled: ${RATE_LIMIT_AUTH_ENABLED:true}
      max-login-attempts: ${RATE_LIMIT_LOGIN_MAX:10}
      login-window-seconds: ${RATE_LIMIT_LOGIN_WINDOW_SEC:60}
      max-register-attempts: ${RATE_LIMIT_REGISTER_MAX:5}
      register-window-seconds: ${RATE_LIMIT_REGISTER_WINDOW_SEC:60}
    trusted-proxy-enabled: ${TRUSTED_PROXY_ENABLED:false}
```

### Default Parameters:
- **Login Endpoint (`POST /api/auth/login`)**:
  - `max-login-attempts`: **10 attempts**
  - `login-window-seconds`: **60 seconds**
  - Allows legitimate users flexibility if mistyping passwords, while effectively blocking high-speed brute-force attacks.
- **Registration Endpoint (`POST /api/auth/register`)**:
  - `max-register-attempts`: **5 attempts**
  - `register-window-seconds`: **60 seconds**
  - Protects the database from account creation spam, automated bot registration, and resource exhaustion.

---

## 4. HTTP 429 Response Specification

When a client IP exceeds the configured threshold within the sliding/fixed window, the server immediately short-circuits the request and returns:

### HTTP Response Headers:
```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json;charset=UTF-8
Retry-After: 58
```

### JSON Response Body:
Conforms strictly to SHOPIVO's unified `ApiResponse` format:
```json
{
  "success": false,
  "message": "Too many login attempts. Rate limit exceeded. Please wait 58 seconds before retrying.",
  "errors": {
    "code": "RATE_LIMIT_EXCEEDED",
    "retryAfterSeconds": 58,
    "endpoint": "login"
  },
  "timestamp": "2026-10-31T14:18:49.538Z"
}
```

---

## 5. Automated Verification & Test Results

### 5.1 Dedicated Integration Test Suite (`AuthRateLimitingIntegrationTest`)
A dedicated suite covering 9 distinct scenarios was authored and verified:

| Test Scenario | Verification Objective | Result |
|---|---|---|
| `testLoginAllowedBelowLimit` | 10 consecutive failed login attempts from IP `10.0.0.1` are allowed through to authentication (`401 Unauthorized`, not throttled). | **PASSED** |
| `testLoginExceededReturns429` | 11th login attempt from IP `10.0.0.2` returns `HTTP 429`, `Retry-After` header, and `RATE_LIMIT_EXCEEDED` error code. | **PASSED** |
| `testRegisterAllowedBelowLimit` | 5 registration requests from IP `10.0.0.3` successfully complete registration (`201 Created`). | **PASSED** |
| `testRegisterExceededReturns429` | 6th registration request from IP `10.0.0.4` is rejected with `HTTP 429` and `RATE_LIMIT_EXCEEDED`. | **PASSED** |
| `testSeparateIpsHaveIndependentLimits` | Exhausting limits on IP `192.168.1.10` results in `429`, while independent IP `192.168.1.20` is allowed through unimpeded. | **PASSED** |
| `testRateLimitResetsAfterWindow` | An IP blocked by rate limiting is immediately permitted after advancing the bucket time window past 60 seconds. | **PASSED** |
| `testSpoofedForwardedForHeaderIgnoredWhenProxyUntrusted` | An attacker spoofing varied `X-Forwarded-For` IPs is still tracked by real `RemoteAddr` and blocked on the 11th request. | **PASSED** |
| `testSuccessfulLoginProceedsNormally` | Legitimate user credentials below limit authenticate successfully, returning `200 OK` and a valid JWT `accessToken`. | **PASSED** |
| `testNonAuthEndpointsNotThrottled` | An IP that reached the auth rate limit can still access public catalogue endpoints (`GET /api/products`) without hindrance. | **PASSED** |

**Summary**: **9 tests run, 0 failures, 0 errors, 0 skipped.** Time elapsed: 18.22s.

---

### 5.2 Backend Regression Suite & Final Test Verification

> [!NOTE]
> **Test Suite Evolution & Final Authoritative Suite:**
> The initial regression run immediately following rate-limiter implementation recorded 123 tests across 12 test classes. In subsequent audit and hardening phases, `AdminPaymentManagementIntegrationTest` (7 tests) was added as the 13th test class, and existing test suites were expanded (`PaymentGatewayIntegrationTest` expanded from 22 to 29 tests, `ProductImageUploadIntegrationTest` expanded from 10 to 14 tests, and `CustomerRegressionIntegrationTest` verified as 7 `@Test` methods covering 13 functional sections).
>
> The **final authoritative Semester 1 test suite comprises 130 tests across 13 classes (130 passing, 0 failures, 0 errors, 0 skipped)**, as fully documented in [`SHOPIVO_TASK3A_CONSISTENCY_VERIFICATION.md`](file:///c:/Users/SREEJA/Documents/Fraud Detection/secure-commerce-ai/docs/semester-1-audit/SHOPIVO_TASK3A_CONSISTENCY_VERIFICATION.md).

#### Final Verified Test Suite Breakdown (13 Test Classes, 130 Tests):
1. `AdminOrderManagementIntegrationTest` (16 tests)
2. `AdminPaymentManagementIntegrationTest` (7 tests) *(added in post-rate-limiter audit phase)*
3. `AdminProductModerationIntegrationTest` (5 tests)
4. `AdminReviewIntegrationTest` (5 tests)
5. `AdminUserManagementIntegrationTest` (18 tests)
6. `AuthRateLimitingIntegrationTest` (9 tests)
7. `CustomerRegressionIntegrationTest` (7 tests — validates 13 functional regression domains)
8. `EventLoggingIntegrationTest` (8 tests)
9. `PaymentGatewayIntegrationTest` (29 tests — expanded from historical baseline of 22)
10. `PlatformApplicationTests` (1 test)
11. `ProductImageUploadIntegrationTest` (14 tests — expanded from historical baseline of 10)
12. `SellerAnalyticsIntegrationTest` (7 tests)
13. `SellerOrderManagementIntegrationTest` (4 tests)

- **Total Authoritative Tests Run**: **130**
- **Failures**: **0**
- **Errors**: **0**
- **Skipped**: **0**
- **Authoritative Status**: **100% PASS** (`BUILD SUCCESS`).

---

### 5.3 Frontend Quality & Lint Verification
- **Vite Build**: `npm run build` completed in 679ms, outputting production bundle in `dist/` with zero errors.
- **Oxlint**: `npm run lint` checked 101 files with 92 rules in 25ms, returning **0 errors** (174 informational unused variable/import warnings from uncommitted UI development).

---

## 6. Known Limitations of In-Memory Rate Limiting

While in-memory rate limiting fulfills all Semester 1 requirements with zero external infrastructure overhead, the following architectural constraints are documented for future consideration:

1. **State Isolation Across Clustered Instances (Horizontal Scaling)**:
   - In a multi-instance production deployment behind a round-robin load balancer, each Spring Boot instance maintains its own memory bucket.
   - A client making $N$ requests distributed across $K$ instances can effectively make up to $K \times \text{limit}$ requests before being throttled, unless sticky sessions (IP hash affinity) are configured at the reverse proxy.
2. **State Volatility on Application Restarts**:
   - In-memory buckets reside in the JVM heap and are cleared upon application restart or deployment.
3. **Distributed Denial of Service (DDoS) via Botnets**:
   - In-memory rate limiting operates per client IP. Distributed attacks utilizing large pools of unique IPs (e.g., botnets or residential proxies) require network-layer edge mitigation (Cloudflare, AWS WAF, or CAPTCHA verification).
4. **Future Multi-Node Recommendations (Semester 2 / Production)**:
   - For multi-replica production architectures, migrating `RateLimiterService` to a centralized Redis token bucket or Redis sliding-window counter using Lettuce/Redisson will provide consistent global rate limiting across all nodes.


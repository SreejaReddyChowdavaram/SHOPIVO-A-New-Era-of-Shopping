# System Architecture Documentation

**Project**: SHOPIVO — A New Era of Shopping  
**Document Version**: 2.0 (Semester 1 Final)  
**Architecture Style**: Modular Monolith  

---

## 1. Architectural Principles

Shopivo is designed as an enterprise-grade **Modular Monolith**. It deliberately eschews microservices in Semester 1 to eliminate distributed transaction latency, network serialization overhead, and eventual consistency failures during checkout and order placement.

Core Architectural Decisions:
1. **Single Deployable Unit**: The Spring Boot backend runs as a single JAR containing strictly decoupled domain packages.
2. **RESTful Contract**: Frontend and backend communicate purely over stateless JSON REST APIs.
3. **Stateless Authentication**: Security context is established on every request using signed JWTs. No HTTP session state is maintained on the server.
4. **Database Authority**: PostgreSQL 15+ is the single source of truth. All schema modifications are versioned via Flyway migrations (`V1`–`V14`).
5. **No Microservices in Semester 1**: The application is **not** a microservices deployment. A separate Python microservice is planned exclusively for Semester 2 (CSGAD AI fraud detection).

---

## 2. Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 React 19 Presentation Layer                 │
│      - Vite 8.2 Build System                                │
│      - React Router DOM v7 (Role-Based Route Guards)        │
│      - Redux Toolkit (Auth & Cart Client State)             │
│      - Vanilla CSS Design System (Dark-mode, Glassmorphic)  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON REST
                               │ Authorization: Bearer <JWT>
┌──────────────────────────────▼──────────────────────────────┐
│                  Spring Boot 3.4.x Backend                  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │   Security Filter Chain (Spring Security 6)           │  │
│  │   - OncePerRequestFilter (JwtAuthFilter)              │  │
│  │   - SecurityContextHolder (Principal = User entity)   │  │
│  │   - Method-Level RBAC (@PreAuthorize)                 │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                              │
│  ┌───────────────────────────▼───────────────────────────┐  │
│  │   REST Controllers (Web API Layer)                    │  │
│  │   - Input validation (Jakarta Bean Validation)        │  │
│  │   - Identity injection via @AuthenticationPrincipal   │  │
│  │   - Standard ApiResponse<T> encapsulation             │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                              │
│  ┌───────────────────────────▼───────────────────────────┐  │
│  │   Service Layer (Business Logic & Transactions)       │  │
│  │   - Declarative transaction boundaries (@Transactional)│ │
│  │   - Ownership isolation rules                         │  │
│  │   - Order & inventory state machines                  │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                              │
│  ┌───────────────────────────▼───────────────────────────┐  │
│  │   Data Access Layer (Spring Data JPA / Hibernate 6.6) │  │
│  │   - Type-safe Repositories & custom JPQL queries      │  │
│  │   - Entity-DTO decoupling (DTOs returned to API)      │  │
│  │   - Schema validation: ddl-auto = validate            │  │
│  └───────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               │ JDBC (HikariCP Connection Pool)
┌──────────────────────────────▼──────────────────────────────┐
│                 PostgreSQL 15+ Database                     │
│      - Version-controlled SQL migrations: V1 through V14    │
│      - Foreign key constraints & indexed lookups            │
│      - Immutable price/item snapshots                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Package & Module Structure

The backend follows domain-driven packaging within `com.securecommerce.platform`:

```
com.securecommerce.platform
├── address       ← Shipping addresses and default address resolution
├── analytics     ← Seller analytics aggregates, daily sales, top products
├── auth          ← Registration, login, password hashing, JWT generation
├── cart          ← Shopping cart, item addition, live totals
├── category      ← Category taxonomy and hierarchy
├── common        ← ApiResponse<T>, HomeController, base utilities
├── config        ← SecurityConfig, WebMvcConfig, CORS setup
├── coupon        ← Coupon verification and authoritative discount calculation
├── exception     ← GlobalExceptionHandler, ApiError, custom exceptions
├── notification  ← In-app customer notification service
├── order         ← Orders, Seller order views, Admin order oversight, PDF invoices
├── payment       ← Deterministic sandbox payment gateway & auditing
├── product       ← Product catalog, seller CRUD, admin moderation pipeline
├── returns       ← Return requests & sandbox instant refund processing
├── review        ← Customer verified purchase reviews & rating breakdowns
├── security      ← JwtAuthFilter, JwtUtil, SecurityUtils
├── user          ← User entity, Admin user management, Admin seller management
└── wishlist      ← Customer saved product wishlists
```

Each module encapsulates:
- `entity/`: JPA entities mapping to Postgres tables.
- `repository/`: Spring Data JPA data access interfaces.
- `dto/`: Plain Java request/response records. **Entities are never returned directly from controllers.**
- `service/`: Service interfaces and `@Service` implementations managing `@Transactional` workflows.
- `controller/`: `@RestController` classes defining HTTP routes and security guards.

---

## 4. End-to-End Request Lifecycle

1. **Client Request**: Frontend sends an HTTP request with an `Authorization: Bearer <token>` header.
2. **Token Extraction & Verification**:
   - `JwtAuthFilter` extracts the token.
   - `JwtUtil` cryptographically verifies the signature and expiration using the HMAC-SHA256 secret.
   - User identity is loaded from `UserRepository` and verified to be active (`user.isEnabled() == true`).
   - If suspended or invalid, no authentication is populated.
3. **Security Context Population**: An authenticated `UsernamePasswordAuthenticationToken` containing the user entity and granted authorities (`ROLE_CUSTOMER`, `ROLE_SELLER`, `ROLE_ADMIN`) is placed in `SecurityContextHolder`.
4. **URL & Method Authorization**:
   - `SecurityConfig` verifies ant-matchers.
   - Controller-level `@PreAuthorize("hasRole(...)")` confirms caller permissions. If unauthorized, `AccessDeniedException` (HTTP 403) is raised.
5. **Controller Processing**:
   - Jakarta Bean Validation (`@Valid`) checks payload constraints.
   - The authenticated user is injected via `@AuthenticationPrincipal User currentUser`.
6. **Service Transaction**:
   - `@Transactional` initiates a database transaction.
   - Business logic, stock validation, and ownership rules are enforced.
7. **Persistence & Response**:
   - Spring Data JPA generates optimized SQL executed via HikariCP on PostgreSQL.
   - The service maps entities to safe DTOs.
   - The controller wraps the DTO in `ApiResponse.success(...)` and returns HTTP 200/201.
8. **Exception Handling**: If any error occurs, `GlobalExceptionHandler` intercepts the exception, logs server-side diagnostics, and returns a clean, sanitized `ApiError` JSON response without leaking database schema or stack traces.

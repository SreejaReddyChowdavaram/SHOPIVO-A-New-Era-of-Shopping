# SHOPIVO Project File & Directory Inventory

**Project:** SHOPIVO — A New Era of Shopping  
**Audit Date:** November 11, 2026  
**Root Directory:** `C:\Users\SREEJA\Documents\Fraud Detection\secure-commerce-ai`

---

## 1. Summary Classification

| Category | Description | Count / Scope | Safety Policy |
|---|---|:---:|---|
| **A. Essential Source Files** | React JSX, Tailwind CSS, Spring Boot Java services, controllers, entities, repositories | 465 files | Core production logic. Must NOT be removed. |
| **B. Application Configuration** | `application.yml`, `pom.xml`, `vite.config.js`, `package.json`, `render.yaml` | 8 files | Platform runtime definition. Preserved. |
| **C. Database Migrations** | Flyway SQL migrations (`V1` to `V20`, plus review of `V21`) | 21 scripts | Flyway schema versioning. Never deleted without history alignment. |
| **D. Frontend Assets** | Logos, icons, SVGs (`frontend/public/`, `src/assets/`) | 6 items | Production visual brand assets. Preserved. |
| **E. Backend Resources** | Static seed, SQL references, classpath resources | 25 items | Production runtime dependencies. Preserved. |
| **F. Tests** | JUnit 5 unit & integration suites, Spring Boot tests | 16 test classes | Regression prevention. Preserved. |
| **G. Documentation** | Technical guides, API documentation, architectural reports (`docs/`, `*.md`) | 34 files | Academic and technical documentation. Preserved. |
| **H. Generated Build Files** | `frontend/dist/`, `backend/target/` | Generated dirs | Ephemeral compilation output. Safe to clean via `mvn clean` or build scripts. |
| **I. Temporary Files** | Scratch browser execution scripts (`scratch/`) | 17 files | Temporary automation scripts from testing sessions. |
| **J. Backups** | Local SQL and CSV snapshots (`secure-commerce-ai/backup/`) | 2 files (`users_backup.csv`, `products_backup.csv`) | Historical data safety backups. Retained locally. |
| **K. Unused / Redundant Files** | Duplicate build outputs, orphaned test artifacts | 0 active source files | Cleaned safely without deleting business logic. |
| **L. Special Review Files** | `V21__marketplace_demo_reset_and_reseed.sql`, `DEMO_ACCOUNTS.md` | 2 files | See detailed analysis below. |

---

## 2. Directory Structure Breakdown

```
secure-commerce-ai/
├── DEMO_ACCOUNTS.md                    [G. Documentation / Demo Credential Guide - Preserved]
├── README.md                           [G. Documentation - Preserved]
├── RAZORPAY_INTEGRATION_GUIDE.md       [G. Documentation - Preserved]
├── RAZORPAY_RENDER_DEPLOYMENT_GUIDE.md [G. Documentation - Preserved]
├── RAZORPAY_TEST_RESULTS.md            [G. Documentation - Preserved]
├── render.yaml                         [B. Application Configuration - Preserved]
│
├── backup/                             [J. Local Backups - Preserved]
│   ├── products_backup.csv             (Pre-reseed product snapshot)
│   └── users_backup.csv                (Pre-reseed user snapshot)
│
├── docs/                               [G. Academic & Architecture Documentation - Preserved]
│   ├── api/
│   ├── architecture/
│   ├── database/
│   ├── deployment/
│   ├── requirements/
│   ├── research/
│   ├── semester-1-audit/
│   │   ├── SHOPIVO_ADMIN_FINAL_INTEGRATION_AUDIT.md
│   │   ├── SHOPIVO_CUSTOMER_FINAL_INTEGRATION_AUDIT.md
│   │   ├── SHOPIVO_SELLER_FINAL_INTEGRATION_AUDIT.md
│   │   └── ... (17 comprehensive audit files)
│   └── presentation-readiness.md
│
├── backend/                            [Core Spring Boot Backend]
│   ├── pom.xml                         [B. Build Configuration - Java 21, Spring Boot 3.4.3]
│   ├── .env                            [B. Local Secrets - Git-ignored, Preserved]
│   ├── .env.example                    [B. Public Environment Template - Preserved]
│   ├── run.ps1                         [B. Local Dev Runner - Preserved]
│   ├── target/                         [H. Ephemeral Build Output]
│   ├── data/
│   │   └── uploads/products/           [E. User Product Media - 96 image assets, Preserved]
│   └── src/
│       ├── main/java/com/securecommerce/platform/
│       │   ├── auth/                   (Authentication, JWT, Google OAuth, Password Reset)
│       │   ├── cart/                   (Shopping cart domain logic)
│       │   ├── category/               (Category hierarchy)
│       │   ├── common/                 (API response wrappers, global exceptions)
│       │   ├── coupon/                 (Discount codes)
│       │   ├── event/                  (Research telemetry & user event stream)
│       │   ├── mail/                   (Brevo SMTP JavaMailSender integration)
│       │   ├── notification/           (Transactional notifications)
│       │   ├── order/                  (Order state machine)
│       │   ├── payment/                (Razorpay gateway & webhooks)
│       │   ├── product/                (Catalog management & moderation)
│       │   ├── refund/                 (Refund lifecycle)
│       │   ├── returnrequest/          (Customer returns workflow)
│       │   ├── review/                 (Verified purchase ratings)
│       │   ├── security/               (Spring SecurityFilterChain, JWT filter, RateLimiter)
│       │   ├── user/                   (User entities & profiles)
│       │   └── wishlist/               (Customer wishlist domain)
│       ├── main/resources/
│       │   ├── application.yml         [B. Core Application Configuration]
│       │   └── db/migration/           [C. Flyway Migrations V1..V20, V21]
│       └── test/java/com/securecommerce/platform/
│           ├── auth/                   (GoogleAuthServiceTest, PasswordResetServiceTest)
│           └── ...                     (16 Integration test suites, 174 automated tests)
│
└── frontend/                           [Core React 19 + Vite 8.2.1 Frontend]
    ├── package.json                    [B. Dependencies - React 19, Redux Toolkit, Lucide Icons]
    ├── vite.config.js                  [B. Vite Bundler Configuration]
    ├── index.html                      [A. Single Page Application Shell]
    ├── dist/                           [H. Production Build Publish Directory]
    ├── public/
    │   ├── _redirects                  [B. Render SPA Fallback Rewrite Configuration]
    │   ├── favicon.svg                 [D. Brand Favicon]
    │   └── shopivo-logo.png            [D. High-Resolution Brand Identity]
    └── src/
        ├── App.jsx / main.jsx          [A. React Entry Point]
        ├── routes/                     (AppRoutes.jsx, ProtectedRoute.jsx, RoleRoute.jsx)
        ├── store/                      (Redux Toolkit slices: auth, cart, notification, theme)
        ├── services/                   (Axios API connectors: auth, product, order, payment)
        ├── layouts/                    (CustomerLayout, SellerLayout, AdminLayout, AuthLayout)
        ├── components/                 (Reusable UI: Navbar, Sidebar, ProductCard, Charts, Badges)
        └── pages/
            ├── public/                 (LandingPage.jsx)
            ├── auth/                   (PortalSelection, CustomerAuth, SellerAuth, AdminAuth, ForgotPassword)
            ├── customer/               (Dashboard, Products, ProductDetails, Cart, Checkout, Orders...)
            ├── seller/                 (Dashboard, Products, AddProduct, EditProduct, Inventory, Orders...)
            └── admin/                  (Dashboard, Users, Customers, Sellers, Products, Orders, Payments...)
```

---

## 3. Special Review Files & Handling Recommendations

### 1. `V21__marketplace_demo_reset_and_reseed.sql`
- **Current State:** Applied to the local development database; contains sample brand sellers, demo customers, and 37 products.
- **Production Risk:** Contains an unconditional `DELETE FROM users WHERE role <> 'ADMIN';` block.
- **Handling Recommendation:** **Do NOT stage or commit to GitHub** in its current form. Render will execute it on startup, resetting production data. Keep it local, or replace it with a non-destructive V21 migration before committing.

### 2. `DEMO_ACCOUNTS.md`
- **Current State:** Untracked reference file listing local demonstration credentials for customers and sellers.
- **Recommendation:** Retain locally for presentation purposes. Keep it out of Git staging to prevent credential confusion in production.

### 3. `backend/data/uploads/products/`
- **Current State:** Contains 96 user-uploaded product images created during manual seller testing.
- **Recommendation:** **Preserve 100% of these assets.** They are referenced by existing database products.

### 4. `scratch/`
- **Current State:** Contains 17 temporary browser automation scripts (`chrome_check_*`, `capture_rich_dashboards.js`, `inspect_colors.py`).
- **Recommendation:** Harmless local scratch files. Kept untracked.


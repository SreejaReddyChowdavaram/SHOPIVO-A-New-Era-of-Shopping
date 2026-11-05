# Software Requirements Specification (SRS)

## SecureCommerce AI — AI-Powered Secure E-Commerce Platform

**Document Version**: 1.0  
**Status**: Draft  
**Last Updated**: 2026  

---

## 1. Introduction

### 1.1 Purpose
This document defines the functional and non-functional requirements for the SecureCommerce AI platform — a full-stack e-commerce system with AI-powered fraud detection based on Cross-View Contrastive Graph Learning (CSGAD).

### 1.2 Scope
The system consists of:
- A React-based frontend serving Customer, Seller, and Admin interfaces
- A Spring Boot backend implementing business logic and REST APIs
- A PostgreSQL relational database
- A Python/FastAPI AI service for fraud detection (Semester 2)

### 1.3 Definitions
| Term | Definition |
|------|-----------|
| CSGAD | Cross-view Contrastive Graph learning for Anomaly Detection |
| JWT | JSON Web Token — stateless authentication mechanism |
| GNN | Graph Neural Network |
| Flyway | Database migration tool for version-controlled schema changes |

---

## 2. System Overview

### 2.1 User Roles

| Role | Description |
|------|-------------|
| Customer | End user who browses, purchases, and reviews products |
| Seller | Business user who lists products and fulfills orders |
| Admin | Platform operator who manages users, verifies sellers, monitors analytics |

### 2.2 High-Level Architecture

```
[React Frontend]
       ↕ REST/JSON
[Spring Boot Backend]
       ↕ JPA/SQL
[PostgreSQL Database]

[Spring Boot] ↔ REST ↔ [FastAPI AI Service]  (Semester 2)
```

---

## 3. Functional Requirements

### 3.1 Authentication
- FR-AUTH-01: Users can register with email and password
- FR-AUTH-02: Passwords must be hashed using BCrypt
- FR-AUTH-03: Login returns a signed JWT
- FR-AUTH-04: All protected endpoints validate JWT
- FR-AUTH-05: Role-based access control (CUSTOMER, SELLER, ADMIN)
- FR-AUTH-06: Forgot password flow via email OTP
- FR-AUTH-07: JWT expiry and refresh handling

### 3.2 Customer Features
- FR-CUST-01: Browse and search products
- FR-CUST-02: Filter products by category, price, rating
- FR-CUST-03: View product details and seller information
- FR-CUST-04: Add/remove items from cart
- FR-CUST-05: Add/remove items from wishlist
- FR-CUST-06: Complete checkout with address and payment
- FR-CUST-07: View order history and order details
- FR-CUST-08: Track order status
- FR-CUST-09: Submit and edit product reviews
- FR-CUST-10: Initiate returns and refunds
- FR-CUST-11: View notifications

### 3.3 Seller Features
- FR-SELL-01: Register as a seller (pending admin verification)
- FR-SELL-02: Add, edit, and delete products
- FR-SELL-03: Manage product inventory
- FR-SELL-04: View and process customer orders
- FR-SELL-05: View revenue reports
- FR-SELL-06: Respond to customer reviews

### 3.4 Admin Features
- FR-ADMIN-01: View platform analytics dashboard
- FR-ADMIN-02: Manage all users (view, suspend, activate)
- FR-ADMIN-03: Verify and approve/reject seller applications
- FR-ADMIN-04: Review and approve/reject seller products
- FR-ADMIN-05: Monitor all orders and payments
- FR-ADMIN-06: Generate reports
- FR-ADMIN-07: View and manage inventory

### 3.5 Fraud Detection (Semester 2)
- FR-FRAUD-01: Build transaction graph from e-commerce events
- FR-FRAUD-02: Compute fraud scores using CSGAD
- FR-FRAUD-03: Integrate fraud score into order approval workflow
- FR-FRAUD-04: Admin fraud alerts and investigation dashboard
- FR-FRAUD-05: Explainable fraud reasons per transaction
- FR-FRAUD-06: Customer and Seller trust scores

---

## 4. Non-Functional Requirements

### 4.1 Security
- NFR-SEC-01: All passwords stored as BCrypt hashes (never plaintext)
- NFR-SEC-02: JWT secrets never committed to Git
- NFR-SEC-03: HTTPS enforced in production
- NFR-SEC-04: SQL injection prevented by parameterized JPA queries
- NFR-SEC-05: CORS configured to allow only trusted origins

### 4.2 Performance
- NFR-PERF-01: Product search returns within 500ms for datasets up to 10,000 products
- NFR-PERF-02: Fraud score computed within 2 seconds per transaction (Semester 2)

### 4.3 Scalability
- NFR-SCALE-01: Modular monolith architecture supports future extraction to microservices
- NFR-SCALE-02: Database indexes on high-frequency query columns

### 4.4 Maintainability
- NFR-MAINT-01: Feature-oriented package structure (not layer-oriented)
- NFR-MAINT-02: No business logic in controllers
- NFR-MAINT-03: DTOs used for all API input/output (entities never exposed directly)
- NFR-MAINT-04: Flyway manages all schema changes (no `ddl-auto: create`)

---

## 5. System Constraints

- Java 21 LTS minimum for backend
- PostgreSQL 15+ for database
- Node.js 18+ for frontend build
- No real payment processing during development (sandbox mode only)

---

## 6. Revision History

| Version | Date | Author | Notes |
|---------|------|--------|-------|
| 1.0 | 2026 | Author | Initial draft |

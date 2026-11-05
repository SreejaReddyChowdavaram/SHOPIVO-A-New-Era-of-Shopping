# Semester 1 Research Data Collection & Persistent Event Logging Foundation

## 1. Executive Summary

This document describes the **Semester 1 Data-Collection Foundation** implemented in SHOPIVO.
SHOPIVO is a two-semester capstone research project targeting **Real-Time Fraud Detection in a Dynamic E-Commerce Website**.

- **Semester 1 Goal**: Build and stabilize the complete multi-vendor e-commerce platform and establish the persistent event logging foundation required for research data collection.
- **Semester 2 Goal**: Develop the machine learning fraud detection models, feature engineering pipelines, graph neural networks (CSGAD), risk scoring, and real-time fraud inference engines.

> [!IMPORTANT]
> **Semester 1 data-collection foundation completed; fraud detection/ML remains scoped to Semester 2.**
> No machine learning models, fraud scores, fraud probability calculations, blocking decision engines, or synthetic fraud injection are present in Semester 1. The platform functions strictly as an authentic e-commerce marketplace.

---

## 2. Event Collection Architecture

The event logging architecture is decoupled from business logic and runs asynchronously / transactionally isolated, ensuring zero disruption or latency impact on normal buyer/seller operations:

```
+-------------------------------------------------------+
|                 Frontend / Client                     |
|  (User action: Browse, Search, Cart, Checkout, etc.)  |
+-------------------------------------------------------+
                           |
                           | HTTP Request + Headers
                           | [X-Session-Id, User-Agent, Client IP]
                           v
+-------------------------------------------------------+
|                    REST API Layer                     |
|  (AuthController, ProductController, CartController,  |
|   OrderController, PaymentController, etc.)           |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
|                Business Service Layer                 |
|  (AuthService, CartServiceImpl, OrderServiceImpl,     |
|   PaymentServiceImpl, ReturnServiceImpl, etc.)        |
+-------------------------------------------------------+
                           |
                           | Reusable decoupled invocation
                           v
+-------------------------------------------------------+
|                 EventLoggingService                   |
|  - Request Context Resolution (IP, Session, UA)       |
|  - Strict Sensitive Field Redaction                   |
|  - REQUIRES_NEW Transaction Isolation                 |
|  - Non-blocking failure tolerance                     |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
|               PostgreSQL: user_events                 |
|  (Timestamped, structured, indexed event storage)     |
+-------------------------------------------------------+
                           |
                           | Admin Export Endpoint / CLI
                           v
+-------------------------------------------------------+
|               Historical Research Data                |
|  (events.csv, orders.csv, payments.csv, users.csv)    |
+-------------------------------------------------------+
```

---

## 3. Why Event Logging Exists (Bridging to Semester 2)

Standard e-commerce databases only capture current transactional state (e.g., an order is placed, a product is updated). Machine learning models for behavioral fraud detection require granular, timestamped user telemetry. 

Events collected in Semester 1 serve as the raw historical corpus for Semester 2 research:

```
Semester 1:
User Activity -> Persistent Event Log -> Timestamped Historical Database -> Research Export
                                                                                   |
                                                                                   v
Semester 2 (Future Work):
Raw Exported Data -> Preprocessing -> Behavioral Graph & Feature Engineering -> Fraud Labeling -> Model Training (CSGAD / GNN) -> Real-Time Inference
```

In Semester 2, researchers will extract behavioral features such as:
1. **Session Velocity**: Time between registration, product search, cart addition, and payment attempt.
2. **Device / Network Correlation**: Distinct session IDs or IP addresses per account, rapid IP switching during checkout.
3. **Cart Abandonment & Flux**: Ratios of items added vs. removed vs. purchased.
4. **Payment Retry Anomalies**: Burst attempts with differing methods or repeated signature/capture failures.
5. **Post-Purchase Patterns**: Accelerated return/refund claims following delivery.

---

## 4. Controlled Event Taxonomy

17 controlled event types across 9 domains are actively persisted:

| Category | Event Type | Trigger Point | Key Context Captured |
|---|---|---|---|
| **AUTH** | `LOGIN_SUCCESS` | Successful password verification | User ID, email, role, IP, User-Agent, session ID |
| **AUTH** | `LOGIN_FAILURE` | Invalid password, missing user, disabled account | Sanitized reason category (`INVALID_CREDENTIALS`, `USER_NOT_FOUND`, `ACCOUNT_DISABLED`), attempted email |
| **AUTH** | `LOGOUT` | User logs out of portal | User ID, session ID |
| **USER** | `REGISTRATION` | New customer/seller created | User ID, role, registered email |
| **PRODUCT** | `PRODUCT_VIEW` | Product detail page loaded | Product ID, category, user ID (if authenticated), session ID |
| **PRODUCT** | `PRODUCT_SEARCH` | Catalog query or category filter | Search keyword, category filter, session ID |
| **CART** | `CART_ITEM_ADDED` | Item added to shopping cart | Product ID, quantity, cart item reference |
| **CART** | `CART_ITEM_UPDATED` | Cart quantity modified | Cart item ID, updated quantity |
| **CART** | `CART_ITEM_REMOVED` | Item removed from cart | Cart item ID |
| **CHECKOUT** | `CHECKOUT_STARTED` | Customer navigates to checkout | Cart item count, customer ID, session ID |
| **PAYMENT** | `PAYMENT_ATTEMPTED` | Gateway order created / COD chosen | Order ID, payment amount, provider |
| **PAYMENT** | `PAYMENT_SUCCESS` | Signature verified / payment confirmed | Order ID, payment ID, gateway method |
| **PAYMENT** | `PAYMENT_FAILURE` | Signature mismatch / capture failed | Order ID, failure reason category |
| **ORDER** | `ORDER_PLACED` | Order created and inventory locked | Order ID, total amount, shipping city |
| **ORDER** | `ORDER_CANCELLED` | Order cancelled by buyer/seller/admin | Order ID, cancellation reason |
| **RETURN** | `RETURN_REQUESTED` | Customer initiates return | Return ID, order ID, refund amount, reason |
| **REFUND** | `REFUND_CREATED` | Admin/seller approves refund | Refund ID, order ID, refund transaction ID |
| **REVIEW** | `REVIEW_SUBMITTED` | Customer submits product review | Review ID, product ID, rating |

---

## 5. Database Schema: `user_events`

Created via Flyway migration `V18__create_user_events_table.sql`:

```sql
CREATE TABLE user_events (
    id               BIGSERIAL                PRIMARY KEY,
    user_id          BIGINT,
    user_email       VARCHAR(255),
    event_type       VARCHAR(50)              NOT NULL,
    event_timestamp  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    session_id       VARCHAR(100),
    reference_type   VARCHAR(50),
    reference_id     VARCHAR(100),
    ip_address       VARCHAR(45),
    user_agent       VARCHAR(500),
    metadata         TEXT,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_events_user_id ON user_events(user_id);
CREATE INDEX idx_user_events_user_email ON user_events(user_email);
CREATE INDEX idx_user_events_event_type ON user_events(event_type);
CREATE INDEX idx_user_events_session_id ON user_events(session_id);
CREATE INDEX idx_user_events_timestamp ON user_events(event_timestamp DESC);
CREATE INDEX idx_user_events_reference ON user_events(reference_type, reference_id);
```

---

## 6. Privacy & Security Safeguards

As an academic research platform, privacy and security principles are strictly enforced:
- **Zero Plaintext Secrets**: Passwords, password hashes, tokens, OTPs, CVVs, full card numbers, and API secrets are strictly blocked and redacted by regex filtering (`SENSITIVE_KEY_PATTERN`) before persistence.
- **Stateless Session Correlation**: `X-Session-Id` header is generated client-side and tracked in `sessionStorage`. JWT tokens are **never** used as session IDs.
- **Decoupled Failure Tolerance**: Any failure in the event logging subsystem is logged and safely handled; it never crashes customer transactions or rolls back order checkout.

---

## 7. Research Data Extraction

To prepare research datasets for Semester 2 analysis, two extraction interfaces are available:

### Admin REST API
```bash
# Export all events to CSV
GET /api/admin/events/export

# Export entity datasets for relational modeling
GET /api/admin/export/events
GET /api/admin/export/orders
GET /api/admin/export/payments
GET /api/admin/export/users
GET /api/admin/export/returns
GET /api/admin/export/refunds
GET /api/admin/export/reviews
```

### CLI Script
Located at `scripts/export_research_datasets.py`:
```bash
python scripts/export_research_datasets.py --db-url "postgresql://postgres:postgres@localhost:5432/securecommerce" --out-dir ./research_datasets
```
This extracts `events.csv`, `orders.csv`, `payments.csv`, `users.csv`, `returns.csv`, and `reviews.csv` for direct import into Pandas, PyTorch Geometric, or graph analysis notebooks in Semester 2.

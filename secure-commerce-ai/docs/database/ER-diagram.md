# Database Schema & Entity Relationship Documentation

**Project**: SHOPIVO — A New Era of Shopping  
**Database**: PostgreSQL 15+  
**Schema Manager**: Flyway Database Migrations (`V1` to `V14`)  
**ORM**: Hibernate 6.6 / Spring Data JPA (`ddl-auto = validate`)  

---

## 1. Flyway Version History

| Version | Migration Script | Purpose | Tables / Columns Altered |
|:---:|:---|:---|:---|
| **V1** | `V1__create_users_table.sql` | Core user identity & authentication | `users` |
| **V2** | `V2__create_categories_and_products.sql` | Taxonomy and catalog tables | `categories`, `products` |
| **V3** | `V3__seed_categories_and_products.sql` | Initial demo catalog taxonomy | Pre-seeded categories & products |
| **V4** | `V4__create_cart_tables.sql` | Customer session cart | `carts`, `cart_items` |
| **V5** | `V5__create_wishlist_tables.sql` | Customer saved wishlist | `wishlists`, `wishlist_items` |
| **V6** | `V6__create_addresses_table.sql` | Saved shipping addresses | `addresses` |
| **V7** | `V7__create_orders_tables.sql` | Order header and line-item snapshots | `orders`, `order_items` |
| **V8** | `V8__create_payments_table.sql` | Payment transactions & audit logs | `payments` |
| **V9** | `V9__add_cancellation_fields_to_orders.sql` | Cancellation tracking | Added `cancellation_reason`, `cancelled_at` to `orders` |
| **V10** | `V10__create_reviews_table.sql` | Verified purchase reviews & ratings | `reviews` |
| **V11** | `V11__create_returns_and_refunds_tables.sql` | Post-delivery returns & refunds | `return_requests`, `refund_records` |
| **V12** | `V12__create_notifications_table.sql` | Customer in-app alerts | `notifications` |
| **V13** | `V13__create_coupons_and_add_order_discount_fields.sql` | Promotional coupon engine | `coupons`, added `coupon_code`, `discount_amount`, `subtotal_amount` to `orders` |
| **V14** | `V14__add_rejection_reason_to_products.sql` | Moderation feedback | Added `rejection_reason` to `products` |

---

## 2. Entity Relationship Diagram (ERD)

```
                       ┌───────────────┐
                       │  categories   │
                       └───────┬───────┘
                               │ 1
                               │ has many
                               │ N
┌───────────┐ 1       N ┌──────▼────────┐ 1       N ┌───────────────┐
│   users   ├───────────►   products    ├───────────► reviews       │
│ (CUSTOMERS│ (as seller)└──────┬───────┘ (reviewed)└───────────────┘
│  SELLERS  │                   │                   (also refs users)
│  ADMINS)  │                   │ referenced in
│           │                   ├─────────────────────────┐
└─────┬─────┘                   │                         │
      │                         │                         │
      │ 1                       │ N                       │ N
      ├──────────► addresses    │                         │
      │ 1                       │                         │
      ├──────────► carts ───────┴─► cart_items            │
      │ 1                                                 │
      ├──────────► wishlists ─────► wishlist_items        │
      │ 1                                                 │
      ├──────────► notifications                          │
      │ 1                                                 │
      └──────────► orders ────────► order_items ◄─────────┘
                     │  1            ▲  1
                     │               │
                     ├───────────────┼────────► return_requests
                     │  1            │            │  1
                     │               │            │
                     ▼  N            │            ▼  1
                  payments           └─────── refund_records
```

---

## 3. Database Tables & Key Columns

### 3.1 `users`
- `id` BIGSERIAL PRIMARY KEY
- `email` VARCHAR(255) UNIQUE NOT NULL
- `password_hash` VARCHAR(255) NOT NULL
- `first_name` VARCHAR(100) NOT NULL
- `last_name` VARCHAR(100) NOT NULL
- `role` VARCHAR(20) NOT NULL (`CUSTOMER`, `SELLER`, `ADMIN`)
- `enabled` BOOLEAN NOT NULL DEFAULT TRUE (FALSE = account suspended)
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

### 3.2 `categories`
- `id` BIGSERIAL PRIMARY KEY
- `name` VARCHAR(100) NOT NULL
- `slug` VARCHAR(120) UNIQUE NOT NULL
- `description` TEXT

### 3.3 `products`
- `id` BIGSERIAL PRIMARY KEY
- `seller_id` BIGINT NOT NULL REFERENCES `users(id)`
- `category_id` BIGINT NOT NULL REFERENCES `categories(id)`
- `name` VARCHAR(255) NOT NULL
- `slug` VARCHAR(280) UNIQUE NOT NULL
- `description` TEXT
- `price` NUMERIC(10, 2) NOT NULL
- `stock_quantity` INT NOT NULL DEFAULT 0
- `image_url` VARCHAR(500)
- `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING' (`PENDING`, `APPROVED`, `REJECTED`)
- `rejection_reason` TEXT

### 3.4 `orders`
- `id` BIGSERIAL PRIMARY KEY
- `customer_id` BIGINT NOT NULL REFERENCES `users(id)`
- `status` VARCHAR(20) NOT NULL (`PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`)
- `subtotal_amount` NUMERIC(10, 2) NOT NULL
- `discount_amount` NUMERIC(10, 2) NOT NULL DEFAULT 0.00
- `coupon_code` VARCHAR(50)
- `total_amount` NUMERIC(10, 2) NOT NULL
- `shipping_full_name`, `shipping_phone`, `shipping_line1`, `shipping_line2`, `shipping_city`, `shipping_state`, `shipping_postal_code`, `shipping_country`
- `cancellation_reason` VARCHAR(255)
- `cancelled_at` TIMESTAMP WITH TIME ZONE
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

### 3.5 `order_items`
- `id` BIGSERIAL PRIMARY KEY
- `order_id` BIGINT NOT NULL REFERENCES `orders(id)` ON DELETE CASCADE
- `product_id` BIGINT REFERENCES `products(id)`
- `seller_id` BIGINT NOT NULL REFERENCES `users(id)`
- `product_name_snapshot` VARCHAR(255) NOT NULL
- `price_snapshot` NUMERIC(10, 2) NOT NULL
- `quantity` INT NOT NULL
- `line_total` NUMERIC(10, 2) NOT NULL

### 3.6 `payments`
- `id` BIGSERIAL PRIMARY KEY
- `order_id` BIGINT NOT NULL REFERENCES `orders(id)`
- `customer_id` BIGINT NOT NULL REFERENCES `users(id)`
- `transaction_id` VARCHAR(100) UNIQUE NOT NULL
- `amount` NUMERIC(10, 2) NOT NULL
- `payment_method` VARCHAR(20) NOT NULL (`CARD`, `UPI`)
- `payment_gateway` VARCHAR(50) NOT NULL DEFAULT 'SANDBOX_SECUREPAY'
- `payment_status` VARCHAR(20) NOT NULL (`SUCCESS`, `FAILED`)
- `card_last4` VARCHAR(4)
- `upi_id` VARCHAR(100)
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

### 3.7 `reviews`
- `id` BIGSERIAL PRIMARY KEY
- `product_id` BIGINT NOT NULL REFERENCES `products(id)` ON DELETE CASCADE
- `user_id` BIGINT NOT NULL REFERENCES `users(id)` ON DELETE CASCADE
- `rating` INT NOT NULL CHECK (rating BETWEEN 1 AND 5)
- `comment` TEXT
- `verified_purchase` BOOLEAN NOT NULL DEFAULT FALSE
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
- CONSTRAINT: `uk_reviews_product_user` UNIQUE (product_id, user_id)

### 3.8 `return_requests` & `refund_records`
- `return_requests`: `id`, `order_id`, `order_item_id`, `customer_id`, `reason`, `status` (`REQUESTED`, `APPROVED`, `REJECTED`), `created_at`
- `refund_records`: `id`, `return_request_id`, `order_id`, `customer_id`, `refund_amount`, `refund_status` (`SUCCESS`), `refund_method`, `created_at`

### 3.9 `coupons`
- `id` BIGSERIAL PRIMARY KEY
- `code` VARCHAR(50) UNIQUE NOT NULL
- `discount_type` VARCHAR(20) NOT NULL (`PERCENTAGE`, `FIXED_AMOUNT`)
- `discount_value` NUMERIC(10, 2) NOT NULL
- `min_order_amount` NUMERIC(10, 2) DEFAULT 0.00
- `max_discount_amount` NUMERIC(10, 2)
- `active` BOOLEAN NOT NULL DEFAULT TRUE
- `expires_at` TIMESTAMP WITH TIME ZONE

### 3.10 `notifications`
- `id` BIGSERIAL PRIMARY KEY
- `user_id` BIGINT NOT NULL REFERENCES `users(id)` ON DELETE CASCADE
- `type` VARCHAR(50) NOT NULL
- `title` VARCHAR(255) NOT NULL
- `message` TEXT NOT NULL
- `reference_type` VARCHAR(50)
- `reference_id` BIGINT
- `is_read` BOOLEAN NOT NULL DEFAULT FALSE
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

---

## 4. Immutable Snapshot Design

Shopivo enforces historical pricing snapshotting:
1. `order_items` stores `price_snapshot` and `product_name_snapshot` captured at the exact moment of order placement.
2. If a seller subsequently changes product price or name, historical orders and invoices remain legally accurate and unchanged.
3. Order address fields are copied as scalar values onto `orders`, ensuring changes to a user's address book do not alter past shipment manifests.

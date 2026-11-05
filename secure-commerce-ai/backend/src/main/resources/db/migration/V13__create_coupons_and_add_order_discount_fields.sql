-- ============================================================================
-- V13: Create coupons, coupon_usages tables and add discount fields to orders (Phase C11)
-- ============================================================================

-- 1. Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    discount_type VARCHAR(30) NOT NULL,
    discount_value NUMERIC(10, 2) NOT NULL,
    minimum_order_amount NUMERIC(12, 2) DEFAULT 0.00,
    maximum_discount_amount NUMERIC(12, 2),
    usage_limit INT,
    per_customer_limit INT DEFAULT 1,
    used_count INT DEFAULT 0,
    start_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(active);

-- 2. Create coupon_usages table for audit & per-customer limit enforcement
CREATE TABLE IF NOT EXISTS coupon_usages (
    id BIGSERIAL PRIMARY KEY,
    coupon_id BIGINT NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    customer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    discount_applied NUMERIC(12, 2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_coupon_usages_coupon ON coupon_usages(coupon_id);
CREATE INDEX idx_coupon_usages_customer ON coupon_usages(customer_id);
CREATE INDEX idx_coupon_usages_order ON coupon_usages(order_id);
CREATE INDEX idx_coupon_usages_coupon_customer ON coupon_usages(coupon_id, customer_id);

-- 3. Add pricing snapshot fields to orders table
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);

-- Backfill subtotal_amount for existing orders
UPDATE orders
SET subtotal_amount = total_amount
WHERE subtotal_amount IS NULL;

-- 4. Seed academic sandbox test coupons
INSERT INTO coupons (code, description, discount_type, discount_value, minimum_order_amount, maximum_discount_amount, usage_limit, per_customer_limit, active, created_at, updated_at)
VALUES
    ('SAVE10', 'Get 10% OFF on all orders above ₹500 (Max ₹1,000)', 'PERCENTAGE', 10.00, 500.00, 1000.00, 1000, 5, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('FLAT100', 'Flat ₹100 OFF on orders above ₹499', 'FIXED_AMOUNT', 100.00, 499.00, 100.00, 1000, 5, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('WELCOME50', 'Flat ₹50 OFF on orders above ₹200 for new & returning customers', 'FIXED_AMOUNT', 50.00, 200.00, 50.00, 1000, 5, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;

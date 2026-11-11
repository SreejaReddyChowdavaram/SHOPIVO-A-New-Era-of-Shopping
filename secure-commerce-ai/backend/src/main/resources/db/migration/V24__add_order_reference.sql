-- ============================================================================
-- V24: Add unique alphanumeric order_reference to orders table
-- ============================================================================
-- Format: SHV- + 8 uppercase alphanumeric characters (e.g. SHV-A8K29X7P).

ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_reference VARCHAR(32);

-- Backfill existing orders with unique references derived deterministically from order ID
UPDATE orders
SET order_reference = 'SHV-' || LPAD(TO_HEX(id), 4, '0') || UPPER(SUBSTRING(MD5(id::TEXT) FROM 1 FOR 4))
WHERE order_reference IS NULL;

-- Enforce NOT NULL and UNIQUE constraint
ALTER TABLE orders ALTER COLUMN order_reference SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_order_reference ON orders(order_reference);


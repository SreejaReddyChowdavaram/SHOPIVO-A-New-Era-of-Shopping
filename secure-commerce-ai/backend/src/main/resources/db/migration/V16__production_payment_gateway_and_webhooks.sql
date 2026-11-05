-- V16__production_payment_gateway_and_webhooks.sql
-- Production-style Razorpay Payment Gateway integration (Semester 1)
-- Adds provider metadata, event-level webhook idempotency, and payment expiry tracking.

-- 1. Extend payments table
ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS provider VARCHAR(50) NOT NULL DEFAULT 'RAZORPAY',
    ADD COLUMN IF NOT EXISTS gateway_method VARCHAR(30),
    ADD COLUMN IF NOT EXISTS provider_order_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS provider_payment_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS provider_signature_verified BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS refund_provider_id VARCHAR(100);

-- Backfill historical demo records to canonical HISTORICAL_DEMO identifier
UPDATE payments
SET provider = 'HISTORICAL_DEMO'
WHERE payment_gateway = 'SANDBOX_SECUREPAY' OR provider = 'RAZORPAY' AND transaction_id LIKE 'SANDBOX-%';

CREATE INDEX IF NOT EXISTS idx_payments_provider_order_id ON payments(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id ON payments(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_refund_provider_id ON payments(refund_provider_id);

-- 2. Extend orders table with payment window expiry
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMP WITH TIME ZONE;

UPDATE orders
SET payment_expires_at = created_at + INTERVAL '30 minutes'
WHERE status = 'PENDING' AND payment_expires_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_payment_expires_at ON orders(payment_expires_at);

-- 3. Dedicated payment_webhook_events table for event-level idempotency and audit
CREATE TABLE IF NOT EXISTS payment_webhook_events (
    id                BIGSERIAL                PRIMARY KEY,
    provider          VARCHAR(50)              NOT NULL DEFAULT 'RAZORPAY',
    event_id          VARCHAR(100)             NOT NULL UNIQUE,
    event_type        VARCHAR(100)             NOT NULL,
    payload           TEXT                     NOT NULL,
    processing_status VARCHAR(30)              NOT NULL,
    error_message     VARCHAR(500),
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    processed_at      TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON payment_webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON payment_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON payment_webhook_events(created_at);

COMMENT ON TABLE payment_webhook_events IS 'Audit and idempotency log for incoming payment provider webhooks';
COMMENT ON COLUMN payment_webhook_events.event_id IS 'Provider unique event ID (e.g. X-Razorpay-Event-Id header or payload event ID)';
COMMENT ON COLUMN payment_webhook_events.processing_status IS 'RECEIVED, PROCESSED, IGNORED_DUPLICATE, IGNORED_OUT_OF_ORDER, FAILED';

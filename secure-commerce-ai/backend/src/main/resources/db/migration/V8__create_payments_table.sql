-- V8__create_payments_table.sql
-- Phase C5: Customer Payment Sandbox Gateway & Payment Status Lifecycle

CREATE TABLE payments (
    id                 BIGSERIAL                PRIMARY KEY,
    order_id           BIGINT                   NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id        BIGINT                   NOT NULL REFERENCES users(id),
    payment_method     VARCHAR(30)              NOT NULL,
    payment_status     VARCHAR(30)              NOT NULL,
    transaction_id     VARCHAR(100)             NOT NULL UNIQUE,
    amount             NUMERIC(12, 2)           NOT NULL CHECK (amount >= 0),
    payment_gateway    VARCHAR(50)              NOT NULL DEFAULT 'SANDBOX_SECUREPAY',
    card_last4         VARCHAR(4),
    upi_id_snapshot    VARCHAR(100),
    failure_reason     VARCHAR(255),
    created_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_status ON payments(payment_status);

COMMENT ON TABLE payments IS 'Customer payment transactions (Sandbox simulated gateway & status lifecycle)';
COMMENT ON COLUMN payments.payment_method IS 'CARD, UPI, NET_BANKING, COD';
COMMENT ON COLUMN payments.payment_status IS 'INITIATED, SUCCESS, FAILED, REFUNDED';
COMMENT ON COLUMN payments.card_last4 IS 'Only last 4 digits of card stored for display (never full PAN or CVV)';

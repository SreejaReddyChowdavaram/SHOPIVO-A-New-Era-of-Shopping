-- V17__add_payment_refund_requested_and_refund_lifecycle.sql
-- SHOPIVO — Payment Refund Lifecycle Enhancement (Semester 1)
-- Documents the REFUND_REQUESTED state addition and enhances refund lookup indices.

-- 1. Ensure refund indexes exist for rapid reconciliation
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(refund_status);
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_customer_id ON refunds(customer_id);

-- 2. Audit comments documenting payment status monotonic state machine
COMMENT ON COLUMN payments.payment_status IS 'Lifecycle: INITIATED -> SUCCESS / FAILED / CANCELLED -> REFUND_REQUESTED -> REFUND_PROCESSING -> REFUNDED';
COMMENT ON COLUMN refunds.refund_status IS 'Multi-stage: REFUND_REQUESTED, REFUND_PROCESSING, REFUNDED, REFUND_FAILED';

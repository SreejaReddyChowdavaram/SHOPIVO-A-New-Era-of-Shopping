-- V25: Add Seller Refund Approval Workflow
-- Enforces mandatory seller approval before platform-level refund processing.

ALTER TABLE return_requests
    ADD COLUMN IF NOT EXISTS seller_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS seller_approval_status VARCHAR(50) NOT NULL DEFAULT 'PENDING_SELLER_APPROVAL',
    ADD COLUMN IF NOT EXISTS seller_approved_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS seller_rejected_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS seller_rejection_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_returns_seller_id ON return_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_returns_seller_approval_status ON return_requests(seller_approval_status);

ALTER TABLE refunds
    ADD COLUMN IF NOT EXISTS provider_refund_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS failure_reason TEXT,
    ADD COLUMN IF NOT EXISTS destination VARCHAR(255);

-- Backfill seller_id from order_items if present
UPDATE return_requests rr
SET seller_id = oi.seller_id
FROM order_items oi
WHERE rr.order_item_id = oi.id AND rr.seller_id IS NULL;

-- Backfill seller_id from first order item for full-order returns
UPDATE return_requests rr
SET seller_id = (
    SELECT oi.seller_id FROM order_items oi WHERE oi.order_id = rr.order_id LIMIT 1
)
WHERE rr.seller_id IS NULL;


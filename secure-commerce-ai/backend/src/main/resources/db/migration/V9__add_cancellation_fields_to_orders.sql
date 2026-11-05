-- V9__add_cancellation_fields_to_orders.sql
-- Phase C6: Customer Order Cancellation & Reason Auditing

ALTER TABLE orders
    ADD COLUMN cancellation_reason VARCHAR(255),
    ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN orders.cancellation_reason IS 'Reason specified by customer or admin upon cancellation';
COMMENT ON COLUMN orders.cancelled_at IS 'Timestamp when order was transitioned to CANCELLED';

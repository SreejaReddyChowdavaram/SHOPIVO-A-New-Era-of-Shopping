-- V11: Create returns and refunds tables

CREATE TABLE return_requests (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_item_id BIGINT REFERENCES order_items(id) ON DELETE SET NULL,
    reason VARCHAR(100) NOT NULL,
    return_note TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'REQUESTED',
    refund_amount NUMERIC(12, 2) NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE refunds (
    id BIGSERIAL PRIMARY KEY,
    return_id BIGINT NOT NULL REFERENCES return_requests(id) ON DELETE CASCADE,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_id BIGINT REFERENCES payments(id) ON DELETE SET NULL,
    refund_amount NUMERIC(12, 2) NOT NULL,
    refund_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    refund_transaction_id VARCHAR(100) NOT NULL UNIQUE,
    payment_method VARCHAR(30) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_returns_order_id ON return_requests(order_id);
CREATE INDEX idx_returns_customer_id ON return_requests(customer_id);
CREATE INDEX idx_returns_status ON return_requests(status);
CREATE INDEX idx_refunds_return_id ON refunds(return_id);
CREATE INDEX idx_refunds_order_id ON refunds(order_id);
CREATE INDEX idx_refunds_customer_id ON refunds(customer_id);

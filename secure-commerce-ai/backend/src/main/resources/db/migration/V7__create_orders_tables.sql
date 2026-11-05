-- V7__create_orders_tables.sql
-- Orders and line items with immutable snapshots

CREATE TABLE orders (
    id                   BIGSERIAL                PRIMARY KEY,
    customer_id          BIGINT                   NOT NULL REFERENCES users(id),
    shipping_full_name   VARCHAR(150)             NOT NULL,
    shipping_phone       VARCHAR(30)              NOT NULL,
    shipping_line1       VARCHAR(255)             NOT NULL,
    shipping_line2       VARCHAR(255),
    shipping_city        VARCHAR(100)             NOT NULL,
    shipping_state       VARCHAR(100)             NOT NULL,
    shipping_postal_code VARCHAR(20)              NOT NULL,
    shipping_country     VARCHAR(100)             NOT NULL,
    status               VARCHAR(30)              NOT NULL DEFAULT 'PENDING',
    total_amount         NUMERIC(12, 2)           NOT NULL CHECK (total_amount >= 0),
    created_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

CREATE TABLE order_items (
    id                    BIGSERIAL      PRIMARY KEY,
    order_id              BIGINT         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id            BIGINT         NOT NULL REFERENCES products(id),
    seller_id             BIGINT         NOT NULL REFERENCES users(id),
    product_name_snapshot VARCHAR(255)   NOT NULL,
    price_snapshot        NUMERIC(10, 2) NOT NULL CHECK (price_snapshot >= 0),
    quantity              INT            NOT NULL CHECK (quantity > 0),
    line_total            NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0),
    created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_seller_id ON order_items(seller_id);

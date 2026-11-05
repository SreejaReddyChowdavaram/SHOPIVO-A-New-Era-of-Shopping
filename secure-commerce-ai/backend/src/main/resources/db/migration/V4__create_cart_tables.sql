-- V4__create_cart_tables.sql
-- One cart per customer (1:1 via UNIQUE on user_id).
-- Cart items reference both the cart and the product.
-- price_at_addition snapshots the price so later price edits don't change existing carts.

CREATE TABLE carts (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_carts_user ON carts(user_id);

CREATE TABLE cart_items (
    id                  BIGSERIAL PRIMARY KEY,
    cart_id             BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id          BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity            INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    price_at_addition   NUMERIC(12, 2) NOT NULL,
    added_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure a product can only appear once per cart
    CONSTRAINT uq_cart_product UNIQUE (cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart    ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);

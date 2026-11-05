-- V2__create_categories_and_products.sql
-- Creates the categories and products tables.
-- Flyway runs this AFTER V1 (users table already exists).

-- ─── Categories ──────────────────────────────────────────────
CREATE TABLE categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    parent_id   BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_slug     ON categories(slug);
CREATE INDEX idx_categories_parent   ON categories(parent_id);
CREATE INDEX idx_categories_active   ON categories(is_active);

-- ─── Products ────────────────────────────────────────────────
CREATE TABLE products (
    id              BIGSERIAL PRIMARY KEY,
    seller_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id     BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(280) NOT NULL UNIQUE,
    description     TEXT,
    price           NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    stock_quantity  INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    image_url       VARCHAR(500),
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_seller     ON products(seller_id);
CREATE INDEX idx_products_category   ON products(category_id);
CREATE INDEX idx_products_status     ON products(status);
CREATE INDEX idx_products_name_trgm  ON products USING gin (to_tsvector('english', name || ' ' || COALESCE(description, '')));

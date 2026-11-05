-- V6__create_addresses_table.sql
-- Customer shipping addresses

CREATE TABLE addresses (
    id          BIGSERIAL       PRIMARY KEY,
    user_id     BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label       VARCHAR(50)     NOT NULL DEFAULT 'Home',
    full_name   VARCHAR(150)    NOT NULL,
    phone       VARCHAR(30)     NOT NULL,
    line1       VARCHAR(255)    NOT NULL,
    line2       VARCHAR(255),
    city        VARCHAR(100)    NOT NULL,
    state       VARCHAR(100)    NOT NULL,
    postal_code VARCHAR(20)     NOT NULL,
    country     VARCHAR(100)    NOT NULL DEFAULT 'India',
    is_default  BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);

-- V1__create_users_table.sql
-- Flyway Migration: Version 1
--
-- WHY FLYWAY?
--   Flyway tracks which SQL scripts have run using the flyway_schema_history table.
--   On every startup, it checks that table and runs any new V*.sql files.
--   This means the DB schema is version-controlled alongside the code.
--
-- NAMING CONVENTION:
--   V{version}__{description}.sql  (double underscore required)
--   V1, V2, V3... are run in order, once each, never repeated.
--   Never modify a migration that has already run — add a new one instead.
--
-- TABLE DESIGN DECISIONS:
--   email UNIQUE NOT NULL          → enforced at DB level, not just application level
--   password_hash VARCHAR(255)     → BCrypt output is always 60 chars; 255 gives headroom
--   role VARCHAR(20)               → stored as string, mapped to Java enum by JPA
--   enabled BOOLEAN DEFAULT TRUE   → soft-disable accounts without deleting data
--   created_at / updated_at        → audit trail, set by JPA @CreationTimestamp

CREATE TABLE users (
    id            BIGSERIAL       PRIMARY KEY,
    email         VARCHAR(255)    NOT NULL UNIQUE,
    password_hash VARCHAR(255)    NOT NULL,
    first_name    VARCHAR(100)    NOT NULL,
    last_name     VARCHAR(100)    NOT NULL,
    role          VARCHAR(20)     NOT NULL DEFAULT 'CUSTOMER',
    enabled       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for login lookups (finding user by email on every login)
CREATE INDEX idx_users_email ON users(email);

-- Index for role-based queries (admin listing all customers/sellers)
CREATE INDEX idx_users_role ON users(role);

-- Constraint: role must be one of the known values
ALTER TABLE users
    ADD CONSTRAINT chk_users_role
    CHECK (role IN ('CUSTOMER', 'SELLER', 'ADMIN'));

COMMENT ON TABLE users IS 'Platform user accounts — all roles share this table';
COMMENT ON COLUMN users.password_hash IS 'BCrypt hashed password — NEVER store plain text';
COMMENT ON COLUMN users.enabled IS 'FALSE = account suspended, not deleted';

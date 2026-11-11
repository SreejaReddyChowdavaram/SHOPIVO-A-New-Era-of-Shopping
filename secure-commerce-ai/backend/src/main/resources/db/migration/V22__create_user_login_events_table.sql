-- ==============================================================================
-- V22__create_user_login_events_table.sql
-- SHOPIVO — Login Activity, Trusted Proxy Resolution & Audit Telemetry
-- ==============================================================================
-- Idempotent and non-destructive:
--   • Preserves all existing users, sellers, products, orders, payments, reviews
--   • Adds login tracking counters and timestamps to users table
--   • Creates user_login_events table with high-efficiency compound indexes
-- ==============================================================================

-- 1. Extend users table for persistent successful-login metrics
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INT DEFAULT 0 NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_location VARCHAR(150);

-- 2. Create user_login_events table for comprehensive authentication telemetry
CREATE TABLE IF NOT EXISTS user_login_events (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255) NOT NULL,
    user_role VARCHAR(50),
    auth_method VARCHAR(50) NOT NULL,
    login_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    ip_version VARCHAR(10) NOT NULL,
    country VARCHAR(100),
    state_region VARCHAR(100),
    city VARCHAR(100),
    location_status VARCHAR(50) DEFAULT 'UNAVAILABLE' NOT NULL,
    browser VARCHAR(100),
    operating_system VARCHAR(100),
    device_type VARCHAR(50),
    login_result VARCHAR(20) NOT NULL,
    failure_reason VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. High-performance audit indexes
CREATE INDEX IF NOT EXISTS idx_login_events_user_id ON user_login_events(user_id);
CREATE INDEX IF NOT EXISTS idx_login_events_email ON user_login_events(user_email);
CREATE INDEX IF NOT EXISTS idx_login_events_result_timestamp ON user_login_events(login_result, login_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_login_events_ip ON user_login_events(ip_address);


-- ============================================================================
-- V23: Add auth_provider to users table
-- ============================================================================
-- Supports LOCAL (email/password), GOOGLE (Google OAuth), and LINKED (both methods).
-- Defaults to 'LOCAL' for all existing accounts.

ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL';

-- Add index on auth_provider for fast lookup and telemetry
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);


-- ==============================================================================
-- V20__create_password_reset_otps_table.sql
-- SHOPIVO — Password Reset OTP Verification Records
-- ==============================================================================

CREATE TABLE IF NOT EXISTS password_reset_otps (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    portal_role VARCHAR(50) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    reset_token VARCHAR(255),
    purpose VARCHAR(50) NOT NULL DEFAULT 'PASSWORD_RESET',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    consumed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance and lookup speed
CREATE INDEX idx_password_reset_otps_email_role ON password_reset_otps(email, portal_role);
CREATE INDEX idx_password_reset_otps_user_id ON password_reset_otps(user_id);
CREATE INDEX idx_password_reset_otps_expires_at ON password_reset_otps(expires_at);
CREATE INDEX idx_password_reset_otps_reset_token ON password_reset_otps(reset_token);


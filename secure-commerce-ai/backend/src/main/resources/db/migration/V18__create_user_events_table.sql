-- V18__create_user_events_table.sql
-- Flyway Migration: Version 18
--
-- RESEARCH DATA FOUNDATION (Semester 1):
--   This table provides the persistent event logging foundation required for Semester 2
--   behavioral fraud detection research. It records user interactions, transactional milestones,
--   and session correlations in a structured, timestamped format.
--
-- DESIGN DECISIONS:
--   user_id NULLABLE             → Supports anonymous guest browsing, product searches, and failed logins
--   session_id VARCHAR(100)      → Lightweight session/request correlation identifier (X-Session-Id)
--   reference_type/reference_id  → Generic entity link (e.g. ORDER / 42, PRODUCT / 10, CART_ITEM / 3)
--   ip_address VARCHAR(45)       → Privacy-conscious IP (IPv4 or IPv6 compatible)
--   user_agent VARCHAR(500)      → Standard client agent header, truncated to prevent overflow
--   metadata TEXT                → Sanitized JSON context (strictly excluding passwords, secrets, card data)
--   event_timestamp              → ISO-8601 UTC timestamp for chronological sequence modeling

CREATE TABLE user_events (
    id               BIGSERIAL                PRIMARY KEY,
    user_id          BIGINT,
    user_email       VARCHAR(255),
    event_type       VARCHAR(50)              NOT NULL,
    event_timestamp  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    session_id       VARCHAR(100),
    reference_type   VARCHAR(50),
    reference_id     VARCHAR(100),
    ip_address       VARCHAR(45),
    user_agent       VARCHAR(500),
    metadata         TEXT,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for user activity history lookups
CREATE INDEX idx_user_events_user_id ON user_events(user_id);

-- Index for user email lookups
CREATE INDEX idx_user_events_user_email ON user_events(user_email);

-- Index for event-type filtering and behavioral cohort queries
CREATE INDEX idx_user_events_event_type ON user_events(event_type);

-- Index for session correlation analysis
CREATE INDEX idx_user_events_session_id ON user_events(session_id);

-- Index for temporal ordering and dataset export slicing
CREATE INDEX idx_user_events_timestamp ON user_events(event_timestamp DESC);

-- Composite index for entity-specific lifecycle queries
CREATE INDEX idx_user_events_reference ON user_events(reference_type, reference_id);

COMMENT ON TABLE user_events IS 'Persistent research event log for user activity, transaction lifecycle, and behavioral fraud analysis';
COMMENT ON COLUMN user_events.user_id IS 'Platform user ID; NULL for unauthenticated/guest sessions or failed logins with unknown email';
COMMENT ON COLUMN user_events.event_type IS 'Controlled event type: LOGIN_SUCCESS, LOGIN_FAILURE, CART_ITEM_ADDED, etc.';
COMMENT ON COLUMN user_events.session_id IS 'Client session or request correlation identifier (X-Session-Id)';
COMMENT ON COLUMN user_events.metadata IS 'Sanitized JSON context metadata (free of passwords, CVVs, tokens)';

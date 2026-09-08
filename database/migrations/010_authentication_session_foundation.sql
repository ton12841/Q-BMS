-- Q BMS v2.0.18.0
-- Authentication Routing + Session Foundation
--
-- Stores only a SHA-256 hash of the browser session token.
-- Raw session tokens remain browser-only in an HttpOnly cookie.

CREATE TABLE IF NOT EXISTS auth_sessions (
    id BIGSERIAL PRIMARY KEY,
    token_hash CHAR(64) NOT NULL UNIQUE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,

    session_kind VARCHAR(40) NOT NULL DEFAULT 'USER',
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',

    expires_at TIMESTAMPTZ NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,

    ip_address VARCHAR(80),
    user_agent TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_auth_sessions_kind
      CHECK (session_kind IN ('USER', 'DEVELOPMENT_PREVIEW')),
    CONSTRAINT chk_auth_sessions_status
      CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
    CONSTRAINT chk_auth_sessions_user_kind
      CHECK (
        (session_kind = 'USER' AND user_id IS NOT NULL)
        OR session_kind = 'DEVELOPMENT_PREVIEW'
      )
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id
    ON auth_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_status_expires
    ON auth_sessions(status, expires_at);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_last_seen
    ON auth_sessions(last_seen_at);

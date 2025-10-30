-- Migration to add admin authentication with biometric support
-- Execute this after the main schema.sql

-- Create admin_users table for admin authentication
CREATE TABLE IF NOT EXISTS admin_users (
    id BIGSERIAL PRIMARY KEY,
    admin_id VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(20) DEFAULT 'ADMIN' CHECK (role IN ('ADMIN', 'SUPER_ADMIN')),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP,
    
    -- Biometric fields
    has_biometric BOOLEAN DEFAULT FALSE,
    biometric_enrolled_date TIMESTAMP,
    fingerprint_template_id VARCHAR(255), -- Reference to biometric service
    
    CONSTRAINT uk_admin_users_admin_id UNIQUE (admin_id),
    CONSTRAINT uk_admin_users_username UNIQUE (username)
);

-- Create admin_login_logs table for audit trail
CREATE TABLE IF NOT EXISTS admin_login_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_id VARCHAR(50) NOT NULL,
    login_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    login_method VARCHAR(20) DEFAULT 'BIOMETRIC' CHECK (login_method IN ('BIOMETRIC', 'PASSWORD', 'TOKEN')),
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILED', 'BLOCKED')),
    failure_reason TEXT,
    
    FOREIGN KEY (admin_id) REFERENCES admin_users(admin_id) ON DELETE CASCADE
);

-- Create admin_sessions table for session management
CREATE TABLE IF NOT EXISTS admin_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    admin_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (admin_id) REFERENCES admin_users(admin_id) ON DELETE CASCADE,
    CONSTRAINT uk_admin_sessions_session_id UNIQUE (session_id)
);

-- Insert default admin user
INSERT INTO admin_users (
    admin_id, 
    username, 
    email, 
    role, 
    status,
    has_biometric
) VALUES (
    'ADMIN001',
    'admin',
    'admin@voteguard.com',
    'SUPER_ADMIN',
    'ACTIVE',
    FALSE
) ON CONFLICT (admin_id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_admin_id ON admin_users(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON admin_users(status);
CREATE INDEX IF NOT EXISTS idx_admin_login_logs_admin_id ON admin_login_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_login_logs_timestamp ON admin_login_logs(login_timestamp);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_active ON admin_sessions(is_active);

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM admin_sessions 
    WHERE expires_at < CURRENT_TIMESTAMP OR is_active = FALSE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE admin_users IS 'Admin users with biometric authentication support';
COMMENT ON TABLE admin_login_logs IS 'Audit trail for admin login attempts';
COMMENT ON TABLE admin_sessions IS 'Active admin sessions for session management';
COMMENT ON FUNCTION cleanup_expired_admin_sessions() IS 'Function to clean up expired or inactive admin sessions';
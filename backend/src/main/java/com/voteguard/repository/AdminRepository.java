package com.voteguard.repository;

import com.voteguard.model.AdminUser;
import com.voteguard.model.AdminSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class AdminRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // RowMapper for AdminUser
    private final RowMapper<AdminUser> adminUserRowMapper = new RowMapper<AdminUser>() {
        @Override
        public AdminUser mapRow(ResultSet rs, int rowNum) throws SQLException {
            AdminUser admin = new AdminUser();
            admin.setId(rs.getLong("id"));
            admin.setAdminId(rs.getString("admin_id"));
            admin.setUsername(rs.getString("username"));
            admin.setEmail(rs.getString("email"));
            admin.setRole(rs.getString("role"));
            admin.setStatus(rs.getString("status"));
            admin.setCreatedDate(rs.getTimestamp("created_date") != null ? 
                rs.getTimestamp("created_date").toLocalDateTime() : null);
            admin.setLastLogin(rs.getTimestamp("last_login") != null ? 
                rs.getTimestamp("last_login").toLocalDateTime() : null);
            admin.setLoginAttempts(rs.getInt("login_attempts"));
            admin.setAccountLockedUntil(rs.getTimestamp("account_locked_until") != null ? 
                rs.getTimestamp("account_locked_until").toLocalDateTime() : null);
            admin.setHasBiometric(rs.getBoolean("has_biometric"));
            admin.setBiometricEnrolledDate(rs.getTimestamp("biometric_enrolled_date") != null ? 
                rs.getTimestamp("biometric_enrolled_date").toLocalDateTime() : null);
            admin.setFingerprintTemplateId(rs.getString("fingerprint_template_id"));
            return admin;
        }
    };

    // RowMapper for AdminSession
    private final RowMapper<AdminSession> adminSessionRowMapper = new RowMapper<AdminSession>() {
        @Override
        public AdminSession mapRow(ResultSet rs, int rowNum) throws SQLException {
            AdminSession session = new AdminSession();
            session.setId(rs.getLong("id"));
            session.setSessionId(rs.getString("session_id"));
            session.setAdminId(rs.getString("admin_id"));
            session.setCreatedAt(rs.getTimestamp("created_at") != null ? 
                rs.getTimestamp("created_at").toLocalDateTime() : null);
            session.setExpiresAt(rs.getTimestamp("expires_at") != null ? 
                rs.getTimestamp("expires_at").toLocalDateTime() : null);
            session.setIpAddress(rs.getString("ip_address"));
            session.setUserAgent(rs.getString("user_agent"));
            session.setIsActive(rs.getBoolean("is_active"));
            session.setLastActivity(rs.getTimestamp("last_activity") != null ? 
                rs.getTimestamp("last_activity").toLocalDateTime() : null);
            return session;
        }
    };

    // Admin User methods
    public Optional<AdminUser> findByAdminId(String adminId) {
        String sql = "SELECT * FROM admin_users WHERE admin_id = ?";
        List<AdminUser> admins = jdbcTemplate.query(sql, adminUserRowMapper, adminId);
        return admins.isEmpty() ? Optional.empty() : Optional.of(admins.get(0));
    }

    public Optional<AdminUser> findByUsername(String username) {
        String sql = "SELECT * FROM admin_users WHERE username = ?";
        List<AdminUser> admins = jdbcTemplate.query(sql, adminUserRowMapper, username);
        return admins.isEmpty() ? Optional.empty() : Optional.of(admins.get(0));
    }

    public void updateLastLogin(String adminId, LocalDateTime lastLogin) {
        String sql = "UPDATE admin_users SET last_login = ? WHERE admin_id = ?";
        jdbcTemplate.update(sql, lastLogin, adminId);
    }

    public void updateLoginAttempts(String adminId, int attempts) {
        String sql = "UPDATE admin_users SET login_attempts = ? WHERE admin_id = ?";
        jdbcTemplate.update(sql, attempts, adminId);
    }

    public void updateAccountLock(String adminId, LocalDateTime lockedUntil) {
        String sql = "UPDATE admin_users SET account_locked_until = ? WHERE admin_id = ?";
        jdbcTemplate.update(sql, lockedUntil, adminId);
    }

    public void updateBiometricInfo(String adminId, String templateId) {
        String sql = "UPDATE admin_users SET has_biometric = true, biometric_enrolled_date = ?, fingerprint_template_id = ? WHERE admin_id = ?";
        jdbcTemplate.update(sql, LocalDateTime.now(), templateId, adminId);
    }

    public void updateBiometricInfo(String adminId, String templateId, byte[] fingerprintData) {
        String sql = "UPDATE admin_users SET has_biometric = true, biometric_enrolled_date = ?, fingerprint_template_id = ?, fingerprint_data = ? WHERE admin_id = ?";
        jdbcTemplate.update(sql, LocalDateTime.now(), templateId, fingerprintData, adminId);
    }

    public byte[] getFingerprintData(String adminId) {
        String sql = "SELECT fingerprint_data FROM admin_users WHERE admin_id = ? AND has_biometric = true";
        List<byte[]> results = jdbcTemplate.query(sql, (rs, rowNum) -> rs.getBytes("fingerprint_data"), adminId);
        return results.isEmpty() ? null : results.get(0);
    }

    public void clearBiometricInfo(String adminId) {
        String sql = "UPDATE admin_users SET has_biometric = false, biometric_enrolled_date = null, fingerprint_template_id = null WHERE admin_id = ?";
        jdbcTemplate.update(sql, adminId);
    }

    public List<AdminUser> findAllActiveAdmins() {
        String sql = "SELECT * FROM admin_users WHERE status = 'ACTIVE' ORDER BY created_date DESC";
        return jdbcTemplate.query(sql, adminUserRowMapper);
    }

    // Admin Session methods
    public void createSession(AdminSession session) {
        try {
            String sql = "INSERT INTO admin_sessions (session_id, admin_id, expires_at) VALUES (?, ?, ?)";
            jdbcTemplate.update(sql, 
                session.getSessionId(),
                session.getAdminId(),
                session.getExpiresAt()
            );
        } catch (Exception e) {
            System.err.println("Session creation error: " + e.getMessage());
            // Try alternative approach - create table if it doesn't exist
            try {
                String createTableSql = """
                    CREATE TABLE IF NOT EXISTS admin_sessions (
                        id BIGSERIAL PRIMARY KEY,
                        session_id VARCHAR(255) UNIQUE NOT NULL,
                        admin_id VARCHAR(50) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        expires_at TIMESTAMP NOT NULL,
                        ip_address TEXT,
                        user_agent TEXT,
                        is_active BOOLEAN DEFAULT TRUE,
                        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """;
                jdbcTemplate.execute(createTableSql);
                
                // Try insert again
                String sql = "INSERT INTO admin_sessions (session_id, admin_id, expires_at) VALUES (?, ?, ?)";
                jdbcTemplate.update(sql, 
                    session.getSessionId(),
                    session.getAdminId(),
                    session.getExpiresAt()
                );
            } catch (Exception e2) {
                System.err.println("Failed to create session even after table creation: " + e2.getMessage());
                throw new RuntimeException("Session creation failed", e2);
            }
        }
    }

    public Optional<AdminSession> findSessionById(String sessionId) {
        String sql = "SELECT * FROM admin_sessions WHERE session_id = ?";
        List<AdminSession> sessions = jdbcTemplate.query(sql, adminSessionRowMapper, sessionId);
        return sessions.isEmpty() ? Optional.empty() : Optional.of(sessions.get(0));
    }

    public void updateSessionActivity(String sessionId, LocalDateTime lastActivity) {
        String sql = "UPDATE admin_sessions SET last_activity = ? WHERE session_id = ?";
        jdbcTemplate.update(sql, lastActivity, sessionId);
    }

    public void extendSession(String sessionId, LocalDateTime newExpiryTime) {
        String sql = "UPDATE admin_sessions SET expires_at = ?, last_activity = ? WHERE session_id = ?";
        jdbcTemplate.update(sql, newExpiryTime, LocalDateTime.now(), sessionId);
    }

    public void deactivateSession(String sessionId) {
        String sql = "UPDATE admin_sessions SET is_active = false, last_activity = ? WHERE session_id = ?";
        jdbcTemplate.update(sql, LocalDateTime.now(), sessionId);
    }

    public void deactivateAllUserSessions(String adminId) {
        String sql = "UPDATE admin_sessions SET is_active = false, last_activity = ? WHERE admin_id = ?";
        jdbcTemplate.update(sql, LocalDateTime.now(), adminId);
    }

    public List<AdminSession> findActiveSessions(String adminId) {
        String sql = "SELECT * FROM admin_sessions WHERE admin_id = ? AND is_active = true AND expires_at > ? ORDER BY last_activity DESC";
        return jdbcTemplate.query(sql, adminSessionRowMapper, adminId, LocalDateTime.now());
    }

    public void cleanupExpiredSessions() {
        String sql = "DELETE FROM admin_sessions WHERE expires_at < ? OR is_active = false";
        int deletedCount = jdbcTemplate.update(sql, LocalDateTime.now().minusDays(7)); // Keep inactive sessions for 7 days for audit
        System.out.println("Cleaned up " + deletedCount + " expired admin sessions");
    }

    // Login Log methods
    public void logLoginAttempt(String adminId, String loginMethod, String ipAddress, 
                               String userAgent, String status, String failureReason) {
        String sql = "INSERT INTO admin_login_logs (admin_id, login_method, ip_address, user_agent, status, failure_reason) VALUES (?, ?, ?::inet, ?, ?, ?)";
        jdbcTemplate.update(sql, adminId, loginMethod, ipAddress, userAgent, status, failureReason);
    }

    public List<Object[]> getLoginHistory(String adminId, int limit) {
        String sql = "SELECT login_timestamp, login_method, ip_address, status, failure_reason FROM admin_login_logs WHERE admin_id = ? ORDER BY login_timestamp DESC LIMIT ?";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new Object[]{
            rs.getTimestamp("login_timestamp").toLocalDateTime(),
            rs.getString("login_method"),
            rs.getString("ip_address"),
            rs.getString("status"),
            rs.getString("failure_reason")
        }, adminId, limit);
    }
}
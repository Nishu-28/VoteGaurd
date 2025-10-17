package com.voteguard.repository;

import com.voteguard.model.AuditLog;
import com.voteguard.util.JdbcUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class AuditLogRepository {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public AuditLogRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<AuditLog> auditLogRowMapper = new RowMapper<AuditLog>() {
        @Override
        public AuditLog mapRow(ResultSet rs, int rowNum) throws SQLException {
            AuditLog auditLog = new AuditLog();
            auditLog.setId(rs.getLong("id"));
            auditLog.setUserId(rs.getLong("user_id"));
            auditLog.setAction(rs.getString("action"));
            auditLog.setResource(rs.getString("resource"));
            auditLog.setIpAddress(rs.getString("ip_address"));
            auditLog.setUserAgent(rs.getString("user_agent"));
            auditLog.setTimestamp(JdbcUtils.getLocalDateTime(rs, "timestamp"));
            auditLog.setDetails(JdbcUtils.jsonStringToMap(rs.getString("details")));
            return auditLog;
        }
    };

    public AuditLog save(AuditLog auditLog) {
        if (auditLog.getId() == null) {
            return insert(auditLog);
        } else {
            return update(auditLog);
        }
    }

    private AuditLog insert(AuditLog auditLog) {
        String sql = "INSERT INTO audit_logs (user_id, action, resource, ip_address, user_agent, timestamp, details) VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        KeyHolder keyHolder = new GeneratedKeyHolder();
        LocalDateTime now = LocalDateTime.now();
        
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, auditLog.getUserId());
            ps.setString(2, auditLog.getAction());
            ps.setString(3, auditLog.getResource());
            ps.setString(4, auditLog.getIpAddress());
            ps.setString(5, auditLog.getUserAgent());
            JdbcUtils.setLocalDateTime(ps, 6, auditLog.getTimestamp() != null ? auditLog.getTimestamp() : now);
            ps.setString(7, JdbcUtils.mapToJsonString(auditLog.getDetails()));
            return ps;
        }, keyHolder);

        Long id = keyHolder.getKey().longValue();
        auditLog.setId(id);
        if (auditLog.getTimestamp() == null) {
            auditLog.setTimestamp(now);
        }
        return auditLog;
    }

    private AuditLog update(AuditLog auditLog) {
        String sql = "UPDATE audit_logs SET user_id = ?, action = ?, resource = ?, ip_address = ?, user_agent = ?, timestamp = ?, details = ? WHERE id = ?";
        
        jdbcTemplate.update(sql, 
                auditLog.getUserId(),
                auditLog.getAction(),
                auditLog.getResource(),
                auditLog.getIpAddress(),
                auditLog.getUserAgent(),
                auditLog.getTimestamp(),
                JdbcUtils.mapToJsonString(auditLog.getDetails()),
                auditLog.getId());
        
        return auditLog;
    }

    public Optional<AuditLog> findById(Long id) {
        String sql = "SELECT * FROM audit_logs WHERE id = ?";
        List<AuditLog> logs = jdbcTemplate.query(sql, auditLogRowMapper, id);
        return logs.isEmpty() ? Optional.empty() : Optional.of(logs.get(0));
    }

    public List<AuditLog> findByUserIdOrderByTimestampDesc(Long userId) {
        String sql = "SELECT * FROM audit_logs WHERE user_id = ? ORDER BY timestamp DESC";
        return jdbcTemplate.query(sql, auditLogRowMapper, userId);
    }

    public List<AuditLog> findByActionOrderByTimestampDesc(String action) {
        String sql = "SELECT * FROM audit_logs WHERE action = ? ORDER BY timestamp DESC";
        return jdbcTemplate.query(sql, auditLogRowMapper, action);
    }

    public List<AuditLog> findByResourceOrderByTimestampDesc(String resource) {
        String sql = "SELECT * FROM audit_logs WHERE resource = ? ORDER BY timestamp DESC";
        return jdbcTemplate.query(sql, auditLogRowMapper, resource);
    }

    public List<AuditLog> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime start, LocalDateTime end) {
        String sql = "SELECT * FROM audit_logs WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC";
        return jdbcTemplate.query(sql, auditLogRowMapper, start, end);
    }

    public List<AuditLog> findByUserIdAndActionOrderByTimestampDesc(Long userId, String action) {
        String sql = "SELECT * FROM audit_logs WHERE user_id = ? AND action = ? ORDER BY timestamp DESC";
        return jdbcTemplate.query(sql, auditLogRowMapper, userId, action);
    }

    public List<AuditLog> findRecentLogs(LocalDateTime since) {
        String sql = "SELECT * FROM audit_logs WHERE timestamp >= ? ORDER BY timestamp DESC";
        return jdbcTemplate.query(sql, auditLogRowMapper, since);
    }

    public List<AuditLog> findAll() {
        String sql = "SELECT * FROM audit_logs ORDER BY timestamp DESC";
        return jdbcTemplate.query(sql, auditLogRowMapper);
    }

    public void deleteById(Long id) {
        String sql = "DELETE FROM audit_logs WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }
}



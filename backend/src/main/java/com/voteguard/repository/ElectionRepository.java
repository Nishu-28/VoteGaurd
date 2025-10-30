package com.voteguard.repository;

import com.voteguard.model.Election;
import com.voteguard.model.ElectionStatus;
import com.voteguard.util.JdbcUtils;
import lombok.RequiredArgsConstructor;
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
@RequiredArgsConstructor
public class ElectionRepository {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<Election> electionRowMapper = new RowMapper<Election>() {
        @Override
        public Election mapRow(ResultSet rs, int rowNum) throws SQLException {
            return Election.builder()
                    .id(rs.getLong("id"))
                    .name(rs.getString("name"))
                    .description(rs.getString("description"))
                    .startDate(JdbcUtils.getLocalDateTime(rs, "start_date"))
                    .endDate(JdbcUtils.getLocalDateTime(rs, "end_date"))
                    .status(ElectionStatus.valueOf(rs.getString("status")))
                    .isActive(rs.getBoolean("is_active"))
                    .createdAt(JdbcUtils.getLocalDateTime(rs, "created_at"))
                    .updatedAt(JdbcUtils.getLocalDateTime(rs, "updated_at"))
                    .build();
        }
    };

    public Election save(Election election) {
        if (election.getId() == null) {
            return insert(election);
        } else {
            return update(election);
        }
    }

    private Election insert(Election election) {
        String sql = "INSERT INTO elections (name, description, start_date, end_date, status, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        KeyHolder keyHolder = new GeneratedKeyHolder();
        LocalDateTime now = LocalDateTime.now();
        
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            ps.setString(1, election.getName());
            ps.setString(2, election.getDescription());
            JdbcUtils.setLocalDateTime(ps, 3, election.getStartDate());
            JdbcUtils.setLocalDateTime(ps, 4, election.getEndDate());
            ps.setString(5, election.getStatus().name());
            ps.setBoolean(6, election.getIsActive());
            JdbcUtils.setLocalDateTime(ps, 7, now);
            JdbcUtils.setLocalDateTime(ps, 8, now);
            return ps;
        }, keyHolder);

        Long id = keyHolder.getKey().longValue();
        election.setId(id);
        election.setCreatedAt(now);
        election.setUpdatedAt(now);
        return election;
    }

    private Election update(Election election) {
        String sql = "UPDATE elections SET name = ?, description = ?, start_date = ?, end_date = ?, status = ?, is_active = ?, updated_at = ? WHERE id = ?";
        
        LocalDateTime now = LocalDateTime.now();
        jdbcTemplate.update(sql, 
                election.getName(), 
                election.getDescription(), 
                election.getStartDate(),
                election.getEndDate(),
                election.getStatus().name(), 
                election.getIsActive(), 
                now, 
                election.getId());
        
        election.setUpdatedAt(now);
        return election;
    }

    public Optional<Election> findById(Long id) {
        String sql = "SELECT * FROM elections WHERE id = ?";
        List<Election> elections = jdbcTemplate.query(sql, electionRowMapper, id);
        return elections.isEmpty() ? Optional.empty() : Optional.of(elections.get(0));
    }
    
    // Find all active elections
    public List<Election> findByIsActiveTrueOrderByStartDateDesc() {
        String sql = "SELECT * FROM elections WHERE is_active = true ORDER BY start_date DESC";
        return jdbcTemplate.query(sql, electionRowMapper);
    }
    
    // Find elections by status
    public List<Election> findByStatusAndIsActiveTrueOrderByStartDateDesc(ElectionStatus status) {
        String sql = "SELECT * FROM elections WHERE status = ? AND is_active = true ORDER BY start_date DESC";
        return jdbcTemplate.query(sql, electionRowMapper, status.name());
    }
    
    // Find upcoming elections
    public List<Election> findUpcomingElections(LocalDateTime now) {
        String sql = "SELECT * FROM elections WHERE status = 'UPCOMING' AND is_active = true AND start_date > ? ORDER BY start_date ASC";
        return jdbcTemplate.query(sql, electionRowMapper, now);
    }
    
    // Find ongoing elections
    public List<Election> findOngoingElections(LocalDateTime now) {
        String sql = "SELECT * FROM elections WHERE status = 'ACTIVE' AND is_active = true AND start_date <= ? AND end_date > ? ORDER BY start_date ASC";
        return jdbcTemplate.query(sql, electionRowMapper, now, now);
    }
    
    // Find completed elections
    public List<Election> findCompletedElections(LocalDateTime now) {
        String sql = "SELECT * FROM elections WHERE (status = 'COMPLETED' OR end_date <= ?) AND is_active = true ORDER BY end_date DESC";
        return jdbcTemplate.query(sql, electionRowMapper, now);
    }
    
    // Find elections within date range
    public List<Election> findElectionsInDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        String sql = "SELECT * FROM elections WHERE is_active = true AND start_date >= ? AND end_date <= ? ORDER BY start_date ASC";
        return jdbcTemplate.query(sql, electionRowMapper, startDate, endDate);
    }
    
    // Check if there are any active elections at a given time
    public boolean hasActiveElectionAt(LocalDateTime time) {
        String sql = "SELECT COUNT(*) FROM elections WHERE status = 'ACTIVE' AND is_active = true AND start_date <= ? AND end_date > ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, time, time);
        return count != null && count > 0;
    }
    
    // Find election by name (case insensitive)
    public Optional<Election> findByNameIgnoreCaseAndIsActiveTrue(String name) {
        String sql = "SELECT * FROM elections WHERE LOWER(name) = LOWER(?) AND is_active = true";
        List<Election> elections = jdbcTemplate.query(sql, electionRowMapper, name);
        return elections.isEmpty() ? Optional.empty() : Optional.of(elections.get(0));
    }
    
    // Search elections by name containing text
    public List<Election> searchElectionsByName(String searchTerm) {
        String sql = "SELECT * FROM elections WHERE is_active = true AND LOWER(name) LIKE LOWER(?) ORDER BY start_date DESC";
        return jdbcTemplate.query(sql, electionRowMapper, "%" + searchTerm + "%");
    }

    public List<Election> findAll() {
        String sql = "SELECT * FROM elections ORDER BY start_date DESC";
        return jdbcTemplate.query(sql, electionRowMapper);
    }

    public void deleteById(Long id) {
        String sql = "DELETE FROM elections WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }
    
    public long countActiveElections() {
        String sql = "SELECT COUNT(*) FROM elections WHERE is_active = true";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0;
    }
}
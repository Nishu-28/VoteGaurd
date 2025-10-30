package com.voteguard.repository;

import com.voteguard.model.Candidate;
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
public class CandidateRepository {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<Candidate> candidateRowMapper = new RowMapper<Candidate>() {
        @Override
        public Candidate mapRow(ResultSet rs, int rowNum) throws SQLException {
            return Candidate.builder()
                    .id(rs.getLong("id"))
                    .name(rs.getString("name"))
                    .party(rs.getString("party"))
                    .description(rs.getString("description"))
                    .candidateNumber(rs.getObject("candidate_number", Integer.class))
                    .electionId(rs.getLong("election_id"))
                    .isActive(rs.getBoolean("is_active"))
                    .createdAt(JdbcUtils.getLocalDateTime(rs, "created_at"))
                    .updatedAt(JdbcUtils.getLocalDateTime(rs, "updated_at"))
                    .build();
        }
    };

    public Candidate save(Candidate candidate) {
        if (candidate.getId() == null) {
            return insert(candidate);
        } else {
            return update(candidate);
        }
    }

    private Candidate insert(Candidate candidate) {
        String sql = "INSERT INTO candidates (name, party, description, candidate_number, election_id, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        KeyHolder keyHolder = new GeneratedKeyHolder();
        LocalDateTime now = LocalDateTime.now();
        
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            ps.setString(1, candidate.getName());
            ps.setString(2, candidate.getParty());
            ps.setString(3, candidate.getDescription());
            
            // Handle null candidate number
            if (candidate.getCandidateNumber() != null) {
                ps.setInt(4, candidate.getCandidateNumber());
            } else {
                ps.setNull(4, java.sql.Types.INTEGER);
            }
            
            ps.setLong(5, candidate.getElectionId());
            ps.setBoolean(6, candidate.getIsActive());
            JdbcUtils.setLocalDateTime(ps, 7, now);
            JdbcUtils.setLocalDateTime(ps, 8, now);
            return ps;
        }, keyHolder);

        Long id = keyHolder.getKey().longValue();
        candidate.setId(id);
        candidate.setCreatedAt(now);
        candidate.setUpdatedAt(now);
        return candidate;
    }

    private Candidate update(Candidate candidate) {
        String sql = "UPDATE candidates SET name = ?, party = ?, description = ?, candidate_number = ?, election_id = ?, is_active = ?, updated_at = ? WHERE id = ?";
        
        LocalDateTime now = LocalDateTime.now();
        jdbcTemplate.update(sql, 
                candidate.getName(), 
                candidate.getParty(), 
                candidate.getDescription(), 
                candidate.getCandidateNumber(),
                candidate.getElectionId(),
                candidate.getIsActive(), 
                now, 
                candidate.getId());
        
        candidate.setUpdatedAt(now);
        return candidate;
    }

    public Optional<Candidate> findById(Long id) {
        String sql = "SELECT * FROM candidates WHERE id = ?";
        List<Candidate> candidates = jdbcTemplate.query(sql, candidateRowMapper, id);
        return candidates.isEmpty() ? Optional.empty() : Optional.of(candidates.get(0));
    }

    public List<Candidate> findByIsActiveTrue() {
        String sql = "SELECT * FROM candidates WHERE is_active = true";
        return jdbcTemplate.query(sql, candidateRowMapper);
    }
    
    public List<Candidate> findByElectionId(Long electionId) {
        String sql = "SELECT * FROM candidates WHERE election_id = ?";
        return jdbcTemplate.query(sql, candidateRowMapper, electionId);
    }
    
    public List<Candidate> findByElectionIdAndIsActiveTrue(Long electionId) {
        String sql = "SELECT * FROM candidates WHERE election_id = ? AND is_active = true";
        return jdbcTemplate.query(sql, candidateRowMapper, electionId);
    }

    public List<Candidate> findByParty(String party) {
        String sql = "SELECT * FROM candidates WHERE party = ?";
        return jdbcTemplate.query(sql, candidateRowMapper, party);
    }

    public List<Candidate> findActiveCandidatesOrderByNumber() {
        String sql = "SELECT * FROM candidates WHERE is_active = true ORDER BY candidate_number";
        return jdbcTemplate.query(sql, candidateRowMapper);
    }
    
    public List<Candidate> findByElectionIdOrderByNumber(Long electionId) {
        String sql = "SELECT * FROM candidates WHERE election_id = ? AND is_active = true ORDER BY candidate_number";
        return jdbcTemplate.query(sql, candidateRowMapper, electionId);
    }

    public long countActiveCandidates() {
        String sql = "SELECT COUNT(*) FROM candidates WHERE is_active = true";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0;
    }

    public List<Candidate> findAll() {
        String sql = "SELECT * FROM candidates";
        return jdbcTemplate.query(sql, candidateRowMapper);
    }

    public void deleteById(Long id) {
        String sql = "DELETE FROM candidates WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }
}



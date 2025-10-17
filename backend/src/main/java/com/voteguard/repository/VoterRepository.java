package com.voteguard.repository;

import com.voteguard.model.Voter;
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
public class VoterRepository {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<Voter> voterRowMapper = new RowMapper<Voter>() {
        @Override
        public Voter mapRow(ResultSet rs, int rowNum) throws SQLException {
            return Voter.builder()
                    .id(rs.getLong("id"))
                    .voterId(rs.getString("voter_id"))
                    .fullName(rs.getString("full_name"))
                    .email(rs.getString("email"))
                    .fingerprintHash(rs.getString("fingerprint_hash"))
                    .extraField(rs.getString("extra_field"))
                    .hasVoted(rs.getBoolean("has_voted"))
                    .isActive(rs.getBoolean("is_active"))
                    .role(Voter.Role.valueOf(rs.getString("role")))
                    .createdAt(JdbcUtils.getLocalDateTime(rs, "created_at"))
                    .updatedAt(JdbcUtils.getLocalDateTime(rs, "updated_at"))
                    .build();
        }
    };

    public Voter save(Voter voter) {
        if (voter.getId() == null) {
            return insert(voter);
        } else {
            return update(voter);
        }
    }

    private Voter insert(Voter voter) {
        String sql = "INSERT INTO voters (voter_id, full_name, email, fingerprint_hash, extra_field, has_voted, is_active, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        KeyHolder keyHolder = new GeneratedKeyHolder();
        LocalDateTime now = LocalDateTime.now();
        
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, voter.getVoterId());
            ps.setString(2, voter.getFullName());
            ps.setString(3, voter.getEmail());
            ps.setString(4, voter.getFingerprintHash());
            ps.setString(5, voter.getExtraField());
            ps.setBoolean(6, voter.getHasVoted());
            ps.setBoolean(7, voter.getIsActive());
            ps.setString(8, voter.getRole().name());
            JdbcUtils.setLocalDateTime(ps, 9, now);
            JdbcUtils.setLocalDateTime(ps, 10, now);
            return ps;
        }, keyHolder);

        Long id = keyHolder.getKey().longValue();
        voter.setId(id);
        voter.setCreatedAt(now);
        voter.setUpdatedAt(now);
        return voter;
    }

    private Voter update(Voter voter) {
        String sql = "UPDATE voters SET voter_id = ?, full_name = ?, email = ?, fingerprint_hash = ?, extra_field = ?, has_voted = ?, is_active = ?, role = ?, updated_at = ? WHERE id = ?";
        
        LocalDateTime now = LocalDateTime.now();
        jdbcTemplate.update(sql, 
                voter.getVoterId(), 
                voter.getFullName(), 
                voter.getEmail(), 
                voter.getFingerprintHash(), 
                voter.getExtraField(), 
                voter.getHasVoted(), 
                voter.getIsActive(), 
                voter.getRole().name(), 
                now, 
                voter.getId());
        
        voter.setUpdatedAt(now);
        return voter;
    }

    public Optional<Voter> findById(Long id) {
        String sql = "SELECT * FROM voters WHERE id = ?";
        List<Voter> voters = jdbcTemplate.query(sql, voterRowMapper, id);
        return voters.isEmpty() ? Optional.empty() : Optional.of(voters.get(0));
    }

    public Optional<Voter> findByVoterId(String voterId) {
        String sql = "SELECT * FROM voters WHERE voter_id = ?";
        List<Voter> voters = jdbcTemplate.query(sql, voterRowMapper, voterId);
        return voters.isEmpty() ? Optional.empty() : Optional.of(voters.get(0));
    }

    public Optional<Voter> findByEmail(String email) {
        String sql = "SELECT * FROM voters WHERE email = ?";
        List<Voter> voters = jdbcTemplate.query(sql, voterRowMapper, email);
        return voters.isEmpty() ? Optional.empty() : Optional.of(voters.get(0));
    }

    public Optional<Voter> findByFingerprintHash(String fingerprintHash) {
        String sql = "SELECT * FROM voters WHERE fingerprint_hash = ?";
        List<Voter> voters = jdbcTemplate.query(sql, voterRowMapper, fingerprintHash);
        return voters.isEmpty() ? Optional.empty() : Optional.of(voters.get(0));
    }

    public Optional<Voter> findByVoterIdAndExtraField(String voterId, String extraField) {
        String sql = "SELECT * FROM voters WHERE UPPER(voter_id) = UPPER(?) AND extra_field = ?";
        List<Voter> voters = jdbcTemplate.query(sql, voterRowMapper, voterId, extraField);
        return voters.isEmpty() ? Optional.empty() : Optional.of(voters.get(0));
    }

    public boolean existsByVoterId(String voterId) {
        String sql = "SELECT COUNT(*) FROM voters WHERE voter_id = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, voterId);
        return count != null && count > 0;
    }

    public boolean existsByEmail(String email) {
        String sql = "SELECT COUNT(*) FROM voters WHERE email = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, email);
        return count != null && count > 0;
    }

    public boolean existsByFingerprintHash(String fingerprintHash) {
        String sql = "SELECT COUNT(*) FROM voters WHERE fingerprint_hash = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, fingerprintHash);
        return count != null && count > 0;
    }

    public long countVotersWhoHaveVoted() {
        String sql = "SELECT COUNT(*) FROM voters WHERE has_voted = true";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0;
    }

    public long countActiveVoters() {
        String sql = "SELECT COUNT(*) FROM voters WHERE is_active = true";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0;
    }

    public List<Voter> findAll() {
        String sql = "SELECT * FROM voters";
        return jdbcTemplate.query(sql, voterRowMapper);
    }

    public void deleteById(Long id) {
        String sql = "DELETE FROM voters WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }
}



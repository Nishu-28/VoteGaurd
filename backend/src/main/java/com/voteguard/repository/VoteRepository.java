package com.voteguard.repository;

import com.voteguard.model.Candidate;
import com.voteguard.model.Vote;
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
public class VoteRepository {

    private final JdbcTemplate jdbcTemplate;
    private final VoterRepository voterRepository;
    private final CandidateRepository candidateRepository;

    private final RowMapper<Vote> voteRowMapper = new RowMapper<Vote>() {
        @Override
        public Vote mapRow(ResultSet rs, int rowNum) throws SQLException {
            Vote vote = Vote.builder()
                    .id(rs.getLong("id"))
                    .voterName(rs.getString("voter_name"))
                    .stationCode(rs.getString("station_code"))
                    .timestamp(JdbcUtils.getLocalDateTime(rs, "timestamp"))
                    .ipAddress(rs.getString("ip_address"))
                    .userAgent(rs.getString("user_agent"))
                    .fingerprintVerified(rs.getBoolean("fingerprint_verified"))
                    .build();

            // Load related entities
            Long voterId = rs.getLong("voter_id");
            Long candidateId = rs.getLong("candidate_id");
            
            if (voterId != null) {
                vote.setVoter(voterRepository.findById(voterId).orElse(null));
            }
            if (candidateId != null) {
                vote.setCandidate(candidateRepository.findById(candidateId).orElse(null));
            }

            return vote;
        }
    };

    public Vote save(Vote vote) {
        if (vote.getId() == null) {
            return insert(vote);
        } else {
            return update(vote);
        }
    }

    private Vote insert(Vote vote) {
        String sql = "INSERT INTO votes (voter_id, voter_name, candidate_id, station_code, timestamp, ip_address, user_agent, fingerprint_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        KeyHolder keyHolder = new GeneratedKeyHolder();
        LocalDateTime now = LocalDateTime.now();
        
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, vote.getVoter().getId());
            ps.setString(2, vote.getVoterName());
            ps.setLong(3, vote.getCandidate().getId());
            ps.setString(4, vote.getStationCode());
            JdbcUtils.setLocalDateTime(ps, 5, vote.getTimestamp() != null ? vote.getTimestamp() : now);
            ps.setString(6, vote.getIpAddress());
            ps.setString(7, vote.getUserAgent());
            ps.setBoolean(8, vote.getFingerprintVerified());
            return ps;
        }, keyHolder);

        Long id = keyHolder.getKey().longValue();
        vote.setId(id);
        if (vote.getTimestamp() == null) {
            vote.setTimestamp(now);
        }
        return vote;
    }

    private Vote update(Vote vote) {
        String sql = "UPDATE votes SET voter_id = ?, voter_name = ?, candidate_id = ?, station_code = ?, timestamp = ?, ip_address = ?, user_agent = ?, fingerprint_verified = ? WHERE id = ?";
        
        jdbcTemplate.update(sql, 
                vote.getVoter().getId(),
                vote.getVoterName(),
                vote.getCandidate().getId(),
                vote.getStationCode(),
                vote.getTimestamp(),
                vote.getIpAddress(),
                vote.getUserAgent(),
                vote.getFingerprintVerified(),
                vote.getId());
        
        return vote;
    }

    public Optional<Vote> findById(Long id) {
        String sql = "SELECT * FROM votes WHERE id = ?";
        List<Vote> votes = jdbcTemplate.query(sql, voteRowMapper, id);
        return votes.isEmpty() ? Optional.empty() : Optional.of(votes.get(0));
    }

    public Optional<Vote> findByVoterId(Long voterId) {
        String sql = "SELECT * FROM votes WHERE voter_id = ?";
        List<Vote> votes = jdbcTemplate.query(sql, voteRowMapper, voterId);
        return votes.isEmpty() ? Optional.empty() : Optional.of(votes.get(0));
    }

    public boolean existsByVoterId(Long voterId) {
        String sql = "SELECT COUNT(*) FROM votes WHERE voter_id = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, voterId);
        return count != null && count > 0;
    }

    public long countVotesByCandidateId(Long candidateId) {
        String sql = "SELECT COUNT(*) FROM votes WHERE candidate_id = ?";
        Long count = jdbcTemplate.queryForObject(sql, Long.class, candidateId);
        return count != null ? count : 0;
    }

    public List<Object[]> getVoteCountsByCandidate() {
        String sql = "SELECT candidate_id, COUNT(*) FROM votes GROUP BY candidate_id";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new Object[]{rs.getLong("candidate_id"), rs.getLong("count")});
    }

    public long countVotesBetween(LocalDateTime startTime, LocalDateTime endTime) {
        String sql = "SELECT COUNT(*) FROM votes WHERE timestamp >= ? AND timestamp <= ?";
        Long count = jdbcTemplate.queryForObject(sql, Long.class, startTime, endTime);
        return count != null ? count : 0;
    }

    public long getTotalVoteCount() {
        String sql = "SELECT COUNT(*) FROM votes";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0;
    }

    public List<Vote> findAll() {
        String sql = "SELECT * FROM votes";
        return jdbcTemplate.query(sql, voteRowMapper);
    }

    public void deleteById(Long id) {
        String sql = "DELETE FROM votes WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }
}



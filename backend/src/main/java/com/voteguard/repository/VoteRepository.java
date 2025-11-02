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
                    .centerLocation(rs.getString("center_location"))
                    .timestamp(JdbcUtils.getLocalDateTime(rs, "timestamp"))
                    .ipAddress(rs.getString("ip_address"))
                    .userAgent(rs.getString("user_agent"))
                    .fingerprintVerified(rs.getBoolean("fingerprint_verified"))
                    .electionId(rs.getObject("election_id") != null ? rs.getLong("election_id") : null)
                    .build();

            // Load related entities
            Long voterId = rs.getLong("voter_id");
            Long candidateId = rs.getLong("candidate_id");
            
            try {
                if (voterId != null) {
                    vote.setVoter(voterRepository.findById(voterId).orElse(null));
                }
                if (candidateId != null) {
                    vote.setCandidate(candidateRepository.findById(candidateId).orElse(null));
                }
            } catch (Exception e) {
                System.err.println("Error loading related entities for vote: " + e.getMessage());
                // Don't fail the entire vote - continue without related entities
            }

            return vote;
        }
    };

    public Vote save(Vote vote) {
        System.out.println("VoteRepository.save: Called with vote.id=" + vote.getId() + ", voter.id=" + 
            (vote.getVoter() != null ? vote.getVoter().getId() : "null") + 
            ", candidate.id=" + (vote.getCandidate() != null ? vote.getCandidate().getId() : "null"));
        if (vote.getId() == null) {
            System.out.println("VoteRepository.save: Calling insert()");
            return insert(vote);
        } else {
            System.out.println("VoteRepository.save: Calling update()");
            return update(vote);
        }
    }

    private Vote insert(Vote vote) {
        // Validate required fields before insertion
        if (vote.getVoter() == null || vote.getVoter().getId() == null) {
            throw new RuntimeException("Cannot insert vote: voter is null or voter ID is null");
        }
        if (vote.getCandidate() == null || vote.getCandidate().getId() == null) {
            throw new RuntimeException("Cannot insert vote: candidate is null or candidate ID is null");
        }
        
        // Store IDs for use in fallback query
        Long voterId = vote.getVoter().getId();
        Long candidateId = vote.getCandidate().getId();
        Long electionId = vote.getElectionId();
        
        // Cast ip_address to INET type in SQL to avoid type mismatch
        String sql = "INSERT INTO votes (voter_id, voter_name, candidate_id, station_code, center_location, timestamp, ip_address, user_agent, fingerprint_verified, election_id) VALUES (?, ?, ?, ?, ?, ?, ?::inet, ?, ?, ?)";
        
        KeyHolder keyHolder = new GeneratedKeyHolder();
        LocalDateTime now = LocalDateTime.now();
        
        System.out.println("VoteRepository.insert: Starting vote insertion - voterId=" + voterId + ", candidateId=" + candidateId + ", electionId=" + electionId);
        try {
            int rowsAffected = jdbcTemplate.update(connection -> {
                // Specify the column name for the generated key (id)
                PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
                ps.setLong(1, voterId);
                ps.setString(2, vote.getVoterName());
                ps.setLong(3, candidateId);
                ps.setString(4, null); // station_code is deprecated, always null
                ps.setString(5, vote.getCenterLocation());
                JdbcUtils.setLocalDateTime(ps, 6, vote.getTimestamp() != null ? vote.getTimestamp() : now);
                ps.setString(7, vote.getIpAddress()); // Will be cast to INET in SQL
                ps.setString(8, vote.getUserAgent());
                ps.setBoolean(9, vote.getFingerprintVerified());
                if (electionId != null) {
                    ps.setLong(10, electionId);
                } else {
                    ps.setNull(10, java.sql.Types.BIGINT);
                }
                return ps;
            }, keyHolder);
            
            if (rowsAffected == 0) {
                throw new RuntimeException("Failed to insert vote: No rows affected");
            }
            
            System.out.println("VoteRepository.insert: Vote inserted successfully, rowsAffected=" + rowsAffected);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            System.err.println("VoteRepository.insert: Constraint violation during insert: " + e.getMessage());
            System.err.println("VoteRepository.insert: Root cause: " + (e.getRootCause() != null ? e.getRootCause().getMessage() : "N/A"));
            if (e.getRootCause() != null && e.getRootCause() instanceof java.sql.SQLException) {
                java.sql.SQLException sqlEx = (java.sql.SQLException) e.getRootCause();
                System.err.println("VoteRepository.insert: SQL state: " + sqlEx.getSQLState());
                System.err.println("VoteRepository.insert: Error code: " + sqlEx.getErrorCode());
            }
            e.printStackTrace();
            throw new RuntimeException("Failed to insert vote due to constraint violation: " + e.getMessage(), e);
        } catch (org.springframework.dao.DataAccessException e) {
            System.err.println("VoteRepository.insert: Data access exception during insert: " + e.getMessage());
            System.err.println("VoteRepository.insert: Root cause: " + (e.getRootCause() != null ? e.getRootCause().getMessage() : "N/A"));
            if (e.getRootCause() != null && e.getRootCause() instanceof java.sql.SQLException) {
                java.sql.SQLException sqlEx = (java.sql.SQLException) e.getRootCause();
                System.err.println("VoteRepository.insert: SQL state: " + sqlEx.getSQLState());
                System.err.println("VoteRepository.insert: Error code: " + sqlEx.getErrorCode());
            }
            e.printStackTrace();
            throw new RuntimeException("Failed to insert vote due to database error: " + e.getMessage(), e);
        } catch (Exception e) {
            System.err.println("VoteRepository.insert: Exception during insert: " + e.getMessage());
            System.err.println("VoteRepository.insert: Exception type: " + e.getClass().getName());
            e.printStackTrace();
            throw new RuntimeException("Failed to insert vote: " + e.getMessage(), e);
        }

        // Get the generated ID - try multiple methods for PostgreSQL compatibility
        Long id = null;
        
        // Method 1: Try getKeys() first (PostgreSQL preferred)
        try {
            java.util.Map<String, Object> keys = keyHolder.getKeys();
            System.out.println("VoteRepository.insert: KeyHolder keys: " + keys);
            if (keys != null && !keys.isEmpty()) {
                // Try to get id from keys map
                if (keys.containsKey("id")) {
                    Object idObj = keys.get("id");
                    if (idObj instanceof Number) {
                        id = ((Number) idObj).longValue();
                    } else if (idObj != null) {
                        try {
                            id = Long.parseLong(idObj.toString());
                        } catch (NumberFormatException e) {
                            System.err.println("Failed to parse id from KeyHolder: " + idObj);
                        }
                    }
                } else {
                    // Fallback: get first numeric value from keys
                    for (Object value : keys.values()) {
                        if (value instanceof Number) {
                            id = ((Number) value).longValue();
                            break;
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to get keys using getKeys() method: " + e.getMessage());
        }
        
        // Method 2: Try getKey() as fallback
        if (id == null) {
            try {
                Number key = keyHolder.getKey();
                if (key != null) {
                    id = key.longValue();
                }
            } catch (Exception e) {
                System.err.println("Failed to get key using getKey() method: " + e.getMessage());
            }
        }
        
        // Method 3: Query the database to get the last inserted vote ID as last resort
        if (id == null) {
            try {
                String querySql = "SELECT id FROM votes WHERE voter_id = ? AND candidate_id = ? AND election_id ";
                if (electionId != null) {
                    querySql += "= ?";
                } else {
                    querySql += "IS NULL";
                }
                querySql += " ORDER BY timestamp DESC LIMIT 1";
                
                if (electionId != null) {
                    id = jdbcTemplate.queryForObject(querySql, Long.class, voterId, candidateId, electionId);
                } else {
                    id = jdbcTemplate.queryForObject(querySql, Long.class, voterId, candidateId);
                }
                System.out.println("VoteRepository.insert: Retrieved vote ID from database query: " + id);
            } catch (Exception e) {
                System.err.println("Failed to retrieve vote ID from database: " + e.getMessage());
            }
        }
        
        if (id == null) {
            System.err.println("KeyHolder keys: " + keyHolder.getKeys());
            throw new RuntimeException("Failed to retrieve generated vote ID from KeyHolder or database. Vote may not have been inserted successfully.");
        }
        
        vote.setId(id);
        if (vote.getTimestamp() == null) {
            vote.setTimestamp(now);
        }
        System.out.println("VoteRepository.insert: Vote inserted successfully with ID=" + id);
        
        // Verify the vote was actually inserted by querying the database
        try {
            String verifySql = "SELECT COUNT(*) FROM votes WHERE id = ?";
            Integer count = jdbcTemplate.queryForObject(verifySql, Integer.class, id);
            if (count == null || count == 0) {
                System.err.println("WARNING: VoteRepository.insert: Vote with ID=" + id + " was not found in database after insertion!");
            } else {
                System.out.println("VoteRepository.insert: Verified vote exists in database (count=" + count + ")");
            }
        } catch (Exception e) {
            System.err.println("VoteRepository.insert: Error verifying vote insertion: " + e.getMessage());
        }
        
        return vote;
    }

    private Vote update(Vote vote) {
        // Cast ip_address to INET type in SQL to avoid type mismatch
        String sql = "UPDATE votes SET voter_id = ?, voter_name = ?, candidate_id = ?, station_code = ?, center_location = ?, timestamp = ?, ip_address = ?::inet, user_agent = ?, fingerprint_verified = ?, election_id = ? WHERE id = ?";
        
        jdbcTemplate.update(sql, 
                vote.getVoter().getId(),
                vote.getVoterName(),
                vote.getCandidate().getId(),
                null, // station_code is deprecated, always null
                vote.getCenterLocation(),
                vote.getTimestamp(),
                vote.getIpAddress(), // Will be cast to INET in SQL
                vote.getUserAgent(),
                vote.getFingerprintVerified(),
                vote.getElectionId(),
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
    
    public boolean existsByVoterIdAndElectionId(Long voterId, Long electionId) {
        if (electionId == null) {
            // For non-election-specific votes, check if voter has any votes
            return existsByVoterId(voterId);
        }
        String sql = "SELECT COUNT(*) > 0 FROM votes WHERE voter_id = ? AND election_id = ?";
        Boolean result = jdbcTemplate.queryForObject(sql, Boolean.class, voterId, electionId);
        return result != null && result;
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

    public List<Object[]> getVoteCountsByCandidateForElection(Long electionId) {
        String sql = "SELECT candidate_id, COUNT(*) FROM votes WHERE election_id = ? GROUP BY candidate_id";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new Object[]{rs.getLong("candidate_id"), rs.getLong("count")}, electionId);
    }

    public long getTotalVoteCountForElection(Long electionId) {
        String sql = "SELECT COUNT(*) FROM votes WHERE election_id = ?";
        Long count = jdbcTemplate.queryForObject(sql, Long.class, electionId);
        return count != null ? count : 0;
    }

    public long countVotersWhoVotedInElection(Long electionId) {
        String sql = "SELECT COUNT(DISTINCT voter_id) FROM votes WHERE election_id = ?";
        Long count = jdbcTemplate.queryForObject(sql, Long.class, electionId);
        return count != null ? count : 0;
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



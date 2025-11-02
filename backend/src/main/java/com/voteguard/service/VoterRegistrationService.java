package com.voteguard.service;

import com.voteguard.model.Voter;
import com.voteguard.model.Election;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.security.MessageDigest;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Base64;

@Service
public class VoterRegistrationService {

    private static final Logger log = LoggerFactory.getLogger(VoterRegistrationService.class);

    private final JdbcTemplate jdbcTemplate;
    private final AuditLogService auditLogService;
    private final ElectionService electionService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${biometric.service.url:http://localhost:8001}")
    private String biometricServiceUrl;

    @Autowired
    public VoterRegistrationService(JdbcTemplate jdbcTemplate, AuditLogService auditLogService, ElectionService electionService) {
        this.jdbcTemplate = jdbcTemplate;
        this.auditLogService = auditLogService;
        this.electionService = electionService;
    }

    public Map<String, Object> registerVoter(
            String voterId, 
            String fullName, 
            String email, 
            String extraField, 
            String role,
            MultipartFile fingerprintFile,
            MultipartFile profilePhotoFile,
            String ipAddress, 
            String userAgent) {
        
        try {
            // Normalize and validate inputs
            String normalizedVoterId = voterId != null ? voterId.trim().toUpperCase() : "";
            String normalizedFullName = fullName != null ? fullName.trim() : "";
            String normalizedEmail = email != null ? email.trim().toLowerCase() : "";
            String normalizedExtraField = extraField != null ? extraField.trim() : "";
            
            // Validate required fields
            if (normalizedVoterId.isEmpty()) {
                throw new RuntimeException("Voter ID is required");
            }
            if (normalizedFullName.isEmpty()) {
                throw new RuntimeException("Full name is required");
            }
            if (normalizedEmail.isEmpty()) {
                throw new RuntimeException("Email is required");
            }
            if (normalizedExtraField.isEmpty()) {
                throw new RuntimeException("Extra field (DOB/Department) is required");
            }
            
            // Check if voter already exists (case-insensitive)
            if (voterExists(normalizedVoterId)) {
                throw new RuntimeException("Voter with ID " + normalizedVoterId + " already exists");
            }

            // Check if email already exists
            if (emailExists(normalizedEmail)) {
                throw new RuntimeException("Email " + normalizedEmail + " is already registered");
            }

            // Process fingerprint with validation
            String fingerprintHash = null;
            if (fingerprintFile != null && !fingerprintFile.isEmpty()) {
                // Validate fingerprint with biometric service first
                if (!validateFingerprintWithBiometricService(fingerprintFile)) {
                    throw new RuntimeException("Invalid fingerprint image. Please upload a clear fingerprint image.");
                }
                fingerprintHash = processFingerprintFile(fingerprintFile);
            }

            // Process profile photo
            String profilePhotoBase64 = null;
            if (profilePhotoFile != null && !profilePhotoFile.isEmpty()) {
                profilePhotoBase64 = processProfilePhoto(profilePhotoFile);
            }

            // Determine eligible elections for new voter
            List<Long> eligibleElections = determineEligibleElections(normalizedVoterId, role);
            String eligibleElectionsJson = convertElectionsToJson(eligibleElections);

            // Insert voter into database
            String sql = """
                INSERT INTO voters (voter_id, full_name, email, fingerprint_hash, extra_field, has_voted, is_active, role, eligible_elections)
                VALUES (?, ?, ?, ?, ?, false, true, ?, ?::jsonb)
                """;
            
            int rowsAffected = jdbcTemplate.update(sql, normalizedVoterId, normalizedFullName, normalizedEmail, fingerprintHash, normalizedExtraField, role, eligibleElectionsJson);
            
            if (rowsAffected > 0) {
                // Store fingerprint data in separate table if provided
                if (fingerprintFile != null && !fingerprintFile.isEmpty()) {
                    insertFingerprintData(normalizedVoterId, fingerprintFile.getBytes());
                }
                
                // Insert profile photo if provided
                if (profilePhotoBase64 != null) {
                    insertProfilePhoto(normalizedVoterId, profilePhotoBase64);
                }

                // Log the registration
                Map<String, Object> auditDetails = new HashMap<>();
                auditDetails.put("message", "Voter " + normalizedVoterId + " registered successfully");
                auditDetails.put("voterId", normalizedVoterId);
                auditDetails.put("email", normalizedEmail);
                
                auditLogService.logSecurityEvent(
                    null, 
                    "VOTER_REGISTERED", 
                    "SYSTEM", 
                    ipAddress, 
                    userAgent, 
                    auditDetails
                );

                log.info("Voter registered successfully: {}", normalizedVoterId);
                
                return Map.of(
                    "success", true,
                    "message", "Voter registered successfully",
                    "voterId", normalizedVoterId
                );
            } else {
                throw new RuntimeException("Failed to register voter");
            }

        } catch (Exception e) {
            log.error("Failed to register voter {}: {}", voterId, e.getMessage());
            
            Map<String, Object> auditDetails = new HashMap<>();
            auditDetails.put("error", "Failed to register voter " + voterId + ": " + e.getMessage());
            auditDetails.put("voterId", voterId);
            
            auditLogService.logSecurityEvent(
                null, 
                "VOTER_REGISTRATION_FAILED", 
                "SYSTEM", 
                ipAddress, 
                userAgent, 
                auditDetails
            );
            throw new RuntimeException("Registration failed: " + e.getMessage());
        }
    }

    public Map<String, Object> getVoter(String voterId) {
        try {
            String sql = "SELECT * FROM voters WHERE voter_id = ?";
            Voter voter = jdbcTemplate.queryForObject(sql, new VoterRowMapper(), voterId);
            
            Map<String, Object> voterData = new HashMap<>();
            voterData.put("voterId", voter.getVoterId());
            voterData.put("fullName", voter.getFullName());
            voterData.put("email", voter.getEmail());
            voterData.put("extraField", voter.getExtraField());
            voterData.put("hasVoted", voter.getHasVoted());
            voterData.put("isActive", voter.getIsActive());
            voterData.put("role", voter.getRole().name());
            voterData.put("createdAt", voter.getCreatedAt());
            
            return Map.of("success", true, "data", voterData);
        } catch (Exception e) {
            log.error("Failed to get voter {}: {}", voterId, e.getMessage());
            throw new RuntimeException("Failed to get voter: " + e.getMessage());
        }
    }

    public Map<String, Object> getAllVoters(int limit, int offset) {
        try {
            String sql = "SELECT * FROM voters ORDER BY created_at DESC LIMIT ? OFFSET ?";
            List<Voter> voters = jdbcTemplate.query(sql, new VoterRowMapper(), limit, offset);
            
            String countSql = "SELECT COUNT(*) FROM voters";
            int totalCount = jdbcTemplate.queryForObject(countSql, Integer.class);
            
            return Map.of(
                "success", true,
                "data", voters,
                "total", totalCount,
                "limit", limit,
                "offset", offset
            );
        } catch (Exception e) {
            log.error("Failed to get voters: {}", e.getMessage());
            throw new RuntimeException("Failed to get voters: " + e.getMessage());
        }
    }

    private boolean voterExists(String voterId) {
        String sql = "SELECT COUNT(*) FROM voters WHERE UPPER(voter_id) = UPPER(?)";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, voterId);
        return count != null && count > 0;
    }

    private boolean emailExists(String email) {
        String sql = "SELECT COUNT(*) FROM voters WHERE email = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, email);
        return count != null && count > 0;
    }

    private String processFingerprintFile(MultipartFile fingerprintFile) throws Exception {
        // Create hash of fingerprint file for storage
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] fileBytes = fingerprintFile.getBytes();
        byte[] hashBytes = digest.digest(fileBytes);
        return Base64.getEncoder().encodeToString(hashBytes);
    }

    private String processProfilePhoto(MultipartFile profilePhotoFile) throws Exception {
        // Convert profile photo to base64 for storage
        byte[] fileBytes = profilePhotoFile.getBytes();
        return Base64.getEncoder().encodeToString(fileBytes);
    }

    private void insertProfilePhoto(String voterId, String profilePhotoBase64) {
        try {
            // Check if profile_photos table exists, if not create it
            String createTableSql = """
                CREATE TABLE IF NOT EXISTS profile_photos (
                    id BIGSERIAL PRIMARY KEY,
                    voter_id VARCHAR(50) UNIQUE NOT NULL,
                    photo_data TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (voter_id) REFERENCES voters(voter_id) ON DELETE CASCADE
                )
                """;
            jdbcTemplate.execute(createTableSql);

            String sql = "INSERT INTO profile_photos (voter_id, photo_data) VALUES (?, ?)";
            jdbcTemplate.update(sql, voterId, profilePhotoBase64);
        } catch (Exception e) {
            log.warn("Failed to insert profile photo for voter {}: {}", voterId, e.getMessage());
        }
    }

    public Map<String, Object> getVoterProfilePhoto(String voterId) {
        try {
            String sql = "SELECT photo_data FROM profile_photos WHERE voter_id = ?";
            String photoData = jdbcTemplate.queryForObject(sql, String.class, voterId);
            
            if (photoData != null) {
                return Map.of(
                    "success", true,
                    "photoData", photoData,
                    "voterId", voterId
                );
            } else {
                return Map.of(
                    "success", false,
                    "message", "No profile photo found for voter " + voterId
                );
            }
        } catch (Exception e) {
            log.error("Failed to get profile photo for voter {}: {}", voterId, e.getMessage());
            return Map.of(
                "success", false,
                "error", "Failed to retrieve profile photo: " + e.getMessage()
            );
        }
    }

    /**
     * Validate fingerprint with biometric service
     */
    private boolean validateFingerprintWithBiometricService(MultipartFile fingerprintFile) {
        try {
            // Call biometric service enhanced/enroll endpoint for validation
            String url = biometricServiceUrl + "/enhanced/enroll";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            
            // Create multipart form data
            org.springframework.util.LinkedMultiValueMap<String, Object> body = new org.springframework.util.LinkedMultiValueMap<>();
            body.add("fingerprint", fingerprintFile.getResource());
            body.add("voter_id", "VALIDATION_TEST");
            
            HttpEntity<org.springframework.util.LinkedMultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> result = response.getBody();
                return Boolean.TRUE.equals(result.get("success"));
            }
            
            return false;
        } catch (Exception e) {
            log.error("Fingerprint validation failed: {}", e.getMessage());
            return false;
        }
    }

    private static class VoterRowMapper implements RowMapper<Voter> {
        private static final Logger log = LoggerFactory.getLogger(VoterRowMapper.class);
        
        @Override
        public Voter mapRow(ResultSet rs, int rowNum) throws SQLException {
            // Parse eligible_elections JSONB column
            List<String> eligibleElections = parseEligibleElections(rs.getString("eligible_elections"));
            
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
                .eligibleElections(eligibleElections)
                .createdAt(rs.getTimestamp("created_at") != null ? 
                    rs.getTimestamp("created_at").toLocalDateTime() : null)
                .updatedAt(rs.getTimestamp("updated_at") != null ? 
                    rs.getTimestamp("updated_at").toLocalDateTime() : null)
                .build();
        }
        
        private List<String> parseEligibleElections(String jsonString) {
            if (jsonString == null || jsonString.trim().isEmpty() || jsonString.equals("[]")) {
                return new ArrayList<>();
            }
            
            try {
                // Remove brackets and quotes, then split by comma
                String cleaned = jsonString.trim();
                if (cleaned.startsWith("[")) {
                    cleaned = cleaned.substring(1);
                }
                if (cleaned.endsWith("]")) {
                    cleaned = cleaned.substring(0, cleaned.length() - 1);
                }
                
                if (cleaned.trim().isEmpty()) {
                    return new ArrayList<>();
                }
                
                // Split by comma and remove quotes
                String[] parts = cleaned.split(",");
                List<String> result = new ArrayList<>();
                for (String part : parts) {
                    String cleanedPart = part.trim();
                    // Remove surrounding quotes if present
                    if (cleanedPart.startsWith("\"") && cleanedPart.endsWith("\"")) {
                        cleanedPart = cleanedPart.substring(1, cleanedPart.length() - 1);
                    }
                    if (!cleanedPart.isEmpty()) {
                        result.add(cleanedPart);
                    }
                }
                return result;
            } catch (Exception e) {
                log.warn("Failed to parse eligible_elections JSON: {}", jsonString, e);
                return new ArrayList<>();
            }
        }
    }

    private void insertFingerprintData(String voterId, byte[] fingerprintData) {
        try {
            // Check if fingerprint_data table exists, if not create it
            String createTableSql = """
                CREATE TABLE IF NOT EXISTS fingerprint_data (
                    id BIGSERIAL PRIMARY KEY,
                    voter_id VARCHAR(50) UNIQUE NOT NULL,
                    fingerprint_data BYTEA,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (voter_id) REFERENCES voters(voter_id) ON DELETE CASCADE
                )
                """;
            jdbcTemplate.execute(createTableSql);

            String sql = "INSERT INTO fingerprint_data (voter_id, fingerprint_data) VALUES (?, ?) ON CONFLICT (voter_id) DO UPDATE SET fingerprint_data = EXCLUDED.fingerprint_data";
            jdbcTemplate.update(sql, voterId, fingerprintData);
        } catch (Exception e) {
            log.warn("Failed to insert fingerprint data for voter {}: {}", voterId, e.getMessage());
        }
    }

    public byte[] getStoredFingerprintData(String voterId) {
        try {
            String sql = "SELECT fingerprint_data FROM fingerprint_data WHERE voter_id = ?";
            List<byte[]> results = jdbcTemplate.query(sql, (rs, rowNum) -> rs.getBytes("fingerprint_data"), voterId);
            return results.isEmpty() ? null : results.get(0);
        } catch (Exception e) {
            log.warn("Failed to retrieve fingerprint data for voter {}: {}", voterId, e.getMessage());
            return null;
        }
    }

    private List<Long> determineEligibleElections(String voterId, String role) {
        try {
            // Get all active and upcoming elections for new voters
            List<Election> activeElections = electionService.findActiveElections();
            List<Election> upcomingElections = electionService.findUpcomingElections();
            
            // Use Set to avoid duplicates
            Set<Long> eligibleElectionIds = new HashSet<>();
            
            // Add active elections
            for (Election election : activeElections) {
                eligibleElectionIds.add(election.getId());
            }
            
            // Add upcoming elections
            for (Election election : upcomingElections) {
                eligibleElectionIds.add(election.getId());
            }
            
            List<Long> result = new ArrayList<>(eligibleElectionIds);
            log.info("Determined {} eligible elections for voter {}: {}", result.size(), voterId, result);
            return result;
        } catch (Exception e) {
            log.warn("Failed to determine eligible elections for voter {}: {}", voterId, e.getMessage());
            return List.of();
        }
    }

    private String convertElectionsToJson(List<Long> electionIds) {
        if (electionIds == null || electionIds.isEmpty()) {
            return "[]";
        }
        
        // Convert list to JSON array format
        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < electionIds.size(); i++) {
            json.append("\"").append(electionIds.get(i)).append("\"");
            if (i < electionIds.size() - 1) {
                json.append(",");
            }
        }
        json.append("]");
        return json.toString();
    }

    public List<Map<String, Object>> getEligibleElectionsForVoter(String voterId) {
        try {
            String sql = """
                SELECT e.id, e.name, e.description, e.start_date, e.end_date, e.status
                FROM elections e
                INNER JOIN voters v ON v.eligible_elections ? e.id::text
                WHERE v.voter_id = ? AND v.is_active = true AND e.is_active = true
                ORDER BY e.start_date ASC
                """;
            
            return jdbcTemplate.query(sql, (rs, rowNum) -> {
                Map<String, Object> election = new HashMap<>();
                election.put("id", rs.getLong("id"));
                election.put("name", rs.getString("name"));
                election.put("description", rs.getString("description"));
                election.put("startDate", rs.getTimestamp("start_date"));
                election.put("endDate", rs.getTimestamp("end_date"));
                election.put("status", rs.getString("status"));
                return election;
            }, voterId);
        } catch (Exception e) {
            log.error("Failed to get eligible elections for voter {}: {}", voterId, e.getMessage());
            return List.of();
        }
    }
}
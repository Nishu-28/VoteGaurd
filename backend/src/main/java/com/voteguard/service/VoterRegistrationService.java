package com.voteguard.service;

import com.voteguard.model.Voter;
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
import java.util.List;
import java.util.Map;
import java.util.Base64;

@Service
public class VoterRegistrationService {

    private static final Logger log = LoggerFactory.getLogger(VoterRegistrationService.class);

    private final JdbcTemplate jdbcTemplate;
    private final AuditLogService auditLogService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${biometric.service.url:http://localhost:8001}")
    private String biometricServiceUrl;

    @Autowired
    public VoterRegistrationService(JdbcTemplate jdbcTemplate, AuditLogService auditLogService) {
        this.jdbcTemplate = jdbcTemplate;
        this.auditLogService = auditLogService;
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

            // Insert voter into database
            String sql = """
                INSERT INTO voters (voter_id, full_name, email, fingerprint_hash, fingerprint_data, extra_field, has_voted, is_active, role)
                VALUES (?, ?, ?, ?, ?, ?, false, true, ?)
                """;
            
            // Get fingerprint data as byte array
            byte[] fingerprintData = null;
            if (fingerprintFile != null && !fingerprintFile.isEmpty()) {
                fingerprintData = fingerprintFile.getBytes();
            }
            
            int rowsAffected = jdbcTemplate.update(sql, normalizedVoterId, normalizedFullName, normalizedEmail, fingerprintHash, fingerprintData, normalizedExtraField, role);
            
            if (rowsAffected > 0) {
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
                .createdAt(rs.getTimestamp("created_at") != null ? 
                    rs.getTimestamp("created_at").toLocalDateTime() : null)
                .updatedAt(rs.getTimestamp("updated_at") != null ? 
                    rs.getTimestamp("updated_at").toLocalDateTime() : null)
                .build();
        }
    }
}
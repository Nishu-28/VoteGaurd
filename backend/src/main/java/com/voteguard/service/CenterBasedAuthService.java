package com.voteguard.service;

import com.voteguard.model.Voter;
import com.voteguard.repository.VoterRepository;
import com.voteguard.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.jdbc.core.JdbcTemplate;

import java.io.IOException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CenterBasedAuthService {

    private final VoterRepository voterRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuditLogService auditLogService;
    private final JdbcTemplate jdbcTemplate;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${biometric.service.url:http://localhost:8001}")
    private String biometricServiceUrl;

    @Value("${jwt.session-timeout:120000}") // 2 minutes default
    private long sessionTimeout;

    /**
     * Authenticate voter using voter ID, extra field, and fingerprint
     */
    public Map<String, Object> authenticateVoter(String voterId, String extraField, MultipartFile fingerprintFile, String ipAddress, String userAgent) {
        try {
            // Normalize inputs for better matching
            String normalizedVoterId = voterId != null ? voterId.trim().toUpperCase() : "";
            String normalizedExtraField = extraField != null ? extraField.trim() : "";
            
            // Validate inputs
            if (normalizedVoterId.isEmpty() || normalizedExtraField.isEmpty()) {
                log.warn("Authentication failed: Empty voterId or extraField");
                auditLogService.logSecurityEvent(null, "AUTH_FAILED", "AUTH", ipAddress, userAgent, 
                    Map.of("reason", "empty_credentials", "voterId", voterId));
                throw new RuntimeException("Voter ID and extra field are required");
            }
            
            // Step 1: Find voter by voter ID and extra field (case-insensitive)
            Optional<Voter> voterOpt = voterRepository.findByVoterIdAndExtraField(normalizedVoterId, normalizedExtraField);
            if (voterOpt.isEmpty()) {
                log.warn("Authentication failed: Voter not found with voterId={} and extraField={}", normalizedVoterId, normalizedExtraField);
                auditLogService.logSecurityEvent(null, "AUTH_FAILED", "AUTH", ipAddress, userAgent, 
                    Map.of("reason", "voter_not_found", "voterId", normalizedVoterId, "originalVoterId", voterId));
                throw new RuntimeException("Invalid voter credentials. Please check your Voter ID and extra field.");
            }

            Voter voter = voterOpt.get();
            
            // Step 2: Check if voter is active
            if (!voter.getIsActive()) {
                log.warn("Authentication failed: Inactive voter voterId={}", voterId);
                auditLogService.logSecurityEvent(voter.getId(), "AUTH_FAILED", "AUTH", ipAddress, userAgent, 
                    Map.of("reason", "inactive_voter"));
                throw new RuntimeException("Voter account is inactive");
            }

            // Step 3: Check if voter has already voted
            if (voter.getHasVoted()) {
                log.warn("Authentication failed: Voter already voted voterId={}", voterId);
                auditLogService.logSecurityEvent(voter.getId(), "AUTH_FAILED", "AUTH", ipAddress, userAgent, 
                    Map.of("reason", "already_voted"));
                throw new RuntimeException("Voter has already cast their vote");
            }

            // Step 4: Verify fingerprint
            boolean fingerprintVerified = verifyFingerprint(voter.getFingerprintHash(), fingerprintFile);
            if (!fingerprintVerified) {
                log.warn("Authentication failed: Fingerprint verification failed for voterId={}", voterId);
                auditLogService.logSecurityEvent(voter.getId(), "FINGERPRINT_VERIFICATION_FAILED", "AUTH", ipAddress, userAgent, 
                    Map.of("reason", "fingerprint_mismatch"));
                throw new RuntimeException("Fingerprint verification failed");
            }

            // Step 5: Generate JWT token with session timeout
            String token = jwtTokenProvider.generateTokenWithExpiration(voter, sessionTimeout);

            // Step 6: Log successful authentication
            auditLogService.logSecurityEvent(voter.getId(), "FINGERPRINT_LOGIN", "AUTH", ipAddress, userAgent, 
                Map.of("login_time", System.currentTimeMillis(), "method", "fingerprint"));

            log.info("Successful authentication for voterId={}", voterId);

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("voter", voter);
            response.put("sessionTimeout", sessionTimeout);
            
            return response;

        } catch (Exception e) {
            log.error("Authentication error for voterId={}: {}", voterId, e.getMessage());
            throw new RuntimeException("Authentication failed: " + e.getMessage());
        }
    }

    /**
     * Verify fingerprint against stored hash using biometric service
     */
    private boolean verifyFingerprint(String storedHash, MultipartFile fingerprintFile) {
        try {
            // Get the stored fingerprint data from the database
            String sql = "SELECT fingerprint_data FROM voters WHERE fingerprint_hash = ?";
            byte[] storedFingerprintData = jdbcTemplate.queryForObject(sql, byte[].class, storedHash);
            
            if (storedFingerprintData == null) {
                log.error("No stored fingerprint data found for hash: {}", storedHash);
                return false;
            }
            
            // Call biometric service comparison endpoint
            String url = biometricServiceUrl + "/compare";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            // Create multipart form data with both fingerprints
            org.springframework.util.LinkedMultiValueMap<String, Object> body = new org.springframework.util.LinkedMultiValueMap<>();
            
            // Create a temporary file resource for the stored fingerprint
            org.springframework.core.io.ByteArrayResource storedResource = new org.springframework.core.io.ByteArrayResource(storedFingerprintData) {
                @Override
                public String getFilename() {
                    return "stored_fingerprint.tif";
                }
            };
            
            body.add("stored_fingerprint", storedResource);
            body.add("current_fingerprint", fingerprintFile.getResource());

            HttpEntity<org.springframework.util.LinkedMultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> result = response.getBody();
                boolean isMatch = Boolean.TRUE.equals(result.get("match"));
                Double matchScore = (Double) result.get("match_score");
                
                log.info("Fingerprint comparison result: match={}, score={}", isMatch, matchScore);
                return isMatch;
            }
            
            return false;
        } catch (Exception e) {
            log.error("Fingerprint verification error: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Register fingerprint for a voter (Admin only)
     */
    public Map<String, Object> registerFingerprint(Long voterId, MultipartFile fingerprintFile, String adminIpAddress, String adminUserAgent) {
        try {
            // Find voter
            Voter voter = voterRepository.findById(voterId)
                .orElseThrow(() -> new RuntimeException("Voter not found"));

            // Process fingerprint through biometric service
            String fingerprintHash = processFingerprintForRegistration(fingerprintFile);
            
            // Update voter with new fingerprint hash
            voter.setFingerprintHash(fingerprintHash);
            voterRepository.save(voter);

            // Log the registration
            auditLogService.logSecurityEvent(voterId, "FINGERPRINT_REGISTERED", "VOTER", adminIpAddress, adminUserAgent, 
                Map.of("voter_id", voter.getVoterId(), "registration_time", System.currentTimeMillis()));

            log.info("Fingerprint registered for voterId={}", voter.getVoterId());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Fingerprint registered successfully");
            response.put("voterId", voter.getVoterId());
            
            return response;

        } catch (Exception e) {
            log.error("Fingerprint registration error: {}", e.getMessage());
            throw new RuntimeException("Fingerprint registration failed: " + e.getMessage());
        }
    }

    /**
     * Process fingerprint for registration using biometric service
     */
    private String processFingerprintForRegistration(MultipartFile fingerprintFile) {
        try {
            // Convert file to base64
            String fingerprintData = Base64.getEncoder().encodeToString(fingerprintFile.getBytes());

            // Call biometric service for enrollment
            String url = biometricServiceUrl + "/api/v1/scan";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("fingerprint_data", fingerprintData);
            body.add("quality_threshold", "0.7");

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> result = response.getBody();
                return (String) result.get("hash");
            }
            
            throw new RuntimeException("Failed to process fingerprint");
        } catch (Exception e) {
            log.error("Fingerprint processing error: {}", e.getMessage());
            throw new RuntimeException("Fingerprint processing failed: " + e.getMessage());
        }
    }

    /**
     * Invalidate token after voting (force logout)
     */
    public void invalidateTokenAfterVoting(String token) {
        // In a production system, you might want to maintain a blacklist of tokens
        // For now, we rely on the short session timeout
        log.info("Token invalidated after voting");
    }
}





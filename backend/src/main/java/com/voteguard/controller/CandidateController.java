package com.voteguard.controller;

import com.voteguard.model.Candidate;
import com.voteguard.repository.CandidateRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/candidates")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
@RequiredArgsConstructor
public class CandidateController {

    private static final Logger log = LoggerFactory.getLogger(CandidateController.class);
    
    private final CandidateRepository candidateRepository;
    private final JdbcTemplate jdbcTemplate;

    @GetMapping
    public ResponseEntity<List<Candidate>> getAllCandidates() {
        List<Candidate> candidates = candidateRepository.findAll();
        return ResponseEntity.ok(candidates);
    }

    @GetMapping("/active")
    public ResponseEntity<List<Candidate>> getActiveCandidates() {
        List<Candidate> candidates = candidateRepository.findByIsActiveTrue();
        return ResponseEntity.ok(candidates);
    }

    @GetMapping("/election/{electionId}")
    public ResponseEntity<List<Candidate>> getCandidatesByElection(@PathVariable Long electionId) {
        List<Candidate> candidates = candidateRepository.findByElectionIdOrderByNumber(electionId);
        return ResponseEntity.ok(candidates);
    }
    
    @GetMapping("/election-code/{electionCode}")
    public ResponseEntity<?> getCandidatesByElectionCode(@PathVariable String electionCode) {
        try {
            // Find election by code first
            String sql = "SELECT id FROM elections WHERE election_code = ? AND is_active = true";
            List<Long> electionIds = jdbcTemplate.query(sql, (rs, rowNum) -> rs.getLong("id"), electionCode.toUpperCase());
            
            if (electionIds.isEmpty()) {
                return ResponseEntity.badRequest().body(java.util.Map.of(
                    "success", false,
                    "message", "Election not found with code: " + electionCode
                ));
            }
            
            Long electionId = electionIds.get(0);
            List<Candidate> candidates = candidateRepository.findByElectionIdOrderByNumber(electionId);
            return ResponseEntity.ok(candidates);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                "success", false,
                "message", "Error fetching candidates: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Candidate> getCandidateById(@PathVariable Long id) {
        Optional<Candidate> candidate = candidateRepository.findById(id);
        return candidate.map(ResponseEntity::ok)
                       .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> registerCandidate(
            @RequestParam("name") String name,
            @RequestParam("party") String party,
            @RequestParam("description") String description,
            @RequestParam(value = "candidateNumber", required = false) Integer candidateNumber,
            @RequestParam(value = "candidatePhoto", required = false) MultipartFile candidatePhoto,
            @RequestParam(value = "partyLogo", required = false) MultipartFile partyLogo,
            @RequestParam("electionId") Long electionId) {
        
        try {
            log.info("Received candidate registration request: name={}, party={}, electionId={}", name, party, electionId);
            
            // Create candidate object
            Candidate candidate = Candidate.builder()
                    .name(name)
                    .party(party)
                    .description(description)
                    .candidateNumber(candidateNumber)
                    .electionId(electionId)
                    .isActive(true)
                    .build();
            
            // Save candidate
            Candidate savedCandidate = candidateRepository.save(candidate);
            
            // Process and store photos if provided
            if (candidatePhoto != null && !candidatePhoto.isEmpty()) {
                try {
                    String candidatePhotoBase64 = processCandidatePhoto(candidatePhoto);
                    insertCandidatePhoto(savedCandidate.getId(), candidatePhotoBase64);
                    log.info("Candidate photo stored for candidate ID: {}", savedCandidate.getId());
                } catch (Exception e) {
                    log.warn("Failed to store candidate photo for ID {}: {}", savedCandidate.getId(), e.getMessage());
                }
            }
            
            if (partyLogo != null && !partyLogo.isEmpty()) {
                try {
                    String partyLogoBase64 = processPartyLogo(partyLogo);
                    insertPartyLogo(savedCandidate.getId(), partyLogoBase64);
                    log.info("Party logo stored for candidate ID: {}", savedCandidate.getId());
                } catch (Exception e) {
                    log.warn("Failed to store party logo for ID {}: {}", savedCandidate.getId(), e.getMessage());
                }
            }
            
            log.info("Candidate registered successfully with ID: {}", savedCandidate.getId());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Candidate registered successfully",
                "candidate", savedCandidate
            ));
            
        } catch (Exception e) {
            log.error("Failed to register candidate: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to register candidate: " + e.getMessage()
            ));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateCandidate(@PathVariable Long id, @RequestBody Map<String, Object> candidateData) {
        try {
            Optional<Candidate> optionalCandidate = candidateRepository.findById(id);
            if (optionalCandidate.isPresent()) {
                Candidate existingCandidate = optionalCandidate.get();
                
                // Create updated candidate
                Candidate updatedCandidate = Candidate.builder()
                        .id(id)
                        .name((String) candidateData.getOrDefault("name", existingCandidate.getName()))
                        .party((String) candidateData.getOrDefault("party", existingCandidate.getParty()))
                        .description((String) candidateData.getOrDefault("description", existingCandidate.getDescription()))
                        .candidateNumber((Integer) candidateData.getOrDefault("candidateNumber", existingCandidate.getCandidateNumber()))
                        .electionId((Long) candidateData.getOrDefault("electionId", existingCandidate.getElectionId()))
                        .isActive((Boolean) candidateData.getOrDefault("isActive", existingCandidate.getIsActive()))
                        .createdAt(existingCandidate.getCreatedAt())
                        .build();
                
                Candidate saved = candidateRepository.save(updatedCandidate);
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Candidate updated successfully",
                    "candidate", saved
                ));
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Failed to update candidate {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to update candidate: " + e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCandidate(@PathVariable Long id) {
        candidateRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<Map<String, Object>> deactivateCandidate(@PathVariable Long id) {
        try {
            Optional<Candidate> optionalCandidate = candidateRepository.findById(id);
            if (optionalCandidate.isPresent()) {
                Candidate candidate = optionalCandidate.get();
                // Create new candidate with isActive = false
                Candidate deactivatedCandidate = Candidate.builder()
                        .id(candidate.getId())
                        .name(candidate.getName())
                        .party(candidate.getParty())
                        .description(candidate.getDescription())
                        .candidateNumber(candidate.getCandidateNumber())
                        .electionId(candidate.getElectionId())
                        .isActive(false)
                        .createdAt(candidate.getCreatedAt())
                        .build();
                
                Candidate updatedCandidate = candidateRepository.save(deactivatedCandidate);
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Candidate deactivated successfully",
                    "candidate", updatedCandidate
                ));
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Failed to deactivate candidate {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to deactivate candidate: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/{id}/photo")
    public ResponseEntity<Map<String, Object>> getCandidatePhoto(@PathVariable Long id) {
        try {
            String sql = "SELECT photo_data FROM candidate_photos WHERE candidate_id = ?";
            
            try {
                String photoData = jdbcTemplate.queryForObject(sql, String.class, id);
                
                if (photoData != null) {
                    return ResponseEntity.ok(Map.of(
                        "success", true,
                        "photoData", photoData,
                        "candidateId", id
                    ));
                } else {
                    return ResponseEntity.ok(Map.of(
                        "success", false,
                        "message", "No photo found for candidate " + id
                    ));
                }
            } catch (org.springframework.dao.EmptyResultDataAccessException e) {
                // No photo found - return success=false instead of error
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", "No photo found for candidate " + id
                ));
            }
        } catch (Exception e) {
            log.error("Failed to get candidate photo for ID {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to retrieve candidate photo: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/{id}/party-logo")
    public ResponseEntity<Map<String, Object>> getPartyLogo(@PathVariable Long id) {
        try {
            String sql = "SELECT logo_data FROM party_logos WHERE candidate_id = ?";
            
            try {
                String logoData = jdbcTemplate.queryForObject(sql, String.class, id);
                
                if (logoData != null) {
                    return ResponseEntity.ok(Map.of(
                        "success", true,
                        "logoData", logoData,
                        "candidateId", id
                    ));
                } else {
                    return ResponseEntity.ok(Map.of(
                        "success", false,
                        "message", "No party logo found for candidate " + id
                    ));
                }
            } catch (org.springframework.dao.EmptyResultDataAccessException e) {
                // No logo found - return success=false instead of error
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", "No party logo found for candidate " + id
                ));
            }
        } catch (Exception e) {
            log.error("Failed to get party logo for candidate ID {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to retrieve party logo: " + e.getMessage()
            ));
        }
    }

    private String processCandidatePhoto(MultipartFile photoFile) throws Exception {
        // Convert photo to base64 for storage
        byte[] fileBytes = photoFile.getBytes();
        return Base64.getEncoder().encodeToString(fileBytes);
    }

    private String processPartyLogo(MultipartFile logoFile) throws Exception {
        // Convert logo to base64 for storage
        byte[] fileBytes = logoFile.getBytes();
        return Base64.getEncoder().encodeToString(fileBytes);
    }

    private void insertCandidatePhoto(Long candidateId, String photoBase64) {
        try {
            // Check if candidate_photos table exists, if not create it
            String createTableSql = """
                CREATE TABLE IF NOT EXISTS candidate_photos (
                    id BIGSERIAL PRIMARY KEY,
                    candidate_id BIGINT UNIQUE NOT NULL,
                    photo_data TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
                )
                """;
            jdbcTemplate.execute(createTableSql);

            String sql = "INSERT INTO candidate_photos (candidate_id, photo_data) VALUES (?, ?) ON CONFLICT (candidate_id) DO UPDATE SET photo_data = EXCLUDED.photo_data";
            jdbcTemplate.update(sql, candidateId, photoBase64);
        } catch (Exception e) {
            log.warn("Failed to insert candidate photo for candidate {}: {}", candidateId, e.getMessage());
        }
    }

    private void insertPartyLogo(Long candidateId, String logoBase64) {
        try {
            // Check if party_logos table exists, if not create it
            String createTableSql = """
                CREATE TABLE IF NOT EXISTS party_logos (
                    id BIGSERIAL PRIMARY KEY,
                    candidate_id BIGINT UNIQUE NOT NULL,
                    logo_data TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
                )
                """;
            jdbcTemplate.execute(createTableSql);

            String sql = "INSERT INTO party_logos (candidate_id, logo_data) VALUES (?, ?) ON CONFLICT (candidate_id) DO UPDATE SET logo_data = EXCLUDED.logo_data";
            jdbcTemplate.update(sql, candidateId, logoBase64);
        } catch (Exception e) {
            log.warn("Failed to insert party logo for candidate {}: {}", candidateId, e.getMessage());
        }
    }
}

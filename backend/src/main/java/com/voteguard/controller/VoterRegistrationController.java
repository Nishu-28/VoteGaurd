package com.voteguard.controller;

import com.voteguard.service.VoterRegistrationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/voters")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class VoterRegistrationController {

    private static final Logger log = LoggerFactory.getLogger(VoterRegistrationController.class);
    
    private final VoterRegistrationService voterRegistrationService;

    @Autowired
    public VoterRegistrationController(VoterRegistrationService voterRegistrationService) {
        this.voterRegistrationService = voterRegistrationService;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> registerVoter(
            @RequestParam("voterId") String voterId,
            @RequestParam("fullName") String fullName,
            @RequestParam("email") String email,
            @RequestParam("extraField") String extraField,
            @RequestParam(value = "role", defaultValue = "VOTER") String role,
            @RequestParam("fingerprint") MultipartFile fingerprintFile,
            @RequestParam(value = "profilePhoto", required = false) MultipartFile profilePhotoFile,
            HttpServletRequest request) {
        
        try {
            String ipAddress = getClientIpAddress(request);
            String userAgent = request.getHeader("User-Agent");
            
            Map<String, Object> response = voterRegistrationService.registerVoter(
                voterId, fullName, email, extraField, role, fingerprintFile, profilePhotoFile, ipAddress, userAgent);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Voter registration failed for voterId={}: {}", voterId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{voterId}")
    public ResponseEntity<Map<String, Object>> getVoter(@PathVariable String voterId) {
        try {
            Map<String, Object> response = voterRegistrationService.getVoter(voterId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to get voter {}: {}", voterId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("")
    public ResponseEntity<Map<String, Object>> getAllVoters(
            @RequestParam(value = "limit", defaultValue = "50") int limit,
            @RequestParam(value = "offset", defaultValue = "0") int offset) {
        try {
            Map<String, Object> response = voterRegistrationService.getAllVoters(limit, offset);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to get voters: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{voterId}/profile-photo")
    public ResponseEntity<Map<String, Object>> getVoterProfilePhoto(@PathVariable String voterId) {
        try {
            Map<String, Object> response = voterRegistrationService.getVoterProfilePhoto(voterId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to get profile photo for voter {}: {}", voterId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

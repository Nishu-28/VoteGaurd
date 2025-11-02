package com.voteguard.controller;

import com.voteguard.service.BiometricService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/biometric")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class BiometricController {

    private static final Logger log = LoggerFactory.getLogger(BiometricController.class);
    
    private final BiometricService biometricService;

    @Autowired
    public BiometricController(BiometricService biometricService) {
        this.biometricService = biometricService;
    }

    @PostMapping("/verify-fingerprint")
    public ResponseEntity<Map<String, Object>> verifyFingerprint(
            @RequestParam("fingerprint") MultipartFile fingerprintFile,
            @RequestParam("voterId") String voterId) {
        
        try {
            log.info("Fingerprint verification requested for voter: {} - using stored fingerprint comparison", voterId);
            
            Map<String, Object> result = biometricService.verifyVoterFingerprint(voterId, fingerprintFile);
            
            boolean verified = Boolean.TRUE.equals(result.get("verified"));
            log.info("Fingerprint verification result for voter {}: {}", voterId, verified ? "SUCCESS" : "FAILED");
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Fingerprint verification failed for voter {}: {}", voterId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "verified", false,
                "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/enroll-fingerprint")
    public ResponseEntity<Map<String, Object>> enrollFingerprint(
            @RequestParam("fingerprint") MultipartFile fingerprintFile) {
        
        try {
            log.info("Fingerprint enrollment requested");
            
            Map<String, Object> result = biometricService.enrollFingerprint(fingerprintFile);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Fingerprint enrollment failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "verified", false,
                "error", e.getMessage()
            ));
        }
    }
}

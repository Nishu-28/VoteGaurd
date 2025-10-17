package com.voteguard.controller;

import com.voteguard.service.CenterBasedAuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class CenterBasedAuthController {

    private static final Logger log = LoggerFactory.getLogger(CenterBasedAuthController.class);
    
    private final CenterBasedAuthService centerBasedAuthService;
    
    @Autowired
    public CenterBasedAuthController(CenterBasedAuthService centerBasedAuthService) {
        this.centerBasedAuthService = centerBasedAuthService;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestParam("voterId") String voterId,
            @RequestParam("extraField") String extraField,
            @RequestParam("fingerprint") MultipartFile fingerprintFile,
            HttpServletRequest request) {
        
        try {
            String ipAddress = getClientIpAddress(request);
            String userAgent = request.getHeader("User-Agent");
            
            Map<String, Object> response = centerBasedAuthService.authenticateVoter(
                voterId, extraField, fingerprintFile, ipAddress, userAgent);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Login failed for voterId={}: {}", voterId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/register-fingerprint")
    public ResponseEntity<Map<String, Object>> registerFingerprint(
            @RequestParam("voterId") Long voterId,
            @RequestParam("fingerprint") MultipartFile fingerprintFile,
            HttpServletRequest request) {
        
        try {
            String ipAddress = getClientIpAddress(request);
            String userAgent = request.getHeader("User-Agent");
            
            Map<String, Object> response = centerBasedAuthService.registerFingerprint(
                voterId, fingerprintFile, ipAddress, userAgent);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Fingerprint registration failed for voterId={}: {}", voterId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(@RequestHeader("Authorization") String token) {
        try {
            centerBasedAuthService.invalidateTokenAfterVoting(token);
            return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
        } catch (Exception e) {
            log.error("Logout failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Logout failed"));
        }
    }

    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping() {
        return ResponseEntity.ok(Map.of("message", "Center-based auth service is running"));
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

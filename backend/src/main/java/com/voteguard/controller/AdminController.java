package com.voteguard.controller;

import com.voteguard.model.AdminUser;
import com.voteguard.service.AdminService;
import com.voteguard.service.AdminService.AdminAuthResult;
import com.voteguard.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    /**
     * Admin login with biometric authentication
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> loginWithBiometric(
            @RequestParam("adminId") String adminId,
            @RequestParam("fingerprint") MultipartFile fingerprintFile,
            @RequestParam(value = "loginMethod", defaultValue = "BIOMETRIC") String loginMethod,
            HttpServletRequest request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Get client information
            String ipAddress = getClientIpAddress(request);
            String userAgent = request.getHeader("User-Agent");
            
            // Authenticate with biometric
            AdminAuthResult authResult = adminService.authenticateWithBiometric(
                adminId, fingerprintFile, ipAddress, userAgent);
            
            if (authResult.isSuccess()) {
                AdminUser admin = authResult.getAdmin();
                
                // Generate JWT token for admin
                UserDetails userDetails = User.builder()
                    .username(admin.getAdminId())
                    .password("") // Password not needed for token generation
                    .authorities(new ArrayList<>()) // Add roles if needed
                    .build();
                    
                String jwtToken = jwtTokenProvider.generateToken(userDetails);
                
                response.put("success", true);
                response.put("message", "Login successful");
                response.put("token", jwtToken); // JWT token instead of session ID
                response.put("sessionId", authResult.getSession().getSessionId()); // Keep for compatibility
                response.put("expiresAt", authResult.getSession().getExpiresAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                
                // Admin info (excluding sensitive data)
                Map<String, Object> adminInfo = new HashMap<>();
                adminInfo.put("adminId", admin.getAdminId());
                adminInfo.put("username", admin.getUsername());
                adminInfo.put("role", admin.getRole());
                adminInfo.put("lastLogin", admin.getLastLogin() != null ? 
                    admin.getLastLogin().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);
                
                response.put("admin", adminInfo);
                
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", authResult.getMessage());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Login failed due to system error");
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Admin login with fallback code
     */
    @PostMapping("/login/fallback")
    public ResponseEntity<Map<String, Object>> loginWithFallback(
            @RequestBody Map<String, String> loginData,
            HttpServletRequest request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String adminId = loginData.get("adminId");
            String fallbackCode = loginData.get("fallbackCode");
            
            if (adminId == null || fallbackCode == null) {
                response.put("success", false);
                response.put("message", "Admin ID and fallback code are required");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Get client information
            String ipAddress = getClientIpAddress(request);
            String userAgent = request.getHeader("User-Agent");
            
            // For now, just return failure for fallback authentication
            response.put("success", false);
            response.put("message", "Fallback authentication not supported in simplified version");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Login failed due to system error");
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Logout admin
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(@RequestBody Map<String, String> logoutData) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String sessionId = logoutData.get("sessionId");
            
            if (sessionId != null) {
                adminService.logout(sessionId);
            }
            
            response.put("success", true);
            response.put("message", "Logout successful");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Logout failed");
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Refresh session
     */
    @PostMapping("/session/refresh")
    public ResponseEntity<Map<String, Object>> refreshSession(@RequestBody Map<String, String> sessionData) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String sessionId = sessionData.get("sessionId");
            
            if (sessionId == null) {
                response.put("success", false);
                response.put("message", "Session ID is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            boolean refreshed = adminService.extendSession(sessionId);
            
            if (refreshed) {
                response.put("success", true);
                response.put("message", "Session refreshed successfully");
                response.put("expiresAt", LocalDateTime.now().plusMinutes(480).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Failed to refresh session");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Session refresh failed");
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Validate session (for middleware/interceptors)
     */
    @PostMapping("/session/validate")
    public ResponseEntity<Map<String, Object>> validateSession(@RequestBody Map<String, String> sessionData) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String sessionId = sessionData.get("sessionId");
            
            if (sessionId == null) {
                response.put("valid", false);
                response.put("message", "Session ID is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            Optional<AdminUser> adminOpt = adminService.validateSession(sessionId);
            
            if (adminOpt.isPresent()) {
                AdminUser admin = adminOpt.get();
                
                response.put("valid", true);
                response.put("message", "Session is valid");
                
                // Admin info
                Map<String, Object> adminInfo = new HashMap<>();
                adminInfo.put("adminId", admin.getAdminId());
                adminInfo.put("username", admin.getUsername());
                adminInfo.put("role", admin.getRole());
                
                response.put("admin", adminInfo);
                
                return ResponseEntity.ok(response);
            } else {
                response.put("valid", false);
                response.put("message", "Invalid or expired session");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            
        } catch (Exception e) {
            response.put("valid", false);
            response.put("message", "Session validation failed");
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Get admin login history
     */
    @GetMapping("/{adminId}/login-history")
    public ResponseEntity<Map<String, Object>> getLoginHistory(
            @PathVariable String adminId,
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<Object[]> history = adminService.getLoginHistory(adminId, limit);
            
            response.put("success", true);
            response.put("history", history);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to get login history");
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * INTERNAL USE ONLY - Enroll fingerprint for admin
     * This endpoint is for administrative setup purposes only
     */
    @PostMapping("/internal/enroll-fingerprint")
    public ResponseEntity<Map<String, Object>> enrollAdminFingerprint(
            @RequestParam("adminId") String adminId,
            @RequestParam("fingerprint") MultipartFile fingerprintFile,
            HttpServletRequest request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Get client information
            String ipAddress = getClientIpAddress(request);
            String userAgent = request.getHeader("User-Agent");
            
            // Enroll fingerprint for admin
            boolean enrolled = adminService.updateBiometricInfo(adminId, fingerprintFile);
            
            if (enrolled) {
                response.put("success", true);
                response.put("message", "Fingerprint enrolled successfully for admin: " + adminId);
                response.put("adminId", adminId);
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Failed to enroll fingerprint for admin: " + adminId);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Fingerprint enrollment failed due to system error");
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * INTERNAL USE ONLY - Check admin biometric status
     */
    @GetMapping("/internal/{adminId}/biometric-status")
    public ResponseEntity<Map<String, Object>> getAdminBiometricStatus(@PathVariable String adminId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<AdminUser> adminOpt = adminService.getAdminByAdminId(adminId);
            
            if (!adminOpt.isPresent()) {
                response.put("success", false);
                response.put("message", "Admin not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            
            AdminUser admin = adminOpt.get();
            
            response.put("success", true);
            response.put("adminId", admin.getAdminId());
            response.put("username", admin.getUsername());
            response.put("hasBiometric", admin.getHasBiometric());
            response.put("biometricEnrolledDate", admin.getBiometricEnrolledDate() != null ? 
                admin.getBiometricEnrolledDate().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);
            response.put("fingerprintTemplateId", admin.getFingerprintTemplateId());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to get biometric status");
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * INTERNAL USE ONLY - Test biometric service connectivity
     */
    @PostMapping("/internal/test-biometric")
    public ResponseEntity<Map<String, Object>> testBiometricService(
            @RequestParam("fingerprint") MultipartFile fingerprintFile,
            HttpServletRequest request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Get client information
            String ipAddress = getClientIpAddress(request);
            String userAgent = request.getHeader("User-Agent");
            
            // Test feature removed in simplified version
            response.put("success", false);
            response.put("message", "Test feature not available in simplified version");
            response.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            
            return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Biometric service test failed");
            response.put("error", e.getMessage());
            response.put("stackTrace", e.getClass().getSimpleName());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Get client IP address
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}
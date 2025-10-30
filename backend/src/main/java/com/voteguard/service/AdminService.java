package com.voteguard.service;

import com.voteguard.model.AdminUser;
import com.voteguard.model.AdminSession;
import com.voteguard.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AdminService {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private BiometricService biometricService;

    // Default session duration in minutes
    private static final int DEFAULT_SESSION_DURATION = 480; // 8 hours

    /**
     * Authenticate admin with biometric verification
     */
    public AdminAuthResult authenticateWithBiometric(String adminId, MultipartFile fingerprintFile, String ipAddress, String userAgent) {
        try {
            // Find admin user
            Optional<AdminUser> adminOpt = adminRepository.findByAdminId(adminId);
            if (!adminOpt.isPresent()) {
                return AdminAuthResult.failure("Admin not found");
            }

            AdminUser admin = adminOpt.get();

            // Check if account is active
            if (!admin.isActive()) {
                return AdminAuthResult.failure("Account is inactive");
            }

            // Check if biometric is enrolled
            if (!admin.getHasBiometric()) {
                return AdminAuthResult.failure("Biometric authentication not set up for this admin");
            }

            // Get stored fingerprint data
            byte[] storedFingerprintData = adminRepository.getFingerprintData(adminId);
            if (storedFingerprintData == null) {
                return AdminAuthResult.failure("No fingerprint data found for this admin");
            }
            
            // Compare fingerprints
            boolean biometricVerified = biometricService.compareFingerprintWithStored(fingerprintFile, storedFingerprintData, adminId);
            
            if (!biometricVerified) {
                return AdminAuthResult.failure("Biometric verification failed");
            }

            // Authentication successful - create simple session
            String sessionId = UUID.randomUUID().toString();
            LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(DEFAULT_SESSION_DURATION);
            
            AdminSession session = new AdminSession(sessionId, admin.getAdminId(), expiresAt);
            session.setIpAddress(ipAddress);
            session.setUserAgent(userAgent);
            
            adminRepository.createSession(session);
            
            return AdminAuthResult.success(admin, session);
            
        } catch (Exception e) {
            System.err.println("Admin authentication error: " + e.getMessage());
            return AdminAuthResult.failure("Authentication failed due to system error");
        }
    }

    /**
     * Validate admin session
     */
    public Optional<AdminUser> validateSession(String sessionId) {
        Optional<AdminSession> sessionOpt = adminRepository.findSessionById(sessionId);
        if (!sessionOpt.isPresent()) {
            return Optional.empty();
        }

        AdminSession session = sessionOpt.get();
        if (!session.isValid()) {
            return Optional.empty();
        }

        Optional<AdminUser> adminOpt = adminRepository.findByAdminId(session.getAdminId());
        if (!adminOpt.isPresent() || !adminOpt.get().isActive()) {
            return Optional.empty();
        }

        return adminOpt;
    }

    /**
     * Extend session validity
     */
    public boolean extendSession(String sessionId) {
        Optional<AdminSession> sessionOpt = adminRepository.findSessionById(sessionId);
        if (!sessionOpt.isPresent()) {
            return false;
        }

        AdminSession session = sessionOpt.get();
        if (!session.isValid()) {
            return false;
        }

        // Extend session by default duration
        LocalDateTime newExpiryTime = LocalDateTime.now().plusMinutes(DEFAULT_SESSION_DURATION);
        adminRepository.extendSession(sessionId, newExpiryTime);
        
        return true;
    }

    /**
     * Logout admin
     */
    public void logout(String sessionId) {
        adminRepository.deactivateSession(sessionId);
    }

    /**
     * Logout all sessions for admin
     */
    public void logoutAll(String adminId) {
        adminRepository.deactivateAllUserSessions(adminId);
    }

    /**
     * Get admin by ID
     */
    public Optional<AdminUser> getAdminByAdminId(String adminId) {
        return adminRepository.findByAdminId(adminId);
    }

    /**
     * Get login history
     */
    public List<Object[]> getLoginHistory(String adminId, int limit) {
        return adminRepository.getLoginHistory(adminId, limit);
    }

    /**
     * Check if admin has biometric setup
     */
    public boolean hasBiometricSetup(String adminId) {
        Optional<AdminUser> adminOpt = adminRepository.findByAdminId(adminId);
        return adminOpt.isPresent() && adminOpt.get().getHasBiometric();
    }

    /**
     * Update biometric info
     */
    public boolean updateBiometricInfo(String adminId, MultipartFile fingerprintFile) {
        try {
            // Store fingerprint data in database
            byte[] fingerprintData = fingerprintFile.getBytes();
            adminRepository.updateBiometricInfo(adminId, "template_" + adminId, fingerprintData);
            return true;
        } catch (Exception e) {
            System.err.println("Error updating biometric info: " + e.getMessage());
            return false;
        }
    }

    /**
     * Admin authentication result class
     */
    public static class AdminAuthResult {
        private final boolean success;
        private final String message;
        private final AdminUser admin;
        private final AdminSession session;

        private AdminAuthResult(boolean success, String message, AdminUser admin, AdminSession session) {
            this.success = success;
            this.message = message;
            this.admin = admin;
            this.session = session;
        }

        public static AdminAuthResult success(AdminUser admin, AdminSession session) {
            return new AdminAuthResult(true, "Authentication successful", admin, session);
        }

        public static AdminAuthResult failure(String message) {
            return new AdminAuthResult(false, message, null, null);
        }

        // Getters
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public AdminUser getAdmin() { return admin; }
        public AdminSession getSession() { return session; }
    }
}
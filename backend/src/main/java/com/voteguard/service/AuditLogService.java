package com.voteguard.service;

import com.voteguard.model.AuditLog;
import com.voteguard.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@org.springframework.transaction.annotation.Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);
    
    private final AuditLogRepository auditLogRepository;

    @Autowired
    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Log security events with comprehensive details
     */
    public void logSecurityEvent(Long userId, String action, String resource, String ipAddress, String userAgent, Map<String, Object> details) {
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setUserId(userId);
            auditLog.setAction(action);
            auditLog.setResource(resource);
            auditLog.setIpAddress(ipAddress);
            auditLog.setUserAgent(userAgent);
            auditLog.setDetails(details);
            auditLog.setTimestamp(java.time.LocalDateTime.now());

            auditLogRepository.save(auditLog);
            log.debug("Audit log saved: action={}, userId={}", action, userId);
        } catch (Exception e) {
            log.error("Failed to save audit log: {}", e.getMessage());
        }
    }

    /**
     * Log biometric actions
     */
    public void logBiometricAction(Long userId, String action, String resource, String ipAddress, String userAgent, Map<String, Object> details) {
        logSecurityEvent(userId, action, resource, ipAddress, userAgent, details);
    }

    /**
     * Log voting actions
     */
    public void logVotingAction(Long userId, String action, String resource, String ipAddress, String userAgent, Map<String, Object> details) {
        logSecurityEvent(userId, action, resource, ipAddress, userAgent, details);
    }

    /**
     * Log station management actions
     */
    public void logStationAction(Long userId, String action, String resource, String ipAddress, String userAgent, Map<String, Object> details) {
        logSecurityEvent(userId, action, resource, ipAddress, userAgent, details);
    }
}





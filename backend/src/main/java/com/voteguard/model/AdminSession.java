package com.voteguard.model;

import java.time.LocalDateTime;

public class AdminSession {
    private Long id;
    private String sessionId;
    private String adminId;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private String ipAddress;
    private String userAgent;
    private Boolean isActive;
    private LocalDateTime lastActivity;

    // Constructors
    public AdminSession() {}

    public AdminSession(String sessionId, String adminId, LocalDateTime expiresAt) {
        this.sessionId = sessionId;
        this.adminId = adminId;
        this.expiresAt = expiresAt;
        this.createdAt = LocalDateTime.now();
        this.isActive = true;
        this.lastActivity = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getAdminId() {
        return adminId;
    }

    public void setAdminId(String adminId) {
        this.adminId = adminId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getLastActivity() {
        return lastActivity;
    }

    public void setLastActivity(LocalDateTime lastActivity) {
        this.lastActivity = lastActivity;
    }

    // Business methods
    public boolean isExpired() {
        return expiresAt != null && expiresAt.isBefore(LocalDateTime.now());
    }

    public boolean isValid() {
        return isActive != null && isActive && !isExpired();
    }

    public void updateActivity() {
        this.lastActivity = LocalDateTime.now();
    }

    public void deactivate() {
        this.isActive = false;
        this.lastActivity = LocalDateTime.now();
    }

    public void extendExpiry(int minutesToAdd) {
        if (expiresAt != null) {
            this.expiresAt = expiresAt.plusMinutes(minutesToAdd);
        }
    }

    @Override
    public String toString() {
        return "AdminSession{" +
                "id=" + id +
                ", sessionId='" + sessionId + '\'' +
                ", adminId='" + adminId + '\'' +
                ", expiresAt=" + expiresAt +
                ", isActive=" + isActive +
                '}';
    }
}
package com.voteguard.model;

import java.time.LocalDateTime;

public class AdminUser {
    private Long id;
    private String adminId;
    private String username;
    private String email;
    private String role;
    private String status;
    private LocalDateTime createdDate;
    private LocalDateTime lastLogin;
    private Integer loginAttempts;
    private LocalDateTime accountLockedUntil;
    private Boolean hasBiometric;
    private LocalDateTime biometricEnrolledDate;
    private String fingerprintTemplateId;

    // Constructors
    public AdminUser() {}

    public AdminUser(String adminId, String username, String email, String role) {
        this.adminId = adminId;
        this.username = username;
        this.email = email;
        this.role = role;
        this.status = "ACTIVE";
        this.createdDate = LocalDateTime.now();
        this.loginAttempts = 0;
        this.hasBiometric = false;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAdminId() {
        return adminId;
    }

    public void setAdminId(String adminId) {
        this.adminId = adminId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDateTime createdDate) {
        this.createdDate = createdDate;
    }

    public LocalDateTime getLastLogin() {
        return lastLogin;
    }

    public void setLastLogin(LocalDateTime lastLogin) {
        this.lastLogin = lastLogin;
    }

    public Integer getLoginAttempts() {
        return loginAttempts;
    }

    public void setLoginAttempts(Integer loginAttempts) {
        this.loginAttempts = loginAttempts;
    }

    public LocalDateTime getAccountLockedUntil() {
        return accountLockedUntil;
    }

    public void setAccountLockedUntil(LocalDateTime accountLockedUntil) {
        this.accountLockedUntil = accountLockedUntil;
    }

    public Boolean getHasBiometric() {
        return hasBiometric;
    }

    public void setHasBiometric(Boolean hasBiometric) {
        this.hasBiometric = hasBiometric;
    }

    public LocalDateTime getBiometricEnrolledDate() {
        return biometricEnrolledDate;
    }

    public void setBiometricEnrolledDate(LocalDateTime biometricEnrolledDate) {
        this.biometricEnrolledDate = biometricEnrolledDate;
    }

    public String getFingerprintTemplateId() {
        return fingerprintTemplateId;
    }

    public void setFingerprintTemplateId(String fingerprintTemplateId) {
        this.fingerprintTemplateId = fingerprintTemplateId;
    }

    // Business methods
    public boolean isActive() {
        return "ACTIVE".equals(this.status);
    }

    public boolean isLocked() {
        return accountLockedUntil != null && accountLockedUntil.isAfter(LocalDateTime.now());
    }

    public boolean isSuperAdmin() {
        return "SUPER_ADMIN".equals(this.role);
    }

    public boolean isAdmin() {
        return "ADMIN".equals(this.role) || "SUPER_ADMIN".equals(this.role);
    }

    public void incrementLoginAttempts() {
        if (this.loginAttempts == null) {
            this.loginAttempts = 1;
        } else {
            this.loginAttempts = this.loginAttempts.intValue() + 1;
        }
    }

    public void resetLoginAttempts() {
        this.loginAttempts = 0;
        this.accountLockedUntil = null;
    }

    public void lockAccount(int lockDurationMinutes) {
        this.accountLockedUntil = LocalDateTime.now().plusMinutes(lockDurationMinutes);
    }

    @Override
    public String toString() {
        return "AdminUser{" +
                "id=" + id +
                ", adminId='" + adminId + '\'' +
                ", username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", role='" + role + '\'' +
                ", status='" + status + '\'' +
                ", hasBiometric=" + hasBiometric +
                '}';
    }
}
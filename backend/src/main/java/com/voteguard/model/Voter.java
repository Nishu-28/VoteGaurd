package com.voteguard.model;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public class Voter implements UserDetails {
    
    private Long id;
    private String voterId;
    private String fullName;
    private String email;
    private String fingerprintHash;
    private String extraField; // DOB, dept, etc. for secondary validation
    private Boolean hasVoted = false;
    private Boolean isActive = true;
    private Role role = Role.VOTER;
    private List<String> eligibleElections; // List of election IDs this voter can participate in
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructors
    public Voter() {}

    public Voter(Long id, String voterId, String fullName, String email, String fingerprintHash, 
                 String extraField, Boolean hasVoted, Boolean isActive, Role role, 
                 LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.voterId = voterId;
        this.fullName = fullName;
        this.email = email;
        this.fingerprintHash = fingerprintHash;
        this.extraField = extraField;
        this.hasVoted = hasVoted != null ? hasVoted : false;
        this.isActive = isActive != null ? isActive : true;
        this.role = role != null ? role : Role.VOTER;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getVoterId() { return voterId; }
    public void setVoterId(String voterId) { this.voterId = voterId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFingerprintHash() { return fingerprintHash; }
    public void setFingerprintHash(String fingerprintHash) { this.fingerprintHash = fingerprintHash; }

    public String getExtraField() { return extraField; }
    public void setExtraField(String extraField) { this.extraField = extraField; }

    public Boolean getHasVoted() { return hasVoted; }
    public void setHasVoted(Boolean hasVoted) { this.hasVoted = hasVoted; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Builder pattern
    public static VoterBuilder builder() {
        return new VoterBuilder();
    }

    public static class VoterBuilder {
        private Long id;
        private String voterId;
        private String fullName;
        private String email;
        private String fingerprintHash;
        private String extraField;
        private Boolean hasVoted = false;
        private Boolean isActive = true;
        private Role role = Role.VOTER;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public VoterBuilder id(Long id) { this.id = id; return this; }
        public VoterBuilder voterId(String voterId) { this.voterId = voterId; return this; }
        public VoterBuilder fullName(String fullName) { this.fullName = fullName; return this; }
        public VoterBuilder email(String email) { this.email = email; return this; }
        public VoterBuilder fingerprintHash(String fingerprintHash) { this.fingerprintHash = fingerprintHash; return this; }
        public VoterBuilder extraField(String extraField) { this.extraField = extraField; return this; }
        public VoterBuilder hasVoted(Boolean hasVoted) { this.hasVoted = hasVoted; return this; }
        public VoterBuilder isActive(Boolean isActive) { this.isActive = isActive; return this; }
        public VoterBuilder role(Role role) { this.role = role; return this; }
        public VoterBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public VoterBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public Voter build() {
            return new Voter(id, voterId, fullName, email, fingerprintHash, extraField, 
                           hasVoted, isActive, role, createdAt, updatedAt);
        }
    }
    
    // UserDetails implementation
    @Override
    public String getUsername() {
        return voterId; // Use voterId as username for Spring Security
    }
    
    @Override
    public String getPassword() {
        return null; // No password in center-based system
    }
    
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
    }
    
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }
    
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }
    
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
    
    @Override
    public boolean isEnabled() {
        return isActive != null ? isActive : true;
    }
    
    public enum Role {
        VOTER, ADMIN
    }
}



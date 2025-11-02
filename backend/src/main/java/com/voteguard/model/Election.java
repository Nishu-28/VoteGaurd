package com.voteguard.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import java.util.List;

public class Election {
    
    private Long id;
    
    @NotBlank(message = "Election name is required")
    @Size(max = 200, message = "Election name must not exceed 200 characters")
    private String name;
    
    @Size(min = 6, max = 6, message = "Election code must be exactly 6 characters")
    private String electionCode; // Auto-generated 6-digit code
    
    private String electionOtp; // Time-based OTP for center setup (changes every 2 minutes)
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime otpExpiresAt; // OTP expiration timestamp
    
    private String activeCenterLocation; // Currently active voting center location
    
    private String description;
    
    @NotNull(message = "Start date is required")
    private LocalDateTime startDate;
    
    @NotNull(message = "End date is required")
    private LocalDateTime endDate;
    
    private ElectionStatus status = ElectionStatus.UPCOMING;
    
    private Boolean isActive = true;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // Relationships (not managed by database, but for object relationships)
    private List<Candidate> candidates;
    private List<Vote> votes;
    
    // Constructors
    public Election() {}
    
    public Election(String name, String description, LocalDateTime startDate, LocalDateTime endDate) {
        this.name = name;
        this.description = description;
        this.startDate = startDate;
        this.endDate = endDate;
    }
    
    // Custom validation
    public boolean isValidDateRange() {
        if (startDate == null || endDate == null) {
            return true; // Let @NotNull handle null validation
        }
        return endDate.isAfter(startDate);
    }
    
    // Business methods
    public boolean isOngoing() {
        LocalDateTime now = LocalDateTime.now();
        return status == ElectionStatus.ACTIVE && 
               now.isAfter(startDate) && 
               now.isBefore(endDate);
    }
    
    public boolean isUpcoming() {
        LocalDateTime now = LocalDateTime.now();
        return status == ElectionStatus.UPCOMING && 
               now.isBefore(startDate);
    }
    
    public boolean isCompleted() {
        LocalDateTime now = LocalDateTime.now();
        return status == ElectionStatus.COMPLETED || 
               now.isAfter(endDate);
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getElectionCode() { return electionCode; }
    public void setElectionCode(String electionCode) { this.electionCode = electionCode; }
    
    public String getElectionOtp() { return electionOtp; }
    public void setElectionOtp(String electionOtp) { this.electionOtp = electionOtp; }
    
    public LocalDateTime getOtpExpiresAt() { return otpExpiresAt; }
    public void setOtpExpiresAt(LocalDateTime otpExpiresAt) { this.otpExpiresAt = otpExpiresAt; }
    
    public String getActiveCenterLocation() { return activeCenterLocation; }
    public void setActiveCenterLocation(String activeCenterLocation) { this.activeCenterLocation = activeCenterLocation; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }
    
    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }
    
    public ElectionStatus getStatus() { return status; }
    public void setStatus(ElectionStatus status) { this.status = status; }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public List<Candidate> getCandidates() { return candidates; }
    public void setCandidates(List<Candidate> candidates) { this.candidates = candidates; }
    
    public List<Vote> getVotes() { return votes; }
    public void setVotes(List<Vote> votes) { this.votes = votes; }
    
    @Override
    public String toString() {
        return "Election{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", startDate=" + startDate +
                ", endDate=" + endDate +
                ", status=" + status +
                ", isActive=" + isActive +
                '}';
    }
    
    // Builder pattern
    public static ElectionBuilder builder() {
        return new ElectionBuilder();
    }
    
    public static class ElectionBuilder {
        private Long id;
        private String name;
        private String electionCode;
        private String electionOtp;
        private LocalDateTime otpExpiresAt;
        private String activeCenterLocation;
        private String description;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private ElectionStatus status = ElectionStatus.UPCOMING;
        private Boolean isActive = true;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        
        public ElectionBuilder id(Long id) { this.id = id; return this; }
        public ElectionBuilder name(String name) { this.name = name; return this; }
        public ElectionBuilder electionCode(String electionCode) { this.electionCode = electionCode; return this; }
        public ElectionBuilder electionOtp(String electionOtp) { this.electionOtp = electionOtp; return this; }
        public ElectionBuilder otpExpiresAt(LocalDateTime otpExpiresAt) { this.otpExpiresAt = otpExpiresAt; return this; }
        public ElectionBuilder activeCenterLocation(String activeCenterLocation) { this.activeCenterLocation = activeCenterLocation; return this; }
        public ElectionBuilder description(String description) { this.description = description; return this; }
        public ElectionBuilder startDate(LocalDateTime startDate) { this.startDate = startDate; return this; }
        public ElectionBuilder endDate(LocalDateTime endDate) { this.endDate = endDate; return this; }
        public ElectionBuilder status(ElectionStatus status) { this.status = status; return this; }
        public ElectionBuilder isActive(Boolean isActive) { this.isActive = isActive; return this; }
        public ElectionBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public ElectionBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        
        public Election build() {
            Election election = new Election();
            election.setId(id);
            election.setName(name);
            election.setElectionCode(electionCode);
            election.setElectionOtp(electionOtp);
            election.setOtpExpiresAt(otpExpiresAt);
            election.setActiveCenterLocation(activeCenterLocation);
            election.setDescription(description);
            election.setStartDate(startDate);
            election.setEndDate(endDate);
            election.setStatus(status);
            election.setIsActive(isActive);
            election.setCreatedAt(createdAt);
            election.setUpdatedAt(updatedAt);
            return election;
        }
    }
}
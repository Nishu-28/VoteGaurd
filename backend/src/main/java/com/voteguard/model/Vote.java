package com.voteguard.model;

import java.time.LocalDateTime;

public class Vote {
    
    private Long id;
    private Voter voter;
    private String voterName;
    private Candidate candidate;
    private String stationCode; // Optional - kept for backward compatibility
    private String centerLocation; // Center where vote was cast
    private LocalDateTime timestamp;
    private String ipAddress;
    private String userAgent;
    private Boolean fingerprintVerified = false;
    
    // Election relationship
    private Long electionId;
    private Election election;

    // Default constructor
    public Vote() {
    }

    // All args constructor
    public Vote(Long id, Voter voter, String voterName, Candidate candidate, String stationCode, String centerLocation,
                LocalDateTime timestamp, String ipAddress, String userAgent, Boolean fingerprintVerified,
                Long electionId, Election election) {
        this.id = id;
        this.voter = voter;
        this.voterName = voterName;
        this.candidate = candidate;
        this.stationCode = stationCode;
        this.centerLocation = centerLocation;
        this.timestamp = timestamp;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.fingerprintVerified = fingerprintVerified != null ? fingerprintVerified : false;
        this.electionId = electionId;
        this.election = election;
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Voter getVoter() {
        return voter;
    }

    public void setVoter(Voter voter) {
        this.voter = voter;
    }

    public String getVoterName() {
        return voterName;
    }

    public void setVoterName(String voterName) {
        this.voterName = voterName;
    }

    public Candidate getCandidate() {
        return candidate;
    }

    public void setCandidate(Candidate candidate) {
        this.candidate = candidate;
    }

    public String getStationCode() {
        return stationCode;
    }

    public void setStationCode(String stationCode) {
        this.stationCode = stationCode;
    }
    
    public String getCenterLocation() {
        return centerLocation;
    }

    public void setCenterLocation(String centerLocation) {
        this.centerLocation = centerLocation;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
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

    public Boolean getFingerprintVerified() {
        return fingerprintVerified;
    }

    public void setFingerprintVerified(Boolean fingerprintVerified) {
        this.fingerprintVerified = fingerprintVerified;
    }

    public Long getElectionId() {
        return electionId;
    }

    public void setElectionId(Long electionId) {
        this.electionId = electionId;
    }

    public Election getElection() {
        return election;
    }

    public void setElection(Election election) {
        this.election = election;
    }

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private Voter voter;
        private String voterName;
        private Candidate candidate;
        private String stationCode;
        private String centerLocation;
        private LocalDateTime timestamp;
        private String ipAddress;
        private String userAgent;
        private Boolean fingerprintVerified = false;
        private Long electionId;
        private Election election;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder voter(Voter voter) {
            this.voter = voter;
            return this;
        }

        public Builder voterName(String voterName) {
            this.voterName = voterName;
            return this;
        }

        public Builder candidate(Candidate candidate) {
            this.candidate = candidate;
            return this;
        }

        public Builder stationCode(String stationCode) {
            this.stationCode = stationCode;
            return this;
        }
        
        public Builder centerLocation(String centerLocation) {
            this.centerLocation = centerLocation;
            return this;
        }

        public Builder timestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public Builder ipAddress(String ipAddress) {
            this.ipAddress = ipAddress;
            return this;
        }

        public Builder userAgent(String userAgent) {
            this.userAgent = userAgent;
            return this;
        }

        public Builder fingerprintVerified(Boolean fingerprintVerified) {
            this.fingerprintVerified = fingerprintVerified;
            return this;
        }

        public Builder electionId(Long electionId) {
            this.electionId = electionId;
            return this;
        }

        public Builder election(Election election) {
            this.election = election;
            return this;
        }

        public Vote build() {
            return new Vote(id, voter, voterName, candidate, stationCode, centerLocation, timestamp, ipAddress, userAgent, fingerprintVerified, electionId, election);
        }
    }
}


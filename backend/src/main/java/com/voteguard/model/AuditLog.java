package com.voteguard.model;

import java.time.LocalDateTime;
import java.util.Map;

public class AuditLog {
    
    private Long id;
    private Long userId;
    private String action;
    private String resource;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime timestamp;
    private Map<String, Object> details;

    // Constructors
    public AuditLog() {}

    public AuditLog(Long id, Long userId, String action, String resource, String ipAddress, 
                   String userAgent, LocalDateTime timestamp, Map<String, Object> details) {
        this.id = id;
        this.userId = userId;
        this.action = action;
        this.resource = resource;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.timestamp = timestamp;
        this.details = details;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getResource() { return resource; }
    public void setResource(String resource) { this.resource = resource; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public Map<String, Object> getDetails() { return details; }
    public void setDetails(Map<String, Object> details) { this.details = details; }
}



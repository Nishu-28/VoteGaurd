package com.voteguard.controller;

import com.voteguard.model.VotingStation;
import com.voteguard.service.AuditLogService;
import com.voteguard.service.VotingStationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/stations")
@RequiredArgsConstructor
@Slf4j
public class VotingStationController {

    private final VotingStationService votingStationService;
    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<List<VotingStation>> getAllStations() {
        try {
            List<VotingStation> stations = votingStationService.getAllStations();
            return ResponseEntity.ok(stations);
        } catch (Exception e) {
            log.error("Failed to get stations: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/unlocked")
    public ResponseEntity<List<VotingStation>> getUnlockedStations() {
        try {
            List<VotingStation> stations = votingStationService.getUnlockedStations();
            return ResponseEntity.ok(stations);
        } catch (Exception e) {
            log.error("Failed to get unlocked stations: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VotingStation> createStation(@RequestBody VotingStation station, HttpServletRequest request) {
        try {
            VotingStation createdStation = votingStationService.createStation(station);
            
            String ipAddress = getClientIpAddress(request);
            String userAgent = request.getHeader("User-Agent");
            auditLogService.logStationAction(null, "STATION_CREATED", "STATION", ipAddress, userAgent, 
                Map.of("station_code", station.getStationCode(), "location", station.getLocation()));
            
            return ResponseEntity.ok(createdStation);
        } catch (Exception e) {
            log.error("Failed to create station: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{stationCode}/lock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> lockStation(@PathVariable String stationCode, HttpServletRequest request) {
        try {
            votingStationService.lockStation(stationCode);
            
            String ipAddress = getClientIpAddress(request);
            String userAgent = request.getHeader("User-Agent");
            auditLogService.logStationAction(null, "STATION_LOCKED", "STATION", ipAddress, userAgent, 
                Map.of("station_code", stationCode));
            
            return ResponseEntity.ok(Map.of("message", "Station locked successfully", "stationCode", stationCode));
        } catch (Exception e) {
            log.error("Failed to lock station {}: {}", stationCode, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{stationCode}/unlock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> unlockStation(@PathVariable String stationCode, HttpServletRequest request) {
        try {
            votingStationService.unlockStation(stationCode);
            
            String ipAddress = getClientIpAddress(request);
            String userAgent = request.getHeader("User-Agent");
            auditLogService.logStationAction(null, "STATION_UNLOCKED", "STATION", ipAddress, userAgent, 
                Map.of("station_code", stationCode));
            
            return ResponseEntity.ok(Map.of("message", "Station unlocked successfully", "stationCode", stationCode));
        } catch (Exception e) {
            log.error("Failed to unlock station {}: {}", stationCode, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{stationCode}")
    public ResponseEntity<VotingStation> getStation(@PathVariable String stationCode) {
        try {
            VotingStation station = votingStationService.getStationByCode(stationCode);
            return ResponseEntity.ok(station);
        } catch (Exception e) {
            log.error("Failed to get station {}: {}", stationCode, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

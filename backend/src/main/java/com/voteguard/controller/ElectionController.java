package com.voteguard.controller;

import com.voteguard.model.Election;
import com.voteguard.model.ElectionStatus;
import com.voteguard.service.ElectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/elections")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class ElectionController {

    private final ElectionService electionService;

    @GetMapping
    public ResponseEntity<List<Election>> getAllElections() {
        List<Election> elections = electionService.findAll();
        return ResponseEntity.ok(elections);
    }

    @GetMapping("/active")
    public ResponseEntity<List<Election>> getActiveElections() {
        List<Election> elections = electionService.findActiveElections();
        return ResponseEntity.ok(elections);
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<Election>> getUpcomingElections() {
        List<Election> elections = electionService.findUpcomingElections();
        return ResponseEntity.ok(elections);
    }

    @GetMapping("/ongoing")
    public ResponseEntity<List<Election>> getOngoingElections() {
        List<Election> elections = electionService.findOngoingElections();
        return ResponseEntity.ok(elections);
    }

    @GetMapping("/completed")
    public ResponseEntity<List<Election>> getCompletedElections() {
        List<Election> elections = electionService.findCompletedElections();
        return ResponseEntity.ok(elections);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Election> getElectionById(@PathVariable Long id) {
        Optional<Election> election = electionService.findById(id);
        return election.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Election> createElection(@RequestBody Election election) {
        Election savedElection = electionService.save(election);
        return ResponseEntity.ok(savedElection);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Election> updateElection(@PathVariable Long id, @RequestBody Election election) {
        election.setId(id);
        Election updatedElection = electionService.save(election);
        return ResponseEntity.ok(updatedElection);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Election> updateElectionStatus(@PathVariable Long id, @RequestParam ElectionStatus status) {
        try {
            Election updatedElection = electionService.updateElectionStatus(id, status);
            return ResponseEntity.ok(updatedElection);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteElection(@PathVariable Long id) {
        electionService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<Election> deactivateElection(@PathVariable Long id) {
        try {
            Election deactivatedElection = electionService.deactivateElection(id);
            return ResponseEntity.ok(deactivatedElection);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<Election>> searchElections(@RequestParam String query) {
        List<Election> elections = electionService.searchElectionsByName(query);
        return ResponseEntity.ok(elections);
    }

    @GetMapping("/count")
    public ResponseEntity<Long> countActiveElections() {
        long count = electionService.countActiveElections();
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/code/{electionCode}")
    public ResponseEntity<?> getElectionByCode(@PathVariable String electionCode) {
        Optional<Election> election = electionService.findByElectionCode(electionCode);
        if (election.isPresent()) {
            return ResponseEntity.ok(election.get());
        }
        return ResponseEntity.notFound().build();
    }
    
    @PostMapping("/validate-code")
    public ResponseEntity<?> validateElectionCode(@RequestBody java.util.Map<String, String> request) {
        String electionCode = request.get("electionCode");
        
        if (electionCode == null || electionCode.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                "valid", false,
                "message", "Election code is required"
            ));
        }
        
        boolean isValid = electionService.validateElectionCode(electionCode);
        
        if (isValid) {
            Optional<Election> election = electionService.findActiveElectionByCode(electionCode);
            return ResponseEntity.ok(java.util.Map.of(
                "valid", true,
                "message", "Election code is valid",
                "election", election.get()
            ));
        } else {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                "valid", false,
                "message", "Invalid or expired election code"
            ));
        }
    }
    
    @PostMapping("/{id}/generate-otp")
    public ResponseEntity<?> generateOtp(@PathVariable Long id) {
        try {
            String otp = electionService.generateOtpForElection(id);
            Optional<Election> election = electionService.findById(id);
            Election electionObj = election.get();
            
            // Format expiresAt as ISO-8601 string for consistent frontend parsing
            String expiresAtStr = electionObj.getOtpExpiresAt() != null 
                ? electionObj.getOtpExpiresAt().toString() 
                : null;
            
            return ResponseEntity.ok(java.util.Map.of(
                "success", true,
                "otp", otp,
                "expiresAt", expiresAtStr != null ? expiresAtStr : "",
                "message", "OTP generated successfully. Valid for 2 minutes."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/setup-center")
    public ResponseEntity<?> setupCenter(@RequestBody java.util.Map<String, Object> request) {
        try {
            // Get parameters from request with null checks
            Object electionCodeObj = request.get("electionCode");
            Object otpObj = request.get("otp");
            Object centerLocationObj = request.get("centerLocation");
            
            if (electionCodeObj == null) {
                return ResponseEntity.badRequest().body(java.util.Map.of(
                    "success", false,
                    "message", "electionCode is required"
                ));
            }
            
            if (otpObj == null) {
                return ResponseEntity.badRequest().body(java.util.Map.of(
                    "success", false,
                    "message", "otp is required"
                ));
            }
            
            if (centerLocationObj == null) {
                return ResponseEntity.badRequest().body(java.util.Map.of(
                    "success", false,
                    "message", "centerLocation is required"
                ));
            }
            
            String electionCode = electionCodeObj.toString().toUpperCase().trim();
            String otp = otpObj.toString().trim();
            String centerLocation = centerLocationObj.toString().trim();
            
            // Validate election code format
            if (electionCode.length() != 6) {
                return ResponseEntity.badRequest().body(java.util.Map.of(
                    "success", false,
                    "message", "Election code must be exactly 6 characters"
                ));
            }
            
            // Find election by code
            Optional<Election> electionOpt = electionService.findByElectionCode(electionCode);
            if (electionOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(java.util.Map.of(
                    "success", false,
                    "message", "Invalid election code"
                ));
            }
            
            Election election = electionOpt.get();
            Long electionId = election.getId();
            
            // Validate and setup center
            electionService.setupElectionCenter(electionId, otp, centerLocation);
            
            return ResponseEntity.ok(java.util.Map.of(
                "success", true,
                "message", "Election center setup successfully",
                "electionId", electionId,
                "electionCode", electionCode,
                "centerLocation", centerLocation
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                "success", false,
                "message", "Failed to setup center: " + e.getMessage()
            ));
        }
    }
}
package com.voteguard.controller;

import com.voteguard.model.Voter;
import com.voteguard.repository.VoterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/voters")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
@RequiredArgsConstructor
public class AdminVoterController {

    private final VoterRepository voterRepository;

    @GetMapping
    public ResponseEntity<List<Voter>> getAllVoters() {
        List<Voter> voters = voterRepository.findAll();
        return ResponseEntity.ok(voters);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Voter> getVoterById(@PathVariable Long id) {
        Optional<Voter> voter = voterRepository.findById(id);
        return voter.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Voter> updateVoter(@PathVariable Long id, @RequestBody Voter voterUpdate) {
        Optional<Voter> optionalVoter = voterRepository.findById(id);
        if (optionalVoter.isPresent()) {
            Voter existingVoter = optionalVoter.get();
            
            // Update voter details using builder pattern
            Voter updatedVoter = Voter.builder()
                    .id(id)
                    .voterId(voterUpdate.getVoterId() != null ? voterUpdate.getVoterId() : existingVoter.getVoterId())
                    .fullName(voterUpdate.getFullName() != null ? voterUpdate.getFullName() : existingVoter.getFullName())
                    .email(voterUpdate.getEmail() != null ? voterUpdate.getEmail() : existingVoter.getEmail())
                    .fingerprintHash(voterUpdate.getFingerprintHash() != null ? voterUpdate.getFingerprintHash() : existingVoter.getFingerprintHash())
                    .extraField(voterUpdate.getExtraField() != null ? voterUpdate.getExtraField() : existingVoter.getExtraField())
                    .hasVoted(voterUpdate.getHasVoted() != null ? voterUpdate.getHasVoted() : existingVoter.getHasVoted())
                    .isActive(voterUpdate.getIsActive() != null ? voterUpdate.getIsActive() : existingVoter.getIsActive())
                    .role(voterUpdate.getRole() != null ? voterUpdate.getRole() : existingVoter.getRole())
                    .eligibleElections(voterUpdate.getEligibleElections() != null ? voterUpdate.getEligibleElections() : existingVoter.getEligibleElections())
                    .createdAt(existingVoter.getCreatedAt())
                    .updatedAt(LocalDateTime.now())
                    .build();
            
            Voter savedVoter = voterRepository.save(updatedVoter);
            return ResponseEntity.ok(savedVoter);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVoter(@PathVariable Long id) {
        voterRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<Voter> deactivateVoter(@PathVariable Long id) {
        Optional<Voter> optionalVoter = voterRepository.findById(id);
        if (optionalVoter.isPresent()) {
            Voter existingVoter = optionalVoter.get();
            
            Voter deactivatedVoter = Voter.builder()
                    .id(existingVoter.getId())
                    .voterId(existingVoter.getVoterId())
                    .fullName(existingVoter.getFullName())
                    .email(existingVoter.getEmail())
                    .fingerprintHash(existingVoter.getFingerprintHash())
                    .extraField(existingVoter.getExtraField())
                    .hasVoted(existingVoter.getHasVoted())
                    .isActive(false)
                    .role(existingVoter.getRole())
                    .createdAt(existingVoter.getCreatedAt())
                    .updatedAt(LocalDateTime.now())
                    .build();
            
            Voter savedVoter = voterRepository.save(deactivatedVoter);
            return ResponseEntity.ok(savedVoter);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/count")
    public ResponseEntity<Long> countActiveVoters() {
        long count = voterRepository.countActiveVoters();
        return ResponseEntity.ok(count);
    }

    @GetMapping("/voted-count")
    public ResponseEntity<Long> countVotersWhoVoted() {
        long count = voterRepository.countVotersWhoHaveVoted();
        return ResponseEntity.ok(count);
    }
}

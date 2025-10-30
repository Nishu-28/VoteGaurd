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
}
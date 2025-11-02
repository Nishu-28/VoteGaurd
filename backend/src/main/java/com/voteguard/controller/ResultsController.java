package com.voteguard.controller;

import com.voteguard.service.VoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/results")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
@RequiredArgsConstructor
public class ResultsController {

    private final VoteService voteService;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getVotingResults() {
        try {
            Map<String, Object> results = voteService.getVotingResults();
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping() {
        return ResponseEntity.ok(Map.of("message", "Results service is running"));
    }
}



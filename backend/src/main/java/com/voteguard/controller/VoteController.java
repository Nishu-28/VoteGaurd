package com.voteguard.controller;

import com.voteguard.model.Candidate;
import com.voteguard.model.Vote;
import com.voteguard.service.VoteService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/vote")
public class VoteController {

    private final VoteService voteService;

    public VoteController(VoteService voteService) {
        this.voteService = voteService;
    }

    @PostMapping("/cast")
    public ResponseEntity<Map<String, Object>> castVote(
            @RequestParam("candidateId") Long candidateId,
            @RequestParam("voterId") String voterId,
            @RequestParam("stationCode") String stationCode,
            Authentication authentication,
            HttpServletRequest request) {

        try {
            String ipAddress = getClientIpAddress(request);
            String userAgent = request.getHeader("User-Agent");

            Vote vote = voteService.castVote(voterId, candidateId, stationCode, ipAddress, userAgent);

            return ResponseEntity.ok(Map.of(
                "message", "Vote cast successfully",
                "voteId", vote.getId(),
                "timestamp", vote.getTimestamp(),
                "stationCode", stationCode
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/candidates")
    public ResponseEntity<List<Candidate>> getActiveCandidates() {
        try {
            List<Candidate> candidates = voteService.getActiveCandidates();
            return ResponseEntity.ok(candidates);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/status/{voterId}")
    public ResponseEntity<Map<String, Object>> getVotingStatus(@PathVariable Long voterId) {
        try {
            boolean hasVoted = voteService.hasVoterVoted(voterId);
            return ResponseEntity.ok(Map.of("hasVoted", hasVoted));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
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



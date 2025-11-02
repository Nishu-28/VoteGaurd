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
@RequestMapping("/api/vote")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class VoteController {

    private final VoteService voteService;

    public VoteController(VoteService voteService) {
        this.voteService = voteService;
    }

    @PostMapping("/cast")
    public ResponseEntity<Map<String, Object>> castVote(
            @RequestParam("candidateId") Long candidateId,
            @RequestParam("voterId") String voterId,
            @RequestParam(value = "electionId", required = false) Long electionId,
            Authentication authentication,
            HttpServletRequest request) {

        try {
            String ipAddress = getClientIpAddress(request);
            String userAgent = request.getHeader("User-Agent");
            
            System.out.println("VoteController: Attempting to cast vote - voterId=" + voterId + ", candidateId=" + candidateId + ", electionId=" + electionId);

            Vote vote = voteService.castVote(voterId, candidateId, electionId, ipAddress, userAgent);

            return ResponseEntity.ok(Map.of(
                "message", "Vote cast successfully",
                "voteId", vote.getId(),
                "timestamp", vote.getTimestamp(),
                "centerLocation", vote.getCenterLocation() != null ? vote.getCenterLocation() : "N/A"
            ));
        } catch (Exception e) {
            System.err.println("VoteController: Error casting vote: " + e.getMessage());
            e.printStackTrace();
            String errorMessage = e.getMessage();
            if (errorMessage == null || errorMessage.isEmpty()) {
                errorMessage = "Unknown error occurred while casting vote. Check backend logs for details.";
            }
            return ResponseEntity.badRequest().body(Map.of("error", errorMessage));
        }
    }

    @GetMapping("/candidates")
    public ResponseEntity<List<Candidate>> getActiveCandidates(
            @RequestParam(value = "electionId", required = false) Long electionId) {
        try {
            List<Candidate> candidates;
            if (electionId != null) {
                candidates = voteService.getActiveCandidatesByElection(electionId);
            } else {
                candidates = voteService.getActiveCandidates();
            }
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

    @GetMapping("/verify/{voteId}")
    public ResponseEntity<Map<String, Object>> verifyVote(@PathVariable Long voteId) {
        try {
            Map<String, Object> result = voteService.verifyVoteExists(voteId);
            return ResponseEntity.ok(result);
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



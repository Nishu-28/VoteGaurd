package com.voteguard.service;

import com.voteguard.model.Candidate;
import com.voteguard.model.Vote;
import com.voteguard.model.Voter;
import com.voteguard.repository.CandidateRepository;
import com.voteguard.repository.VoteRepository;
import com.voteguard.repository.VoterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class VoteService {

    private final VoteRepository voteRepository;
    private final VoterRepository voterRepository;
    private final CandidateRepository candidateRepository;
    private final VotingStationService votingStationService;
    private final AuditLogService auditLogService;

    @Transactional
    public Vote castVote(String voterId, Long candidateId, String stationCode, String ipAddress, String userAgent) {
        // Check if voter exists and hasn't voted
        Voter voter = voterRepository.findByVoterId(voterId)
            .orElseThrow(() -> new RuntimeException("Voter not found"));
        
        if (voter.getHasVoted()) {
            throw new RuntimeException("Voter has already voted");
        }

        // Check if candidate exists and is active
        Candidate candidate = candidateRepository.findById(candidateId)
            .orElseThrow(() -> new RuntimeException("Candidate not found"));
        
        if (!candidate.getIsActive()) {
            throw new RuntimeException("Candidate is not active");
        }

        // Check if station is unlocked
        if (!votingStationService.isStationUnlocked(stationCode)) {
            throw new RuntimeException("Voting station is locked");
        }

        // Create vote (fingerprint verification is mandatory and done during login)
        Vote vote = Vote.builder()
            .voter(voter)
            .voterName(voter.getFullName())
            .candidate(candidate)
            .stationCode(stationCode)
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .fingerprintVerified(true) // Always true as fingerprint is verified during login
            .build();

        // Save vote
        Vote savedVote = voteRepository.save(vote);

        // Mark voter as having voted
        voter.setHasVoted(true);
        voterRepository.save(voter);

        // Log the vote
        auditLogService.logVotingAction(voter.getId(), "VOTE_CAST", "VOTE", ipAddress, userAgent, 
            Map.of("candidate_id", candidateId, "station_code", stationCode, "timestamp", System.currentTimeMillis()));

        log.info("Vote cast successfully for voterId={}, candidateId={}, stationCode={}", voterId, candidateId, stationCode);

        return savedVote;
    }

    public Map<String, Object> getVotingResults() {
        List<Object[]> voteCounts = voteRepository.getVoteCountsByCandidate();
        long totalVotes = voteRepository.getTotalVoteCount();
        long totalVoters = voterRepository.countActiveVoters();
        long votersWhoVoted = voterRepository.countVotersWhoHaveVoted();

        Map<String, Object> results = new HashMap<>();
        results.put("totalVotes", totalVotes);
        results.put("totalVoters", totalVoters);
        results.put("votersWhoVoted", votersWhoVoted);
        results.put("votingPercentage", totalVoters > 0 ? (double) votersWhoVoted / totalVoters * 100 : 0);
        results.put("candidateResults", voteCounts);

        return results;
    }

    public List<Candidate> getActiveCandidates() {
        return candidateRepository.findActiveCandidatesOrderByNumber();
    }

    public boolean hasVoterVoted(Long voterId) {
        return voteRepository.existsByVoterId(voterId);
    }
}



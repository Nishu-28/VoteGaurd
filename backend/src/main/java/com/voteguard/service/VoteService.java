package com.voteguard.service;

import com.voteguard.model.Candidate;
import com.voteguard.model.Election;
import com.voteguard.model.Vote;
import com.voteguard.model.Voter;
import com.voteguard.repository.CandidateRepository;
import com.voteguard.repository.ElectionRepository;
import com.voteguard.repository.VoteRepository;
import com.voteguard.repository.VoterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionSynchronizationAdapter;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class VoteService {

    private final VoteRepository voteRepository;
    private final VoterRepository voterRepository;
    private final CandidateRepository candidateRepository;
    private final ElectionRepository electionRepository;
    private final AuditLogService auditLogService;

    @Transactional
    public Vote castVote(String voterId, Long candidateId, Long electionId, String ipAddress, String userAgent) {
        // Check if voter exists
        Voter voter = voterRepository.findByVoterId(voterId)
            .orElseThrow(() -> new RuntimeException("Voter not found"));
        
        // Check if voter has already voted in this specific election
        if (electionId != null) {
            if (voteRepository.existsByVoterIdAndElectionId(voter.getId(), electionId)) {
                throw new RuntimeException("Voter has already voted in this election");
            }
        } else {
            // For non-election-specific votes, check if voter has voted at all
            if (voteRepository.existsByVoterId(voter.getId())) {
                throw new RuntimeException("Voter has already voted");
            }
        }

        // Check if candidate exists and is active
        Candidate candidate = candidateRepository.findById(candidateId)
            .orElseThrow(() -> new RuntimeException("Candidate not found"));
        
        if (!candidate.getIsActive()) {
            throw new RuntimeException("Candidate is not active");
        }
        
        // Get election to verify and get center location
        String centerLocation = null;
        if (electionId != null) {
            Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new RuntimeException("Election not found"));
            
            // Verify candidate belongs to the election
            if (!electionId.equals(candidate.getElectionId())) {
                throw new RuntimeException("Candidate does not belong to the selected election");
            }
            
            // Get active center location from election
            centerLocation = election.getActiveCenterLocation();
            if (centerLocation == null || centerLocation.isEmpty()) {
                throw new RuntimeException("No active voting center for this election");
            }
        }

        // Verify voter is eligible for this election
        if (electionId != null) {
            try {
                log.info("Checking voter eligibility: voterId={}, electionId={}", voter.getId(), electionId);
                boolean isEligible = electionRepository.isVoterEligible(voter.getId(), electionId);
                log.info("Voter eligibility result: {}", isEligible);
                if (!isEligible) {
                    throw new RuntimeException("Voter is not eligible for this election");
                }
            } catch (RuntimeException e) {
                log.error("Error checking voter eligibility: {}", e.getMessage(), e);
                throw e;
            } catch (Exception e) {
                log.error("Unexpected error checking voter eligibility: {}", e.getMessage(), e);
                throw new RuntimeException("Error checking voter eligibility: " + e.getMessage(), e);
            }
        }

        // Create vote (fingerprint verification is mandatory and done during login)
        Vote vote = Vote.builder()
            .voter(voter)
            .voterName(voter.getFullName())
            .candidate(candidate)
            .stationCode(null) // Deprecated - always null
            .centerLocation(centerLocation)
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .fingerprintVerified(true) // Always true as fingerprint is verified during login
            .electionId(electionId)
            .build();

        // Save vote (the unique constraint on (voter_id, election_id) prevents duplicate votes)
        log.info("About to save vote: voterId={}, candidateId={}, electionId={}", voter.getId(), candidateId, electionId);
        
        Vote savedVote;
        try {
            savedVote = voteRepository.save(vote);
            log.info("Vote saved successfully with ID={}, voterId={}, candidateId={}, electionId={}", 
                savedVote.getId(), savedVote.getVoter().getId(), savedVote.getCandidate().getId(), savedVote.getElectionId());
        } catch (Exception e) {
            log.error("Failed to save vote: {}", e.getMessage(), e);
            throw e; // Re-throw to trigger transaction rollback
        }

        // Note: We don't set hasVoted=true anymore because voters can vote in multiple elections
        // The database unique constraint unique_voter_election ensures one vote per election per voter

        // Log the vote (this should not cause transaction rollback even if it fails)
        // Use @Transactional(propagation = Propagation.REQUIRES_NEW) if audit log should be in separate transaction
        try {
            auditLogService.logVotingAction(voter.getId(), "VOTE_CAST", "VOTE", ipAddress, userAgent, 
                Map.of("candidate_id", candidateId, "center_location", centerLocation != null ? centerLocation : "N/A", "timestamp", System.currentTimeMillis()));
        } catch (Exception e) {
            log.warn("Failed to log vote action to audit log (non-critical): {}", e.getMessage());
            // Don't rethrow - audit logging failure should not prevent vote from being saved
        }

        log.info("Vote cast successfully for voterId={}, candidateId={}, centerLocation={}, voteId={}", 
            voterId, candidateId, centerLocation, savedVote.getId());
        
        // Log transaction status
        boolean isTransactionActive = TransactionSynchronizationManager.isActualTransactionActive();
        boolean isCurrentTransactionReadOnly = TransactionSynchronizationManager.isCurrentTransactionReadOnly();
        String transactionName = TransactionSynchronizationManager.getCurrentTransactionName();
        log.info("Transaction status - Active: {}, ReadOnly: {}, Name: {}, VoteId: {}", 
            isTransactionActive, isCurrentTransactionReadOnly, transactionName, savedVote.getId());
        
        if (isCurrentTransactionReadOnly) {
            log.error("WARNING: Transaction is READ-ONLY! Vote will not be saved!");
            throw new RuntimeException("Transaction is read-only. Vote cannot be saved.");
        }
        
        // Register a callback to verify vote exists after transaction commits
        TransactionSynchronizationManager.registerSynchronization(
            new TransactionSynchronizationAdapter() {
                @Override
                public void afterCommit() {
                    try {
                        Optional<Vote> verifyVote = voteRepository.findById(savedVote.getId());
                        if (verifyVote.isPresent()) {
                            log.info("SUCCESS: Vote {} verified to exist in database after transaction commit", savedVote.getId());
                        } else {
                            log.error("FAILURE: Vote {} NOT FOUND in database after transaction commit! Transaction may have rolled back.", savedVote.getId());
                        }
                    } catch (Exception e) {
                        log.error("Error verifying vote after commit: {}", e.getMessage(), e);
                    }
                }
                
                @Override
                public void afterCompletion(int status) {
                    if (status == TransactionSynchronizationAdapter.STATUS_ROLLED_BACK) {
                        log.error("WARNING: Transaction was ROLLED BACK! Vote {} was not saved.", savedVote.getId());
                    } else if (status == TransactionSynchronizationAdapter.STATUS_COMMITTED) {
                        log.info("Transaction COMMITTED successfully for vote {}", savedVote.getId());
                    }
                }
            }
        );
        
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
    
    public List<Candidate> getActiveCandidatesByElection(Long electionId) {
        return candidateRepository.findByElectionIdAndIsActiveTrueOrderByCandidateNumberAsc(electionId);
    }

    public boolean hasVoterVoted(Long voterId) {
        return voteRepository.existsByVoterId(voterId);
    }
    
    public Map<String, Object> verifyVoteExists(Long voteId) {
        java.util.Map<String, Object> result = new HashMap<>();
        try {
            Optional<Vote> voteOpt = voteRepository.findById(voteId);
            if (voteOpt.isPresent()) {
                Vote vote = voteOpt.get();
                result.put("exists", true);
                result.put("voteId", vote.getId());
                result.put("voterId", vote.getVoter() != null ? vote.getVoter().getId() : null);
                result.put("candidateId", vote.getCandidate() != null ? vote.getCandidate().getId() : null);
                result.put("electionId", vote.getElectionId());
                result.put("timestamp", vote.getTimestamp());
                log.info("Vote {} verified to exist in database", voteId);
            } else {
                result.put("exists", false);
                result.put("message", "Vote not found in database");
                log.warn("Vote {} not found in database", voteId);
            }
            
            // Also check total vote count
            long totalVotes = voteRepository.getTotalVoteCount();
            result.put("totalVotesInDatabase", totalVotes);
            
            return result;
        } catch (Exception e) {
            log.error("Error verifying vote {}: {}", voteId, e.getMessage(), e);
            result.put("exists", false);
            result.put("error", e.getMessage());
            return result;
        }
    }
}



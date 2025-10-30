package com.voteguard.service;

import com.voteguard.model.Election;
import com.voteguard.model.ElectionStatus;
import com.voteguard.repository.ElectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ElectionService {

    private final ElectionRepository electionRepository;

    public Election save(Election election) {
        // Set created/updated timestamps if it's a new election
        if (election.getId() == null) {
            election.setCreatedAt(LocalDateTime.now());
        }
        election.setUpdatedAt(LocalDateTime.now());
        
        return electionRepository.save(election);
    }

    public Optional<Election> findById(Long id) {
        return electionRepository.findById(id);
    }

    public List<Election> findAll() {
        return electionRepository.findAll();
    }

    public List<Election> findActiveElections() {
        return electionRepository.findByIsActiveTrueOrderByStartDateDesc();
    }

    public List<Election> findUpcomingElections() {
        return electionRepository.findUpcomingElections(LocalDateTime.now());
    }

    public List<Election> findOngoingElections() {
        return electionRepository.findOngoingElections(LocalDateTime.now());
    }

    public List<Election> findCompletedElections() {
        return electionRepository.findCompletedElections(LocalDateTime.now());
    }

    public List<Election> findByStatus(ElectionStatus status) {
        return electionRepository.findByStatusAndIsActiveTrueOrderByStartDateDesc(status);
    }

    public boolean hasActiveElection() {
        return electionRepository.hasActiveElectionAt(LocalDateTime.now());
    }

    public Optional<Election> findByName(String name) {
        return electionRepository.findByNameIgnoreCaseAndIsActiveTrue(name);
    }

    public List<Election> searchElectionsByName(String searchTerm) {
        return electionRepository.searchElectionsByName(searchTerm);
    }

    public void deleteById(Long id) {
        electionRepository.deleteById(id);
    }

    public long countActiveElections() {
        return electionRepository.countActiveElections();
    }

    public Election updateElectionStatus(Long electionId, ElectionStatus status) {
        Optional<Election> optionalElection = findById(electionId);
        if (optionalElection.isPresent()) {
            Election election = optionalElection.get();
            election.setStatus(status);
            return save(election);
        }
        throw new RuntimeException("Election not found with id: " + electionId);
    }

    public Election deactivateElection(Long electionId) {
        Optional<Election> optionalElection = findById(electionId);
        if (optionalElection.isPresent()) {
            Election election = optionalElection.get();
            election.setIsActive(false);
            return save(election);
        }
        throw new RuntimeException("Election not found with id: " + electionId);
    }
}
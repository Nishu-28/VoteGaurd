package com.voteguard.config;

import com.voteguard.model.Candidate;
import com.voteguard.model.Voter;
import com.voteguard.repository.CandidateRepository;
import com.voteguard.repository.VoterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

// @Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final VoterRepository voterRepository;
    private final CandidateRepository candidateRepository;

    @Override
    public void run(String... args) throws Exception {
        log.info("Initializing sample data...");

        // Create sample voters
        createSampleVoters();
        
        // Create sample candidates
        createSampleCandidates();

        log.info("Sample data initialization completed!");
    }

    private void createSampleVoters() {
        if (voterRepository.countActiveVoters() == 0) {
            // Create admin user
            Voter admin = Voter.builder()
                    .voterId("ADMIN001")
                    .fullName("System Administrator")
                    .email("admin@voteguard.com")
                    .fingerprintHash("admin_fingerprint_hash_12345")
                    .extraField("1990-01-01")
                    .role(Voter.Role.ADMIN)
                    .isActive(true)
                    .hasVoted(false)
                    .build();

            // Create sample voters
            Voter voter1 = Voter.builder()
                    .voterId("VOTER001")
                    .fullName("Alice Johnson")
                    .email("alice.johnson@email.com")
                    .fingerprintHash("fingerprint_hash_alice_001")
                    .extraField("1995-05-15")
                    .role(Voter.Role.VOTER)
                    .isActive(true)
                    .hasVoted(false)
                    .build();

            Voter voter2 = Voter.builder()
                    .voterId("VOTER002")
                    .fullName("Bob Smith")
                    .email("bob.smith@email.com")
                    .fingerprintHash("fingerprint_hash_bob_002")
                    .extraField("1992-08-22")
                    .role(Voter.Role.VOTER)
                    .isActive(true)
                    .hasVoted(false)
                    .build();

            voterRepository.save(admin);
            voterRepository.save(voter1);
            voterRepository.save(voter2);
            log.info("Created {} sample voters", voterRepository.countActiveVoters());
        }
    }

    private void createSampleCandidates() {
        if (candidateRepository.countActiveCandidates() == 0) {
            Candidate candidate1 = Candidate.builder()
                    .name("Alice Johnson")
                    .party("Progressive Party")
                    .description("Experienced leader with a vision for innovation and growth")
                    .build();

            Candidate candidate2 = Candidate.builder()
                    .name("Bob Wilson")
                    .party("Unity Party")
                    .description("Dedicated to bringing people together and building consensus")
                    .build();

            Candidate candidate3 = Candidate.builder()
                    .name("Carol Davis")
                    .party("Future Forward")
                    .description("Focused on sustainable development and technological advancement")
                    .build();

            candidateRepository.save(candidate1);
            candidateRepository.save(candidate2);
            candidateRepository.save(candidate3);
            log.info("Created {} sample candidates", candidateRepository.countActiveCandidates());
        }
    }
}



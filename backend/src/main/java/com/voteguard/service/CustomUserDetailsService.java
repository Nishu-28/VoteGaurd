package com.voteguard.service;

import com.voteguard.model.Voter;
import com.voteguard.repository.VoterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final VoterRepository voterRepository;

    @Override
    public UserDetails loadUserByUsername(String voterId) throws UsernameNotFoundException {
        Voter voter = voterRepository.findByVoterId(voterId)
                .orElseThrow(() -> new UsernameNotFoundException("Voter not found: " + voterId));
        
        return voter;
    }
}




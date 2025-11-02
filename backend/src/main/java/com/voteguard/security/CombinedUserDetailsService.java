package com.voteguard.security;

import com.voteguard.model.Voter;
import com.voteguard.repository.VoterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service("combinedUserDetailsService")
@RequiredArgsConstructor
public class CombinedUserDetailsService implements UserDetailsService {

    private final VoterRepository voterRepository;
    private final AdminUserDetailsService adminUserDetailsService;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // First try to load as a voter (by voter_id)
        try {
            Voter voter = voterRepository.findByVoterId(username)
                .orElse(null);
            
            if (voter != null) {
                return User.builder()
                    .username(voter.getVoterId())
                    .password("") // No password for center-based voting
                    .authorities(Collections.singletonList(
                        new SimpleGrantedAuthority("ROLE_" + voter.getRole())
                    ))
                    .accountLocked(!voter.getIsActive())
                    .build();
            }
        } catch (Exception e) {
            // Continue to try admin lookup
        }

        // If not found as voter, try to load as admin
        try {
            return adminUserDetailsService.loadUserByUsername(username);
        } catch (UsernameNotFoundException e) {
            throw new UsernameNotFoundException("User not found: " + username);
        }
    }
}

package com.voteguard.security;

import com.voteguard.model.AdminUser;
import com.voteguard.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Optional;

@Service
public class AdminUserDetailsService implements UserDetailsService {

    @Autowired
    private AdminService adminService;

    @Override
    public UserDetails loadUserByUsername(String adminId) throws UsernameNotFoundException {
        Optional<AdminUser> adminOpt = adminService.getAdminByAdminId(adminId);
        
        if (!adminOpt.isPresent()) {
            throw new UsernameNotFoundException("Admin not found: " + adminId);
        }
        
        AdminUser admin = adminOpt.get();
        
        if (!admin.isActive()) {
            throw new UsernameNotFoundException("Admin account is inactive: " + adminId);
        }
        
        return User.builder()
            .username(admin.getAdminId())
            .password("") // Password not used for admin authentication
            .authorities(new ArrayList<>()) // Add roles/authorities if needed
            .accountLocked(!admin.isActive())
            .build();
    }
}
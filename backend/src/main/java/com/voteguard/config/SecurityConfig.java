package com.voteguard.config;

import com.voteguard.security.JwtAuthenticationFilter;
import com.voteguard.security.CombinedUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    @Qualifier("combinedUserDetailsService")
    private CombinedUserDetailsService combinedUserDetailsService;

    @Bean
    public UserDetailsService userDetailsService() {
        return combinedUserDetailsService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthFilter) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**", "/ping", "/health").permitAll()
                .requestMatchers("/admin/login", "/admin/login/fallback").permitAll() // Allow login endpoints
                .requestMatchers("/admin/**").authenticated() // Require authentication for admin routes
                .requestMatchers("/api/voters/**", "/voters/**").permitAll() // Allow all voter endpoints without authentication
                .requestMatchers("/api/elections/**", "/api/candidates/**", "/elections/**", "/candidates/**").permitAll() // Allow elections and candidates endpoints without authentication
                .requestMatchers("/api/stations/**", "/stations/**").permitAll() // Allow stations endpoints without authentication
                .requestMatchers("/api/vote/**", "/api/results/**", "/vote/**", "/results/**").permitAll() // Allow voting and results endpoints without authentication
                .requestMatchers("/h2-console/**").permitAll() // Allow H2 console
                .anyRequest().permitAll() // Allow all other requests without authentication
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }


    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Allow both voter frontend (5173) and admin panel (5174)
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:5173",  // Voter frontend
            "http://localhost:5174"   // Admin panel
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers"
        ));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L); // Cache preflight for 1 hour

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}



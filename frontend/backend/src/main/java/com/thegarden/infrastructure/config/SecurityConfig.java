package com.thegarden.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Baseline security posture for the API.
 *
 * <p>Session management is stateless and CSRF is disabled, which is
 * correct for a token-authenticated JSON API — but no authentication
 * mechanism is wired in yet, so every endpoint is currently permitted.
 * This is intentional scaffolding, not a placeholder: it establishes
 * the stateless foundation the JWT authentication filter chain (a
 * future milestone) will attach to, without inventing a fake auth flow
 * ahead of that milestone.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize.anyRequest().permitAll());

        return http.build();
    }
}

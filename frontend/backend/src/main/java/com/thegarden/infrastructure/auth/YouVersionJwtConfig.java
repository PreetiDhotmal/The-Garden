package com.thegarden.infrastructure.auth;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

@Configuration
public class YouVersionJwtConfig {

    @Bean
    public JwtDecoder youVersionJwtDecoder(YouVersionOAuthProperties properties) {
        return NimbusJwtDecoder.withJwkSetUri(properties.jwksUri()).build();
    }
}

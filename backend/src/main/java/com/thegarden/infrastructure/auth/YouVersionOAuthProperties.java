package com.thegarden.infrastructure.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;

/**
 * clientId is intentionally NOT {@code @NotBlank} — same reasoning as
 * YouVersionProperties.appKey (it's sourced from the same YVP_APP_KEY
 * env var): failing application startup over a missing key blocks
 * every unrelated endpoint too. AuthController's flow will fail
 * clearly if attempted without one configured, which is the right
 * place for that error.
 */
@ConfigurationProperties(prefix = "app.youversion-oauth")
@Validated
public record YouVersionOAuthProperties(
        String clientId,
        @NotBlank String redirectUri,
        @NotBlank String authorizeUrl,
        @NotBlank String tokenUrl,
        @NotBlank String jwksUri,
        @NotBlank String issuer) {
}

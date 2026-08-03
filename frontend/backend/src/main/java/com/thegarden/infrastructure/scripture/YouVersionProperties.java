package com.thegarden.infrastructure.scripture;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

/**
 * Bound from {@code app.youversion.*} properties, which in turn read
 * from environment variables (see application.yml) — the App Key is
 * never hardcoded anywhere in source.
 *
 * <p>appKey is intentionally NOT {@code @NotBlank}: during gameplay
 * development, no one may have registered a YouVersion App Key yet,
 * and failing the entire application context over it blocked every
 * unrelated endpoint (health checks, gameplay routes, everything) —
 * not just scripture ones. Instead, {@link YouVersionApiClient}
 * checks for a blank key immediately before making a request and
 * throws a clear, specific error there, which is a far better place
 * for it than blocking startup.
 */
@ConfigurationProperties(prefix = "app.youversion")
@Validated
public record YouVersionProperties(
        String appKey,
        @NotBlank String baseUrl,
        @Positive int defaultBibleId,
        @Positive int connectTimeoutMillis,
        @Positive int readTimeoutMillis) {
}

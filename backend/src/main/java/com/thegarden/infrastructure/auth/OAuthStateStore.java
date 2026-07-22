package com.thegarden.infrastructure.auth;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Holds the PKCE code_verifier server-side between the redirect to
 * YouVersion's /authorize and the callback exchange, keyed by the
 * random {@code state} value. In-memory and single-instance only —
 * documented as a known limitation (see Milestone 6 report): a
 * multi-instance deployment behind a load balancer needs this moved
 * to a shared store (Redis) so the callback can land on a different
 * instance than the one that started the flow. Entries expire after
 * 10 minutes regardless of use, bounding memory growth from abandoned
 * flows.
 */
@Component
public class OAuthStateStore {

    private record Entry(String codeVerifier, Instant expiresAt) {
    }

    private static final long TTL_SECONDS = 600;

    private final Map<String, Entry> entriesByState = new ConcurrentHashMap<>();

    public void put(String state, String codeVerifier) {
        entriesByState.put(state, new Entry(codeVerifier, Instant.now().plusSeconds(TTL_SECONDS)));
    }

    public Optional<String> consume(String state) {
        Entry entry = entriesByState.remove(state);
        if (entry == null || entry.expiresAt().isBefore(Instant.now())) {
            return Optional.empty();
        }
        return Optional.of(entry.codeVerifier());
    }
}

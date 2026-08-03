package com.thegarden.infrastructure.scripture;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicLong;

/**
 * A minimal token-bucket limiter. YouVersion's docs note rate limits
 * exist but aren't precisely specified in the OpenAPI spec, so this
 * defaults to a conservative rate and is intentionally simple —
 * swappable for a Redis-backed distributed limiter later without
 * changing {@link YouVersionApiClient}, which only depends on
 * {@link #tryAcquire()}.
 */
@Component
public class RateLimitManager {

    private static final int MAX_TOKENS = 20;
    private static final Duration REFILL_INTERVAL = Duration.ofSeconds(1);

    private final AtomicLong availableTokens = new AtomicLong(MAX_TOKENS);
    private volatile Instant lastRefill = Instant.now();

    public synchronized boolean tryAcquire() {
        refillIfDue();
        if (availableTokens.get() <= 0) {
            return false;
        }
        availableTokens.decrementAndGet();
        return true;
    }

    private void refillIfDue() {
        Instant now = Instant.now();
        if (Duration.between(lastRefill, now).compareTo(REFILL_INTERVAL) >= 0) {
            availableTokens.set(MAX_TOKENS);
            lastRefill = now;
        }
    }
}

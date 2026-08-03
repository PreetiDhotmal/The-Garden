package com.thegarden.infrastructure.scripture;

import com.thegarden.domain.scripture.ScriptureProviderException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.function.Supplier;

@Component
public class RetryPolicy {

    private static final Logger log = LoggerFactory.getLogger(RetryPolicy.class);

    private final int maxAttempts;
    private final long initialBackoffMillis;

    public RetryPolicy() {
        this(3, 200L);
    }

    RetryPolicy(int maxAttempts, long initialBackoffMillis) {
        this.maxAttempts = maxAttempts;
        this.initialBackoffMillis = initialBackoffMillis;
    }

    /**
     * Runs {@code action}, retrying with exponential backoff on any
     * {@link ScriptureProviderException} marked retryable.
     * Non-retryable exceptions (4xx client errors, malformed requests)
     * propagate immediately — retrying those would just waste time
     * reproducing the same failure.
     */
    public <T> T executeWithRetry(Supplier<T> action) {
        int attempt = 0;
        while (true) {
            attempt++;
            try {
                return action.get();
            } catch (ScriptureProviderException exception) {
                if (!exception.isRetryable() || attempt >= maxAttempts) {
                    throw exception;
                }
                long backoffMillis = initialBackoffMillis * (1L << (attempt - 1));
                log.warn(
                        "YouVersion request failed (attempt {}/{}), retrying in {}ms: {}",
                        attempt, maxAttempts, backoffMillis, exception.getMessage());
                sleep(backoffMillis);
            }
        }
    }

    private void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Retry backoff was interrupted", interruptedException);
        }
    }
}

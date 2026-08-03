package com.thegarden.infrastructure.scripture;

import com.thegarden.domain.scripture.ScriptureProviderException;
import org.springframework.stereotype.Component;

import java.util.function.Supplier;

@Component
public class RequestManager {

    private final RateLimitManager rateLimitManager;
    private final RetryPolicy retryPolicy;
    private final ApiLogger apiLogger;

    public RequestManager(RateLimitManager rateLimitManager, RetryPolicy retryPolicy, ApiLogger apiLogger) {
        this.rateLimitManager = rateLimitManager;
        this.retryPolicy = retryPolicy;
        this.apiLogger = apiLogger;
    }

    public <T> T execute(String method, String path, Supplier<T> call) {
        if (!rateLimitManager.tryAcquire()) {
            throw new ScriptureProviderException(
                    "Local rate limit exceeded for " + method + " " + path, true, null);
        }

        apiLogger.logRequest(method, path);
        long startedAt = System.currentTimeMillis();

        return retryPolicy.executeWithRetry(() -> {
            T result = call.get();
            apiLogger.logResponse(method, path, 200, System.currentTimeMillis() - startedAt);
            return result;
        });
    }
}

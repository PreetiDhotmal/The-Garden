package com.thegarden.infrastructure.scripture;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class ApiLogger {

    private static final Logger log = LoggerFactory.getLogger("com.thegarden.youversion.api");

    public void logRequest(String method, String path) {
        log.debug("YouVersion request: {} {}", method, path);
    }

    public void logResponse(String method, String path, int status, long durationMillis) {
        log.info("YouVersion response: {} {} -> {} ({}ms)", method, path, status, durationMillis);
    }

    public void logError(String method, String path, String errorSummary) {
        // Deliberately logs only a short error summary, never the App Key
        // header or raw response body, which could contain user data.
        log.warn("YouVersion request failed: {} {} -> {}", method, path, errorSummary);
    }
}

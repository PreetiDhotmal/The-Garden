package com.thegarden.domain.scripture;

public class ScriptureProviderException extends RuntimeException {

    private final boolean retryable;

    public ScriptureProviderException(String message, boolean retryable, Throwable cause) {
        super(message, cause);
        this.retryable = retryable;
    }

    public boolean isRetryable() {
        return retryable;
    }
}

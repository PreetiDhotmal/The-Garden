package com.thegarden.presentation.exception;

import java.time.Instant;

/**
 * Mirrors the frontend contract: packages/shared-types/src/player.ts (ApiErrorResponse)
 */
public record ApiErrorResponse(int status, String code, String message, Instant timestamp, String path) {

    public static ApiErrorResponse of(int status, String code, String message, String path) {
        return new ApiErrorResponse(status, code, message, Instant.now(), path);
    }
}

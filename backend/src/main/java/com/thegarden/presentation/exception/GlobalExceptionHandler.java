package com.thegarden.presentation.exception;

import com.thegarden.domain.scripture.ScriptureNotFoundException;
import com.thegarden.domain.scripture.ScriptureProviderException;
import com.thegarden.domain.world.OutOfSequenceWorldUnlockException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ScriptureNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleScriptureNotFound(
            ScriptureNotFoundException exception, HttpServletRequest request) {
        ApiErrorResponse body = ApiErrorResponse.of(
                HttpStatus.NOT_FOUND.value(), "SCRIPTURE_NOT_FOUND", exception.getMessage(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(ScriptureProviderException.class)
    public ResponseEntity<ApiErrorResponse> handleScriptureProviderFailure(
            ScriptureProviderException exception, HttpServletRequest request) {
        // Retryable failures (upstream 5xx, network errors, our own rate limit)
        // surface as 503 so the frontend's offline/retry logic knows to back off
        // and try again, rather than treating it as a permanent failure.
        HttpStatus status = exception.isRetryable() ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.BAD_GATEWAY;
        ApiErrorResponse body = ApiErrorResponse.of(
                status.value(), "SCRIPTURE_PROVIDER_ERROR", exception.getMessage(), request.getRequestURI());
        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler(OutOfSequenceWorldUnlockException.class)
    public ResponseEntity<ApiErrorResponse> handleOutOfSequenceWorldUnlock(
            OutOfSequenceWorldUnlockException exception, HttpServletRequest request) {
        ApiErrorResponse body = ApiErrorResponse.of(
                HttpStatus.CONFLICT.value(),
                "WORLD_UNLOCK_OUT_OF_SEQUENCE",
                exception.getMessage(),
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(
            IllegalArgumentException exception, HttpServletRequest request) {
        ApiErrorResponse body = ApiErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                "INVALID_REQUEST",
                exception.getMessage(),
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception exception, HttpServletRequest request) {
        ApiErrorResponse body = ApiErrorResponse.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "INTERNAL_SERVER_ERROR",
                "An unexpected error occurred.",
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}

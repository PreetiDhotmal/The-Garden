package com.thegarden.infrastructure.auth;

public record YouVersionTokenResult(
        String accessToken, String refreshToken, String idToken, long expiresInSeconds) {
}

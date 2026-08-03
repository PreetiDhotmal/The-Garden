package com.thegarden.presentation.controller;

public record SessionResponse(
        String accessToken, String refreshToken, long expiresInSeconds, String displayName) {
}

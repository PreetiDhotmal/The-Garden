package com.thegarden.infrastructure.auth;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

@Component
public class PkceGenerator {

    private final SecureRandom secureRandom = new SecureRandom();

    public record PkcePair(String codeVerifier, String codeChallenge) {
    }

    public PkcePair generate() {
        String codeVerifier = randomUrlSafeString(64);
        String codeChallenge = sha256UrlSafe(codeVerifier);
        return new PkcePair(codeVerifier, codeChallenge);
    }

    public String generateState() {
        return randomUrlSafeString(32);
    }

    private String randomUrlSafeString(int byteLength) {
        byte[] bytes = new byte[byteLength];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256UrlSafe(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.US_ASCII));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available on this JVM.", exception);
        }
    }
}

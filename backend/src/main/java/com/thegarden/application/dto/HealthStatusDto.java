package com.thegarden.application.dto;

/**
 * Mirrors the frontend contract: frontend/src/infrastructure/api/healthApi.ts
 */
public record HealthStatusDto(String status, String service) {

    public static HealthStatusDto up(String serviceName) {
        return new HealthStatusDto("UP", serviceName);
    }
}

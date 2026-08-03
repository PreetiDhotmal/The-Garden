package com.thegarden.presentation.controller;

import com.thegarden.application.dto.HealthStatusDto;
import com.thegarden.application.service.HealthCheckService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Health", description = "Backend availability check consumed by the frontend connection badge")
public class HealthController {

    private final HealthCheckService healthCheckService;

    public HealthController(HealthCheckService healthCheckService) {
        this.healthCheckService = healthCheckService;
    }

    @Operation(summary = "Report backend health status")
    @GetMapping("/api/health")
    public HealthStatusDto health() {
        return healthCheckService.currentStatus();
    }
}

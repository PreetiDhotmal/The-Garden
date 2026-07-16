package com.thegarden.application.service;

import com.thegarden.application.dto.HealthStatusDto;
import org.springframework.stereotype.Service;

@Service
public class HealthCheckService {

    public HealthStatusDto currentStatus() {
        return HealthStatusDto.up("the-garden-backend");
    }
}

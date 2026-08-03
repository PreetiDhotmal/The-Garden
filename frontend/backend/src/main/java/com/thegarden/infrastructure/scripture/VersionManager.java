package com.thegarden.infrastructure.scripture;

import org.springframework.stereotype.Component;

@Component
public class VersionManager {

    private static final String API_VERSION_PATH_SEGMENT = "v1";

    public String versionedPath(String path) {
        String trimmed = path.startsWith("/") ? path.substring(1) : path;
        return "/%s/%s".formatted(API_VERSION_PATH_SEGMENT, trimmed);
    }

    public String currentVersion() {
        return API_VERSION_PATH_SEGMENT;
    }
}

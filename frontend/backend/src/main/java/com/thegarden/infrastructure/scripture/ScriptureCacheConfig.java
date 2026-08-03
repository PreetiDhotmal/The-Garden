package com.thegarden.infrastructure.scripture;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Memory-cache tier (fast, process-local, lost on restart). Scripture
 * text rarely changes, so a generous TTL is appropriate — background
 * refresh is handled by simply letting entries expire and re-fetch
 * on next access, rather than a separate scheduled refresh job, which
 * would add complexity without much benefit for content this static.
 */
@Configuration
@EnableCaching
public class ScriptureCacheConfig {

    private static final String[] CACHE_NAMES = {
        "scripturePassages", "bibleVersions", "bibleVersion", "bibleBooks", "bibleChapters"
    };

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager(CACHE_NAMES);
        manager.setCaffeine(
                Caffeine.newBuilder()
                        .maximumSize(5_000)
                        .expireAfterWrite(6, TimeUnit.HOURS));
        return manager;
    }
}

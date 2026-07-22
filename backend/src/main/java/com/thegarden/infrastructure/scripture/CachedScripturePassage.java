package com.thegarden.infrastructure.scripture;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "cached_scripture_passage")
public class CachedScripturePassage {

    @Id
    @Column(name = "cache_key", nullable = false, length = 64)
    private String cacheKey;

    @Column(name = "bible_id", nullable = false)
    private int bibleId;

    @Column(name = "passage_id", nullable = false, length = 32)
    private String passageId;

    @Column(name = "content", nullable = false, columnDefinition = "text")
    private String content;

    @Column(name = "copyright_notice", columnDefinition = "text")
    private String copyrightNotice;

    @Column(name = "cached_at", nullable = false)
    private Instant cachedAt;

    protected CachedScripturePassage() {
        // JPA
    }

    public CachedScripturePassage(
            String cacheKey, int bibleId, String passageId, String content, String copyrightNotice) {
        this.cacheKey = cacheKey;
        this.bibleId = bibleId;
        this.passageId = passageId;
        this.content = content;
        this.copyrightNotice = copyrightNotice;
        this.cachedAt = Instant.now();
    }

    public String getCacheKey() {
        return cacheKey;
    }

    public int getBibleId() {
        return bibleId;
    }

    public String getPassageId() {
        return passageId;
    }

    public String getContent() {
        return content;
    }

    public String getCopyrightNotice() {
        return copyrightNotice;
    }

    public Instant getCachedAt() {
        return cachedAt;
    }
}

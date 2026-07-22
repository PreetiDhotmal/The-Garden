package com.thegarden.infrastructure.scripture;

import com.thegarden.domain.scripture.BibleBook;
import com.thegarden.domain.scripture.BibleChapter;
import com.thegarden.domain.scripture.BibleVersion;
import com.thegarden.domain.scripture.ScriptureProviderPort;
import com.thegarden.domain.scripture.ScriptureReference;
import com.thegarden.domain.scripture.ScriptureVerse;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Optional;

@Component
public class YouVersionScriptureProvider implements ScriptureProviderPort {

    private final YouVersionApiClient apiClient;
    private final YouVersionResponseMapper responseMapper;
    private final Optional<CachedScripturePassageRepository> diskCache;

    public YouVersionScriptureProvider(
            YouVersionApiClient apiClient,
            YouVersionResponseMapper responseMapper,
            Optional<CachedScripturePassageRepository> diskCache) {
        this.apiClient = apiClient;
        this.responseMapper = responseMapper;
        this.diskCache = diskCache;
    }

    @Override
    @Cacheable(cacheNames = "scripturePassages", key = "#reference.bibleId + ':' + #reference.toPassageId()")
    public ScriptureVerse getPassage(ScriptureReference reference) {
        String cacheKey = reference.getBibleId() + ":" + reference.toPassageId();

        // The disk-cache (L2) tier is only present when a real datasource is
        // configured (see application.yml's spring.autoconfigure.exclude —
        // JPA is cleanly disabled by default during this phase of the
        // project). Without it, every call simply falls through to the API,
        // still backed by the in-memory (L1) @Cacheable above.
        if (diskCache.isPresent()) {
            Optional<CachedScripturePassage> diskHit = diskCache.get().findById(cacheKey);
            if (diskHit.isPresent()) {
                CachedScripturePassage cached = diskHit.get();
                return new ScriptureVerse(reference, cached.getContent(), cached.getCopyrightNotice());
            }
        }

        YouVersionPassageResponse response = apiClient.getPassage(reference.getBibleId(), reference.toPassageId());
        String copyright = getBibleVersion(reference.getBibleId()).copyright();
        ScriptureVerse verse = responseMapper.toDomain(response, reference, copyright);

        diskCache.ifPresent(repository -> repository.save(new CachedScripturePassage(
                cacheKey, reference.getBibleId(), reference.toPassageId(), verse.text(), verse.copyrightNotice())));

        return verse;
    }

    @Override
    @Cacheable(cacheNames = "bibleVersions", key = "#languageRanges")
    public List<BibleVersion> listBibleVersions(List<String> languageRanges) {
        UriComponentsBuilder query = UriComponentsBuilder.newInstance();
        for (String range : languageRanges) {
            query.queryParam("language_ranges[]", range);
        }
        YouVersionBibleCollectionResponse response = apiClient.listBibles(query.build().getQuery());
        return responseMapper.toDomainBibleList(response);
    }

    @Override
    @Cacheable(cacheNames = "bibleVersion", key = "#bibleId")
    public BibleVersion getBibleVersion(int bibleId) {
        return responseMapper.toDomain(apiClient.getBible(bibleId));
    }

    @Override
    @Cacheable(cacheNames = "bibleBooks", key = "#bibleId")
    public List<BibleBook> listBooks(int bibleId) {
        return responseMapper.toDomainBookList(apiClient.listBooks(bibleId));
    }

    @Override
    @Cacheable(cacheNames = "bibleChapters", key = "#bibleId + ':' + #bookUsfm")
    public List<BibleChapter> listChapters(int bibleId, String bookUsfm) {
        return responseMapper.toDomainChapterList(bookUsfm, apiClient.listChapters(bibleId, bookUsfm));
    }
}

package com.thegarden.infrastructure.scripture;

import com.thegarden.domain.scripture.ScriptureProviderException;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

/**
 * Talks to the real YouVersion Platform REST API
 * (developers.youversion.com). Every request carries the App Key in
 * the {@code X-YVP-App-Key} header, sourced from
 * {@link YouVersionProperties} (which is itself bound from an
 * environment variable) — the key is never hardcoded and never sent
 * to the frontend.
 * <p>
 * Timeouts are configured via {@link SimpleClientHttpRequestFactory}
 * (Spring Framework's {@code spring-web} module) rather than any
 * {@code org.springframework.boot.http.client.*} builder — that
 * package has moved/changed across recent Boot releases in ways this
 * codebase got wrong once already; SimpleClientHttpRequestFactory has
 * been stable since Spring Framework 3.x and isn't subject to Boot's
 * per-release HTTP client modularization at all.
 */
@Component
public class YouVersionApiClient {

    private static final String APP_KEY_HEADER = "X-YVP-App-Key";

    private final RestClient restClient;
    private final RequestManager requestManager;
    private final VersionManager versionManager;
    private final YouVersionErrorMapper errorMapper;
    private final String appKey;

    public YouVersionApiClient(
            YouVersionProperties properties,
            RequestManager requestManager,
            VersionManager versionManager,
            YouVersionErrorMapper errorMapper) {
        this.requestManager = requestManager;
        this.versionManager = versionManager;
        this.errorMapper = errorMapper;
        this.appKey = properties.appKey();

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(properties.connectTimeoutMillis());
        requestFactory.setReadTimeout(properties.readTimeoutMillis());

        this.restClient = RestClient.builder()
                .baseUrl(properties.baseUrl())
                .requestFactory(requestFactory)
                .defaultHeader(APP_KEY_HEADER, properties.appKey())
                .defaultHeader("Accept", "application/json")
                .build();
    }

    YouVersionPassageResponse getPassage(int bibleId, String passageId) {
        String path = versionManager.versionedPath("bibles/%d/passages/%s".formatted(bibleId, passageId));
        return get(path, YouVersionPassageResponse.class);
    }

    YouVersionBibleCollectionResponse listBibles(String languageRangesQuery) {
        String path = versionManager.versionedPath("bibles?" + languageRangesQuery);
        return get(path, YouVersionBibleCollectionResponse.class);
    }

    YouVersionBibleResponse getBible(int bibleId) {
        String path = versionManager.versionedPath("bibles/%d".formatted(bibleId));
        return get(path, YouVersionBibleResponse.class);
    }

    YouVersionBookCollectionResponse listBooks(int bibleId) {
        String path = versionManager.versionedPath("bibles/%d/books".formatted(bibleId));
        return get(path, YouVersionBookCollectionResponse.class);
    }

    YouVersionChapterCollectionResponse listChapters(int bibleId, String bookUsfm) {
        String path = versionManager.versionedPath("bibles/%d/books/%s/chapters".formatted(bibleId, bookUsfm));
        return get(path, YouVersionChapterCollectionResponse.class);
    }

    private <T> T get(String path, Class<T> responseType) {
        if (appKey == null || appKey.isBlank()) {
            throw new ScriptureProviderException(
                    "YouVersion App Key is not configured. Register at platform.youversion.com "
                            + "and set the YVP_APP_KEY environment variable before making scripture "
                            + "requests. (See backend/.env.example.)",
                    false,
                    null);
        }
        return requestManager.execute("GET", path, () -> {
            try {
                return restClient.get().uri(path).retrieve().body(responseType);
            } catch (RestClientResponseException exception) {
                throw errorMapper.map(exception, path);
            } catch (Exception exception) {
                throw errorMapper.mapNetworkFailure(path, exception);
            }
        });
    }
}

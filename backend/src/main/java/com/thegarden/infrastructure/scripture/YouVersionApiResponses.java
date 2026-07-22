package com.thegarden.infrastructure.scripture;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
record YouVersionErrorResponse(String error, String message) {
}

@JsonIgnoreProperties(ignoreUnknown = true)
record YouVersionBibleResponse(
        int id,
        String abbreviation,
        @JsonProperty("promotional_content") String promotionalContent,
        String copyright,
        String info,
        @JsonProperty("publisher_url") String publisherUrl,
        @JsonProperty("language_tag") String languageTag,
        @JsonProperty("localized_abbreviation") String localizedAbbreviation,
        @JsonProperty("localized_title") String localizedTitle,
        String title,
        List<String> books,
        @JsonProperty("youversion_deep_link") String youversionDeepLink,
        @JsonProperty("organization_id") String organizationId) {
}

@JsonIgnoreProperties(ignoreUnknown = true)
record YouVersionBibleCollectionResponse(
        List<YouVersionBibleResponse> data,
        @JsonProperty("next_page_token") String nextPageToken,
        @JsonProperty("total_size") Integer totalSize) {
}

@JsonIgnoreProperties(ignoreUnknown = true)
record YouVersionPassageResponse(String id, String content, String reference) {
}

@JsonIgnoreProperties(ignoreUnknown = true)
record YouVersionVerseSummary(String id, @JsonProperty("passage_id") String passageId, String title) {
}

@JsonIgnoreProperties(ignoreUnknown = true)
record YouVersionChapterResponse(
        String id,
        @JsonProperty("passage_id") String passageId,
        String title,
        List<YouVersionVerseSummary> verses) {
}

@JsonIgnoreProperties(ignoreUnknown = true)
record YouVersionChapterCollectionResponse(List<YouVersionChapterResponse> data) {
}

@JsonIgnoreProperties(ignoreUnknown = true)
record YouVersionIntro(String id, @JsonProperty("passage_id") String passageId, String title) {
}

@JsonIgnoreProperties(ignoreUnknown = true)
record YouVersionBookResponse(
        String id,
        String title,
        @JsonProperty("full_title") String fullTitle,
        String abbreviation,
        String canon,
        List<YouVersionChapterResponse> chapters,
        YouVersionIntro intro) {
}

@JsonIgnoreProperties(ignoreUnknown = true)
record YouVersionBookCollectionResponse(List<YouVersionBookResponse> data) {
}

package com.thegarden.infrastructure.scripture;

import com.thegarden.domain.scripture.BibleBook;
import com.thegarden.domain.scripture.BibleChapter;
import com.thegarden.domain.scripture.BibleVersion;
import com.thegarden.domain.scripture.ScriptureReference;
import com.thegarden.domain.scripture.ScriptureVerse;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
class YouVersionResponseMapper {

    ScriptureVerse toDomain(YouVersionPassageResponse response, ScriptureReference reference, String copyright) {
        return new ScriptureVerse(reference, response.content(), copyright);
    }

    BibleVersion toDomain(YouVersionBibleResponse response) {
        return new BibleVersion(
                response.id(),
                response.abbreviation(),
                response.title(),
                response.languageTag(),
                response.copyright(),
                response.books());
    }

    BibleBook toDomain(YouVersionBookResponse response) {
        return new BibleBook(
                response.id(), response.title(), response.fullTitle(), response.abbreviation(), response.canon());
    }

    BibleChapter toDomain(String bookUsfm, YouVersionChapterResponse response) {
        int verseCount = response.verses() != null ? response.verses().size() : 0;
        int chapterNumber = parseChapterNumber(response.id());
        return new BibleChapter(bookUsfm, chapterNumber, verseCount);
    }

    List<BibleBook> toDomainBookList(YouVersionBookCollectionResponse response) {
        return response.data().stream().map(this::toDomain).toList();
    }

    List<BibleChapter> toDomainChapterList(String bookUsfm, YouVersionChapterCollectionResponse response) {
        return response.data().stream().map(chapter -> toDomain(bookUsfm, chapter)).toList();
    }

    List<BibleVersion> toDomainBibleList(YouVersionBibleCollectionResponse response) {
        return response.data().stream().map(this::toDomain).toList();
    }

    private int parseChapterNumber(String chapterId) {
        try {
            return Integer.parseInt(chapterId);
        } catch (NumberFormatException exception) {
            // Some chapter ids are non-numeric (e.g. "INTRO1"); callers that need a
            // strictly numeric chapter should filter those out upstream.
            return -1;
        }
    }
}

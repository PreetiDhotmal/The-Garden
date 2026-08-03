package com.thegarden.application.scripture;

import com.thegarden.application.scripture.dto.BibleBookDto;
import com.thegarden.application.scripture.dto.BibleChapterDto;
import com.thegarden.application.scripture.dto.BibleVersionDto;
import com.thegarden.application.scripture.dto.ScriptureReferenceDto;
import com.thegarden.application.scripture.dto.ScriptureVerseDto;
import com.thegarden.domain.scripture.BibleBook;
import com.thegarden.domain.scripture.BibleChapter;
import com.thegarden.domain.scripture.BibleVersion;
import com.thegarden.domain.scripture.ScriptureReference;
import com.thegarden.domain.scripture.ScriptureVerse;
import com.thegarden.infrastructure.scripture.BookUsfmMapper;
import org.springframework.stereotype.Component;

@Component
public class ScriptureDtoMapper {

    private final BookUsfmMapper bookUsfmMapper;

    public ScriptureDtoMapper(BookUsfmMapper bookUsfmMapper) {
        this.bookUsfmMapper = bookUsfmMapper;
    }

    public ScriptureReference toDomainReference(ScriptureReferenceDto dto, int bibleId) {
        return new ScriptureReference(
                bibleId, bookUsfmMapper.toUsfm(dto.bookName()), dto.chapter(), dto.verseStart(), dto.verseEnd());
    }

    public ScriptureVerseDto toDto(ScriptureVerse verse, String translationCode) {
        return new ScriptureVerseDto(
                toDto(verse.reference(), translationCode), verse.text(), verse.copyrightNotice());
    }

    public ScriptureReferenceDto toDto(ScriptureReference reference, String translationCode) {
        return new ScriptureReferenceDto(
                bookUsfmMapper.toBookName(reference.getBookUsfm()),
                reference.getChapter(),
                reference.getVerseStart(),
                reference.getVerseEnd(),
                translationCode);
    }

    public BibleVersionDto toDto(BibleVersion version) {
        return new BibleVersionDto(
                version.abbreviation(), version.title(), version.languageTag(), version.copyright());
    }

    public BibleBookDto toDto(BibleBook book) {
        return new BibleBookDto(
                bookUsfmMapper.toBookName(book.usfm()), book.fullTitle(), book.abbreviation(), book.canon());
    }

    public BibleChapterDto toDto(BibleChapter chapter) {
        return new BibleChapterDto(
                bookUsfmMapper.toBookName(chapter.bookUsfm()), chapter.chapterNumber(), chapter.verseCount());
    }
}

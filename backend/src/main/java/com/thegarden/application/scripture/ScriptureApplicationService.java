package com.thegarden.application.scripture;

import com.thegarden.application.scripture.dto.BibleBookDto;
import com.thegarden.application.scripture.dto.BibleChapterDto;
import com.thegarden.application.scripture.dto.BibleVersionDto;
import com.thegarden.application.scripture.dto.ScriptureReferenceDto;
import com.thegarden.application.scripture.dto.ScriptureVerseDto;
import com.thegarden.domain.scripture.ScriptureProviderPort;
import com.thegarden.domain.scripture.ScriptureReference;
import com.thegarden.domain.scripture.ScriptureVerse;
import com.thegarden.infrastructure.scripture.BibleVersionResolver;
import com.thegarden.infrastructure.scripture.BookUsfmMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ScriptureApplicationService {

    private final ScriptureProviderPort scriptureProvider;
    private final BibleVersionResolver bibleVersionResolver;
    private final BookUsfmMapper bookUsfmMapper;
    private final ScriptureDtoMapper dtoMapper;

    public ScriptureApplicationService(
            ScriptureProviderPort scriptureProvider,
            BibleVersionResolver bibleVersionResolver,
            BookUsfmMapper bookUsfmMapper,
            ScriptureDtoMapper dtoMapper) {
        this.scriptureProvider = scriptureProvider;
        this.bibleVersionResolver = bibleVersionResolver;
        this.bookUsfmMapper = bookUsfmMapper;
        this.dtoMapper = dtoMapper;
    }

    public ScriptureVerseDto getVerse(ScriptureReferenceDto referenceDto) {
        int bibleId = bibleVersionResolver.resolveBibleId(referenceDto.translationCode());
        ScriptureReference reference = dtoMapper.toDomainReference(referenceDto, bibleId);
        ScriptureVerse verse = scriptureProvider.getPassage(reference);
        return dtoMapper.toDto(verse, referenceDto.translationCode());
    }

    public List<ScriptureVerseDto> getVerses(List<ScriptureReferenceDto> references) {
        return references.stream().map(this::getVerse).toList();
    }

    public List<BibleVersionDto> listBibleVersions(List<String> languageRanges) {
        return scriptureProvider.listBibleVersions(languageRanges).stream().map(dtoMapper::toDto).toList();
    }

    public List<BibleBookDto> listBooks(String translationCode) {
        int bibleId = bibleVersionResolver.resolveBibleId(translationCode);
        return scriptureProvider.listBooks(bibleId).stream().map(dtoMapper::toDto).toList();
    }

    public List<BibleChapterDto> listChapters(String translationCode, String bookName) {
        int bibleId = bibleVersionResolver.resolveBibleId(translationCode);
        String usfm = bookUsfmMapper.toUsfm(bookName);
        return scriptureProvider.listChapters(bibleId, usfm).stream().map(dtoMapper::toDto).toList();
    }
}

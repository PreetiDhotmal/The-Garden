package com.thegarden.domain.scripture;

import java.util.List;

/**
 * The boundary between the application layer and however scripture
 * content is actually sourced. {@code YouVersionScriptureProvider}
 * (infrastructure) implements this against the real YouVersion
 * Platform API; a future test double or alternate provider could
 * implement it identically with zero change to callers.
 */
public interface ScriptureProviderPort {

    ScriptureVerse getPassage(ScriptureReference reference);

    List<BibleVersion> listBibleVersions(List<String> languageRanges);

    BibleVersion getBibleVersion(int bibleId);

    List<BibleBook> listBooks(int bibleId);

    List<BibleChapter> listChapters(int bibleId, String bookUsfm);
}

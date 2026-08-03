package com.thegarden.domain.scripture;

import java.util.Objects;

/**
 * A reference to a passage of scripture, identified the way the
 * YouVersion Platform API identifies it: a numeric Bible version id
 * plus a USFM-style book/chapter/verse locator (e.g. book "JHN",
 * chapter 3, verse 16). This is the domain's canonical reference
 * shape — the application-layer DTO is the wire format the frontend
 * actually consumes, translated from this by a mapper.
 */
public final class ScriptureReference {

    private final int bibleId;
    private final String bookUsfm;
    private final int chapter;
    private final int verseStart;
    private final Integer verseEnd;

    public ScriptureReference(int bibleId, String bookUsfm, int chapter, int verseStart, Integer verseEnd) {
        if (bookUsfm == null || bookUsfm.isBlank()) {
            throw new IllegalArgumentException("bookUsfm must not be blank");
        }
        if (chapter <= 0) {
            throw new IllegalArgumentException("chapter must be positive");
        }
        if (verseStart <= 0) {
            throw new IllegalArgumentException("verseStart must be positive");
        }
        if (verseEnd != null && verseEnd < verseStart) {
            throw new IllegalArgumentException("verseEnd must not be less than verseStart");
        }
        this.bibleId = bibleId;
        this.bookUsfm = bookUsfm;
        this.chapter = chapter;
        this.verseStart = verseStart;
        this.verseEnd = verseEnd;
    }

    /** The USFM passage id YouVersion's API expects, e.g. "JHN.3.16" or "JHN.3.16-18". */
    public String toPassageId() {
        String verseSpan = (verseEnd != null && !verseEnd.equals(verseStart))
                ? verseStart + "-" + verseEnd
                : String.valueOf(verseStart);
        return "%s.%d.%s".formatted(bookUsfm, chapter, verseSpan);
    }

    public int getBibleId() {
        return bibleId;
    }

    public String getBookUsfm() {
        return bookUsfm;
    }

    public int getChapter() {
        return chapter;
    }

    public int getVerseStart() {
        return verseStart;
    }

    public Integer getVerseEnd() {
        return verseEnd;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof ScriptureReference that)) {
            return false;
        }
        return bibleId == that.bibleId
                && chapter == that.chapter
                && verseStart == that.verseStart
                && bookUsfm.equals(that.bookUsfm)
                && Objects.equals(verseEnd, that.verseEnd);
    }

    @Override
    public int hashCode() {
        return Objects.hash(bibleId, bookUsfm, chapter, verseStart, verseEnd);
    }

    @Override
    public String toString() {
        return "ScriptureReference[bibleId=%d, passageId=%s]".formatted(bibleId, toPassageId());
    }
}

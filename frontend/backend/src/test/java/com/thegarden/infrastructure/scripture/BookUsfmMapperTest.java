package com.thegarden.infrastructure.scripture;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BookUsfmMapperTest {

    private final BookUsfmMapper mapper = new BookUsfmMapper();

    @Test
    void mapsAKnownBookNameToItsUsfmCode() {
        assertThat(mapper.toUsfm("John")).isEqualTo("JHN");
    }

    @Test
    void isCaseInsensitiveAndTrimsWhitespace() {
        assertThat(mapper.toUsfm("  john  ")).isEqualTo("JHN");
    }

    @Test
    void toleratesTheSingularPsalmAlongsideThePluralPsalms() {
        assertThat(mapper.toUsfm("Psalm")).isEqualTo("PSA");
        assertThat(mapper.toUsfm("Psalms")).isEqualTo("PSA");
    }

    @Test
    void mapsANumberedBookName() {
        assertThat(mapper.toUsfm("1 John")).isEqualTo("1JN");
    }

    @Test
    void rejectsAnUnknownBookName() {
        assertThatThrownBy(() -> mapper.toUsfm("Not A Book"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void mapsAUsfmCodeBackToItsBookName() {
        assertThat(mapper.toBookName("JHN")).isEqualTo("John");
    }

    @Test
    void roundTripsEveryStandardBook() {
        String[] usfmCodes = {
            "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA",
            "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO",
            "ECC", "SNG", "ISA", "JER", "LAM", "EZK", "DAN", "HOS", "JOL", "AMO",
            "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL", "MAT",
            "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP",
            "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE",
            "2PE", "1JN", "2JN", "3JN", "JUD", "REV",
        };
        for (String usfm : usfmCodes) {
            String bookName = mapper.toBookName(usfm);
            assertThat(mapper.toUsfm(bookName)).as("round-trip for %s", usfm).isEqualTo(usfm);
        }
    }

    @Test
    void rejectsAnUnknownUsfmCode() {
        assertThatThrownBy(() -> mapper.toBookName("ZZZ"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}

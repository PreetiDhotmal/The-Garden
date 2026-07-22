package com.thegarden.infrastructure.scripture;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Translates between the human-readable book names the rest of the
 * codebase uses (e.g. "John", "Psalm") — the shape already baked into
 * existing quest/collectible content from Milestones 4-5 — and the
 * USFM 3-letter codes YouVersion's API requires (e.g. "JHN", "PSA").
 * The USFM standard itself is public and stable across publishers,
 * not something specific to YouVersion, so this table is safe to
 * commit as source, unlike anything API-key-related.
 */
@Component
public class BookUsfmMapper {

    private static final Map<String, String> NAME_TO_USFM = buildNameToUsfmMap();
    private static final Map<String, String> USFM_TO_NAME = buildUsfmToNameMap();

    public String toUsfm(String bookName) {
        String normalized = normalize(bookName);
        String usfm = NAME_TO_USFM.get(normalized);
        if (usfm == null) {
            throw new IllegalArgumentException("Unknown book name: \"" + bookName + "\"");
        }
        return usfm;
    }

    public String toBookName(String usfm) {
        String name = USFM_TO_NAME.get(usfm.toUpperCase(Locale.ROOT));
        if (name == null) {
            throw new IllegalArgumentException("Unknown USFM book code: \"" + usfm + "\"");
        }
        return name;
    }

    private String normalize(String bookName) {
        String trimmed = bookName.trim().toLowerCase(Locale.ROOT);
        // Tolerate the singular "Psalm" alongside the standard plural "Psalms".
        return trimmed.equals("psalm") ? "psalms" : trimmed;
    }

    private static Map<String, String> buildNameToUsfmMap() {
        Map<String, String> map = new HashMap<>();
        String[][] entries = {
            {"genesis", "GEN"}, {"exodus", "EXO"}, {"leviticus", "LEV"}, {"numbers", "NUM"},
            {"deuteronomy", "DEU"}, {"joshua", "JOS"}, {"judges", "JDG"}, {"ruth", "RUT"},
            {"1 samuel", "1SA"}, {"2 samuel", "2SA"}, {"1 kings", "1KI"}, {"2 kings", "2KI"},
            {"1 chronicles", "1CH"}, {"2 chronicles", "2CH"}, {"ezra", "EZR"}, {"nehemiah", "NEH"},
            {"esther", "EST"}, {"job", "JOB"}, {"psalms", "PSA"}, {"proverbs", "PRO"},
            {"ecclesiastes", "ECC"}, {"song of solomon", "SNG"}, {"isaiah", "ISA"}, {"jeremiah", "JER"},
            {"lamentations", "LAM"}, {"ezekiel", "EZK"}, {"daniel", "DAN"}, {"hosea", "HOS"},
            {"joel", "JOL"}, {"amos", "AMO"}, {"obadiah", "OBA"}, {"jonah", "JON"}, {"micah", "MIC"},
            {"nahum", "NAM"}, {"habakkuk", "HAB"}, {"zephaniah", "ZEP"}, {"haggai", "HAG"},
            {"zechariah", "ZEC"}, {"malachi", "MAL"}, {"matthew", "MAT"}, {"mark", "MRK"},
            {"luke", "LUK"}, {"john", "JHN"}, {"acts", "ACT"}, {"romans", "ROM"},
            {"1 corinthians", "1CO"}, {"2 corinthians", "2CO"}, {"galatians", "GAL"}, {"ephesians", "EPH"},
            {"philippians", "PHP"}, {"colossians", "COL"}, {"1 thessalonians", "1TH"},
            {"2 thessalonians", "2TH"}, {"1 timothy", "1TI"}, {"2 timothy", "2TI"}, {"titus", "TIT"},
            {"philemon", "PHM"}, {"hebrews", "HEB"}, {"james", "JAS"}, {"1 peter", "1PE"},
            {"2 peter", "2PE"}, {"1 john", "1JN"}, {"2 john", "2JN"}, {"3 john", "3JN"},
            {"jude", "JUD"}, {"revelation", "REV"},
        };
        for (String[] entry : entries) {
            map.put(entry[0], entry[1]);
        }
        return Map.copyOf(map);
    }

    private static Map<String, String> buildUsfmToNameMap() {
        Map<String, String> reversed = new HashMap<>();
        buildNameToUsfmMap().forEach((name, usfm) -> reversed.put(usfm, capitalize(name)));
        return Map.copyOf(reversed);
    }

    private static String capitalize(String name) {
        String[] words = name.split(" ");
        StringBuilder result = new StringBuilder();
        for (String word : words) {
            if (!result.isEmpty()) {
                result.append(' ');
            }
            result.append(Character.toUpperCase(word.charAt(0))).append(word.substring(1));
        }
        return result.toString();
    }
}

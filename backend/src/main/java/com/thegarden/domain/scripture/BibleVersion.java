package com.thegarden.domain.scripture;

import java.util.List;

public record BibleVersion(
        int id,
        String abbreviation,
        String title,
        String languageTag,
        String copyright,
        List<String> bookUsfmCodes) {
}

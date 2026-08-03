package com.thegarden.application.scripture.dto;

public record ScriptureReferenceDto(
        String bookName, int chapter, int verseStart, Integer verseEnd, String translationCode) {
}

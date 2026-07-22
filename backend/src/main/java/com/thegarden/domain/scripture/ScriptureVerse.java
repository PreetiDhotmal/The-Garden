package com.thegarden.domain.scripture;

public record ScriptureVerse(ScriptureReference reference, String text, String copyrightNotice) {

    public ScriptureVerse {
        if (reference == null) {
            throw new IllegalArgumentException("reference must not be null");
        }
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("text must not be blank");
        }
    }
}

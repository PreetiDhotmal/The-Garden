package com.thegarden.domain.scripture;

public class ScriptureNotFoundException extends RuntimeException {

    public ScriptureNotFoundException(String message) {
        super(message);
    }
}

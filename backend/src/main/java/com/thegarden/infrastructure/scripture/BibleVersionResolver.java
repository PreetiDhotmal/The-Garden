package com.thegarden.infrastructure.scripture;

import com.thegarden.domain.scripture.BibleVersion;
import com.thegarden.domain.scripture.ScriptureProviderPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * Translation codes like "NIV" or "BSB" are how the rest of the
 * codebase (existing quest/collectible content) refers to a Bible
 * version, but YouVersion's API addresses versions by opaque numeric
 * id. Only BSB's id (3034) is confirmed directly in YouVersion's own
 * documentation examples — every other translation's id must be
 * discovered by searching the live Bible collection for a matching
 * abbreviation, not guessed. This resolver does that lookup (through
 * the already-cached {@code listBibleVersions}), falling back to the
 * configured default only when no match is found.
 */
@Component
public class BibleVersionResolver {

    private final ScriptureProviderPort scriptureProvider;
    private final YouVersionProperties properties;

    public BibleVersionResolver(ScriptureProviderPort scriptureProvider, YouVersionProperties properties) {
        this.scriptureProvider = scriptureProvider;
        this.properties = properties;
    }

    public int resolveBibleId(String translationCode) {
        List<BibleVersion> versions = scriptureProvider.listBibleVersions(List.of("en"));
        Optional<BibleVersion> match = versions.stream()
                .filter(version -> version.abbreviation().equalsIgnoreCase(translationCode))
                .findFirst();

        if (match.isPresent()) {
            return match.get().id();
        }
        return properties.defaultBibleId();
    }
}

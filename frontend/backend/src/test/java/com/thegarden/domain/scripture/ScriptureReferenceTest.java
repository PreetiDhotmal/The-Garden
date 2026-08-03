package com.thegarden.domain.scripture;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ScriptureReferenceTest {

    @Test
    void buildsASingleVersePassageId() {
        ScriptureReference reference = new ScriptureReference(3034, "JHN", 3, 16, null);
        assertThat(reference.toPassageId()).isEqualTo("JHN.3.16");
    }

    @Test
    void buildsAVerseRangePassageId() {
        ScriptureReference reference = new ScriptureReference(3034, "PRO", 3, 5, 6);
        assertThat(reference.toPassageId()).isEqualTo("PRO.3.5-6");
    }

    @Test
    void treatsAnEqualVerseEndAsASingleVerse() {
        ScriptureReference reference = new ScriptureReference(3034, "JHN", 3, 16, 16);
        assertThat(reference.toPassageId()).isEqualTo("JHN.3.16");
    }

    @Test
    void rejectsABlankBookUsfm() {
        assertThatThrownBy(() -> new ScriptureReference(3034, " ", 3, 16, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsANonPositiveChapter() {
        assertThatThrownBy(() -> new ScriptureReference(3034, "JHN", 0, 16, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsAVerseEndBeforeVerseStart() {
        assertThatThrownBy(() -> new ScriptureReference(3034, "PRO", 3, 6, 5))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void equalReferencesHaveEqualHashCodes() {
        ScriptureReference a = new ScriptureReference(3034, "JHN", 3, 16, null);
        ScriptureReference b = new ScriptureReference(3034, "JHN", 3, 16, null);
        assertThat(a).isEqualTo(b).hasSameHashCodeAs(b);
    }
}

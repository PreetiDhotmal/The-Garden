package com.thegarden.domain.world;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FaithWorldProgressionTest {

    @Test
    void startsWithOnlyTheFirstWorldUnlocked() {
        FaithWorldProgression progression = FaithWorldProgression.startingProgression();

        assertThat(progression.furthestUnlocked()).isEqualTo(FaithWorld.GARDEN_OF_BEGINNINGS);
        assertThat(progression.allUnlocked()).containsExactly(FaithWorld.GARDEN_OF_BEGINNINGS);
        assertThat(progression.isComplete()).isFalse();
    }

    @Test
    void unlocksTheNextWorldInSequence() {
        FaithWorldProgression progression = FaithWorldProgression.startingProgression()
                .unlockNext(FaithWorld.WILDERNESS_OF_TESTING);

        assertThat(progression.furthestUnlocked()).isEqualTo(FaithWorld.WILDERNESS_OF_TESTING);
        assertThat(progression.isUnlocked(FaithWorld.GARDEN_OF_BEGINNINGS)).isTrue();
        assertThat(progression.isUnlocked(FaithWorld.VALLEY_OF_SHADOWS)).isFalse();
    }

    @Test
    void rejectsUnlockingAWorldOutOfSequence() {
        FaithWorldProgression progression = FaithWorldProgression.startingProgression();

        assertThatThrownBy(() -> progression.unlockNext(FaithWorld.VALLEY_OF_SHADOWS))
                .isInstanceOf(OutOfSequenceWorldUnlockException.class);
    }

    @Test
    void rejectsReunlockingTheCurrentWorld() {
        FaithWorldProgression progression = FaithWorldProgression.startingProgression();

        assertThatThrownBy(() -> progression.unlockNext(FaithWorld.GARDEN_OF_BEGINNINGS))
                .isInstanceOf(OutOfSequenceWorldUnlockException.class);
    }

    @Test
    void reportsCompletionOnceEveryWorldIsUnlocked() {
        FaithWorldProgression progression = FaithWorldProgression.startingProgression();
        for (FaithWorld world : List.of(
                FaithWorld.WILDERNESS_OF_TESTING,
                FaithWorld.VALLEY_OF_SHADOWS,
                FaithWorld.MOUNTAIN_OF_REVELATION,
                FaithWorld.RIVER_OF_LIVING_WATER,
                FaithWorld.FIELDS_OF_HARVEST,
                FaithWorld.CITY_OF_LIGHT)) {
            progression = progression.unlockNext(world);
        }

        assertThat(progression.isComplete()).isTrue();
    }

    @Test
    void rebuildsAProgressionFromAContiguousUnlockedList() {
        FaithWorldProgression progression = FaithWorldProgression.fromUnlockedWorlds(List.of(
                FaithWorld.GARDEN_OF_BEGINNINGS,
                FaithWorld.WILDERNESS_OF_TESTING,
                FaithWorld.VALLEY_OF_SHADOWS));

        assertThat(progression.furthestUnlocked()).isEqualTo(FaithWorld.VALLEY_OF_SHADOWS);
    }

    @Test
    void rejectsANonContiguousUnlockedList() {
        assertThatThrownBy(() -> FaithWorldProgression.fromUnlockedWorlds(
                List.of(FaithWorld.GARDEN_OF_BEGINNINGS, FaithWorld.VALLEY_OF_SHADOWS)))
                .isInstanceOf(IllegalArgumentException.class);
    }
}

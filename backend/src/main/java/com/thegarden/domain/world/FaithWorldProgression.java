package com.thegarden.domain.world;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * Domain value object representing a player's progression through the
 * seven symbolic worlds. Immutable — every mutation returns a new
 * instance, keeping the domain model free of hidden state changes.
 *
 * <p>Mirrors the frontend contract:
 * frontend/src/domain/world/FaithWorldProgression.ts
 */
public final class FaithWorldProgression {

    private final List<FaithWorld> unlockedWorlds;

    private FaithWorldProgression(List<FaithWorld> unlockedWorlds) {
        this.unlockedWorlds = Collections.unmodifiableList(unlockedWorlds);
    }

    public static FaithWorldProgression startingProgression() {
        List<FaithWorld> initial = new ArrayList<>();
        initial.add(FaithWorld.ORDERED_WORLDS[0]);
        return new FaithWorldProgression(initial);
    }

    public static FaithWorldProgression fromUnlockedWorlds(List<FaithWorld> unlockedWorlds) {
        Objects.requireNonNull(unlockedWorlds, "unlockedWorlds must not be null");
        if (unlockedWorlds.isEmpty()) {
            throw new IllegalArgumentException("A progression must contain at least the starting world.");
        }
        List<FaithWorld> sorted = new ArrayList<>(unlockedWorlds);
        sorted.sort((a, b) -> Integer.compare(a.ordinal(), b.ordinal()));
        assertContiguous(sorted);
        return new FaithWorldProgression(sorted);
    }

    private static void assertContiguous(List<FaithWorld> sortedWorlds) {
        for (int i = 0; i < sortedWorlds.size(); i++) {
            if (sortedWorlds.get(i).ordinal() != i) {
                throw new IllegalArgumentException(
                        "Unlocked worlds must form a contiguous sequence starting at index 0.");
            }
        }
    }

    public FaithWorld furthestUnlocked() {
        return unlockedWorlds.get(unlockedWorlds.size() - 1);
    }

    public List<FaithWorld> allUnlocked() {
        return unlockedWorlds;
    }

    public boolean isUnlocked(FaithWorld world) {
        return unlockedWorlds.contains(world);
    }

    public boolean isComplete() {
        return unlockedWorlds.size() == FaithWorld.ORDERED_WORLDS.length;
    }

    /**
     * Unlocks the next world in sequence. Throws if the requested world
     * is not the immediate successor of the furthest unlocked world.
     */
    public FaithWorldProgression unlockNext(FaithWorld world) {
        int expectedOrdinal = furthestUnlocked().ordinal() + 1;
        if (world.ordinal() != expectedOrdinal) {
            throw new OutOfSequenceWorldUnlockException(world, furthestUnlocked());
        }
        List<FaithWorld> next = new ArrayList<>(unlockedWorlds);
        next.add(world);
        return new FaithWorldProgression(next);
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof FaithWorldProgression that)) {
            return false;
        }
        return unlockedWorlds.equals(that.unlockedWorlds);
    }

    @Override
    public int hashCode() {
        return unlockedWorlds.hashCode();
    }
}

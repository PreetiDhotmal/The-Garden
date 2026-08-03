package com.thegarden.domain.world;

/**
 * Thrown when a caller attempts to unlock a world out of the required
 * sequence. The seven worlds must be unlocked in symbolic order — a
 * player cannot skip stages of faith.
 */
public class OutOfSequenceWorldUnlockException extends RuntimeException {

    private final FaithWorld attemptedWorld;
    private final FaithWorld furthestUnlocked;

    public OutOfSequenceWorldUnlockException(FaithWorld attemptedWorld, FaithWorld furthestUnlocked) {
        super("Cannot unlock \"%s\" before completing the world preceding it. Furthest unlocked world is \"%s\"."
                .formatted(attemptedWorld, furthestUnlocked));
        this.attemptedWorld = attemptedWorld;
        this.furthestUnlocked = furthestUnlocked;
    }

    public FaithWorld getAttemptedWorld() {
        return attemptedWorld;
    }

    public FaithWorld getFurthestUnlocked() {
        return furthestUnlocked;
    }
}

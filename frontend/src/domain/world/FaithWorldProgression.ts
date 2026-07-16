import { FAITH_WORLDS, faithWorldOrder, type FaithWorld } from "@the-garden/shared-types";

/**
 * Thrown when a caller attempts to unlock a world out of the required
 * sequence. The seven worlds must be unlocked in symbolic order — a
 * player cannot skip stages of faith.
 */
export class OutOfSequenceWorldUnlockError extends Error {
  constructor(
    readonly attemptedWorld: FaithWorld,
    readonly furthestUnlocked: FaithWorld
  ) {
    super(
      `Cannot unlock "${attemptedWorld}" before completing the world preceding it. ` +
        `Furthest unlocked world is "${furthestUnlocked}".`
    );
    this.name = "OutOfSequenceWorldUnlockError";
  }
}

/**
 * Domain value object representing a player's progression through the
 * seven symbolic worlds. Immutable — every mutation returns a new
 * instance, keeping the domain model free of hidden state changes.
 */
export class FaithWorldProgression {
  private constructor(private readonly unlockedWorlds: readonly FaithWorld[]) {}

  static startingProgression(): FaithWorldProgression {
    const firstWorld = FAITH_WORLDS[0];
    return new FaithWorldProgression([firstWorld]);
  }

  static fromUnlockedWorlds(unlockedWorlds: readonly FaithWorld[]): FaithWorldProgression {
    if (unlockedWorlds.length === 0) {
      throw new Error("A progression must contain at least the starting world.");
    }
    const sorted = [...unlockedWorlds].sort((a, b) => faithWorldOrder(a) - faithWorldOrder(b));
    FaithWorldProgression.assertContiguous(sorted);
    return new FaithWorldProgression(sorted);
  }

  private static assertContiguous(sortedWorlds: readonly FaithWorld[]): void {
    for (let i = 0; i < sortedWorlds.length; i += 1) {
      const world = sortedWorlds[i];
      if (world === undefined || faithWorldOrder(world) !== i) {
        throw new Error("Unlocked worlds must form a contiguous sequence starting at index 0.");
      }
    }
  }

  get furthestUnlocked(): FaithWorld {
    const last = this.unlockedWorlds[this.unlockedWorlds.length - 1];
    if (last === undefined) {
      throw new Error("Invariant violated: progression has no unlocked worlds.");
    }
    return last;
  }

  get allUnlocked(): readonly FaithWorld[] {
    return this.unlockedWorlds;
  }

  isUnlocked(world: FaithWorld): boolean {
    return this.unlockedWorlds.includes(world);
  }

  isComplete(): boolean {
    return this.unlockedWorlds.length === FAITH_WORLDS.length;
  }

  /**
   * Unlocks the next world in sequence. Throws if the requested world
   * is not the immediate successor of the furthest unlocked world.
   */
  unlockNext(world: FaithWorld): FaithWorldProgression {
    const expectedIndex = faithWorldOrder(this.furthestUnlocked) + 1;
    if (faithWorldOrder(world) !== expectedIndex) {
      throw new OutOfSequenceWorldUnlockError(world, this.furthestUnlocked);
    }
    return new FaithWorldProgression([...this.unlockedWorlds, world]);
  }
}

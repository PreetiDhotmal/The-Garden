import { describe, expect, it } from "vitest";
import { FaithWorldProgression, OutOfSequenceWorldUnlockError } from "./FaithWorldProgression";

describe("FaithWorldProgression", () => {
  it("starts with only the first world unlocked", () => {
    const progression = FaithWorldProgression.startingProgression();

    expect(progression.furthestUnlocked).toBe("GARDEN_OF_BEGINNINGS");
    expect(progression.allUnlocked).toEqual(["GARDEN_OF_BEGINNINGS"]);
    expect(progression.isComplete()).toBe(false);
  });

  it("unlocks the next world in sequence", () => {
    const progression = FaithWorldProgression.startingProgression().unlockNext(
      "WILDERNESS_OF_TESTING"
    );

    expect(progression.furthestUnlocked).toBe("WILDERNESS_OF_TESTING");
    expect(progression.isUnlocked("GARDEN_OF_BEGINNINGS")).toBe(true);
    expect(progression.isUnlocked("VALLEY_OF_SHADOWS")).toBe(false);
  });

  it("rejects unlocking a world out of sequence", () => {
    const progression = FaithWorldProgression.startingProgression();

    expect(() => progression.unlockNext("VALLEY_OF_SHADOWS")).toThrow(
      OutOfSequenceWorldUnlockError
    );
  });

  it("rejects re-unlocking the current world", () => {
    const progression = FaithWorldProgression.startingProgression();

    expect(() => progression.unlockNext("GARDEN_OF_BEGINNINGS")).toThrow(
      OutOfSequenceWorldUnlockError
    );
  });

  it("reports completion once every world is unlocked", () => {
    let progression = FaithWorldProgression.startingProgression();
    const remaining: readonly string[] = [
      "WILDERNESS_OF_TESTING",
      "VALLEY_OF_SHADOWS",
      "MOUNTAIN_OF_REVELATION",
      "RIVER_OF_LIVING_WATER",
      "FIELDS_OF_HARVEST",
      "CITY_OF_LIGHT",
    ];

    for (const world of remaining) {
      progression = progression.unlockNext(world as Parameters<typeof progression.unlockNext>[0]);
    }

    expect(progression.isComplete()).toBe(true);
  });

  it("rebuilds a progression from a contiguous unlocked list", () => {
    const progression = FaithWorldProgression.fromUnlockedWorlds([
      "GARDEN_OF_BEGINNINGS",
      "WILDERNESS_OF_TESTING",
      "VALLEY_OF_SHADOWS",
    ]);

    expect(progression.furthestUnlocked).toBe("VALLEY_OF_SHADOWS");
  });

  it("rejects a non-contiguous unlocked list", () => {
    expect(() =>
      FaithWorldProgression.fromUnlockedWorlds(["GARDEN_OF_BEGINNINGS", "VALLEY_OF_SHADOWS"])
    ).toThrow();
  });
});

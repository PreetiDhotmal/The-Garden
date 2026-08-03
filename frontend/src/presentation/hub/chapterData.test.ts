import { describe, expect, it } from "vitest";
import { CHAPTER_DEFINITIONS, completedFlag } from "./chapterData";
import {
  WorldProgressionManager,
  WorldProgressionStatus,
} from "@/domain/gameplay/progression/WorldProgressionManager";
import type { WorldProgressionQueryContext } from "@/domain/gameplay/progression/WorldUnlockCondition";

function contextWithFlags(flags: readonly string[]): WorldProgressionQueryContext {
  const flagSet = new Set(flags);
  return {
    getQuestStatus: () => null,
    isScriptureUnlocked: () => false,
    hasStoryFlag: (flag) => flagSet.has(flag),
  };
}

function requireDefined<T>(value: T | undefined, message: string): T {
  if (value === undefined) {
    throw new Error(message);
  }
  return value;
}

describe("CHAPTER_DEFINITIONS sequential progression", () => {
  it("has at least two chapters to actually verify a sequence", () => {
    expect(CHAPTER_DEFINITIONS.length).toBeGreaterThanOrEqual(2);
  });

  it("the first chapter (Communication) has no unlock conditions - always interactable", () => {
    const first = requireDefined(CHAPTER_DEFINITIONS[0], "CHAPTER_DEFINITIONS must be non-empty");
    expect(first.progression.unlockConditions).toEqual([]);
  });

  it("every chapter after the first is gated behind exactly its immediate predecessor's completion flag", () => {
    for (let i = 1; i < CHAPTER_DEFINITIONS.length; i += 1) {
      const previous = requireDefined(CHAPTER_DEFINITIONS[i - 1], `missing chapter at index ${(i - 1).toString()}`);
      const current = requireDefined(CHAPTER_DEFINITIONS[i], `missing chapter at index ${i.toString()}`);
      expect(current.progression.unlockConditions).toEqual([
        { kind: "STORY_FLAG", flag: completedFlag(previous.chapterId) },
      ]);
    }
  });

  it("with no story flags set, only the first chapter is not LOCKED", () => {
    const manager = new WorldProgressionManager();
    manager.registerAll(CHAPTER_DEFINITIONS.map((d) => d.progression));
    const context = contextWithFlags([]);

    const statuses = CHAPTER_DEFINITIONS.map((d) => manager.getStatus(d.progression.worldRegionId, context));

    expect(statuses[0]).not.toBe(WorldProgressionStatus.LOCKED);
    for (let i = 1; i < statuses.length; i += 1) {
      expect(statuses[i]).toBe(WorldProgressionStatus.LOCKED);
    }
  });

  it("completing each chapter in order unlocks exactly the next one, never skipping ahead", () => {
    const manager = new WorldProgressionManager();
    manager.registerAll(CHAPTER_DEFINITIONS.map((d) => d.progression));

    const completedSoFar: string[] = [];
    for (let i = 0; i < CHAPTER_DEFINITIONS.length; i += 1) {
      const context = contextWithFlags(completedSoFar);
      const statuses = CHAPTER_DEFINITIONS.map((d) => manager.getStatus(d.progression.worldRegionId, context));

      // Every chapter up to and including index i must be unlocked (not LOCKED).
      for (let j = 0; j <= i; j += 1) {
        expect(statuses[j]).not.toBe(WorldProgressionStatus.LOCKED);
      }
      // Every chapter after index i must still be LOCKED.
      for (let j = i + 1; j < CHAPTER_DEFINITIONS.length; j += 1) {
        expect(statuses[j]).toBe(WorldProgressionStatus.LOCKED);
      }

      const current = requireDefined(CHAPTER_DEFINITIONS[i], `missing chapter at index ${i.toString()}`);
      completedSoFar.push(completedFlag(current.chapterId));
    }
  });
});

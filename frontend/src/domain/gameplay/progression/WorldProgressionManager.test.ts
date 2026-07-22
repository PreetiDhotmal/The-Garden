import { describe, expect, it } from "vitest";
import type { WorldProgressionQueryContext } from "./WorldUnlockCondition";
import {
  UnknownWorldProgressionEntryError,
  WorldProgressionManager,
  WorldProgressionStatus,
} from "./WorldProgressionManager";

function buildContext(
  overrides: Partial<WorldProgressionQueryContext> = {}
): WorldProgressionQueryContext {
  return {
    getQuestStatus: () => null,
    isScriptureUnlocked: () => false,
    hasStoryFlag: () => false,
    ...overrides,
  };
}

describe("WorldProgressionManager", () => {
  it("reports LOCKED when unlock conditions are not met", () => {
    const manager = new WorldProgressionManager();
    manager.register({
      worldRegionId: "region:wilderness",
      displayName: "Wilderness of Testing",
      unlockConditions: [{ kind: "QUEST_COMPLETED", questId: "quest:garden-of-beginnings-shrines" }],
      completionConditions: [],
      isFutureDlc: false,
    });

    const status = manager.getStatus("region:wilderness", buildContext());

    expect(status).toBe(WorldProgressionStatus.LOCKED);
  });

  it("reports CURRENT once unlocked but not yet completed", () => {
    const manager = new WorldProgressionManager();
    manager.register({
      worldRegionId: "region:wilderness",
      displayName: "Wilderness of Testing",
      unlockConditions: [{ kind: "QUEST_COMPLETED", questId: "quest:garden-of-beginnings-shrines" }],
      completionConditions: [{ kind: "QUEST_COMPLETED", questId: "quest:wilderness-trial" }],
      isFutureDlc: false,
    });

    const status = manager.getStatus(
      "region:wilderness",
      buildContext({
        getQuestStatus: (id) => (id === "quest:garden-of-beginnings-shrines" ? "COMPLETED" : null),
      })
    );

    expect(status).toBe(WorldProgressionStatus.CURRENT);
  });

  it("reports COMPLETED once both unlock and completion conditions are met", () => {
    const manager = new WorldProgressionManager();
    manager.register({
      worldRegionId: "region:wilderness",
      displayName: "Wilderness of Testing",
      unlockConditions: [{ kind: "QUEST_COMPLETED", questId: "quest:a" }],
      completionConditions: [{ kind: "QUEST_COMPLETED", questId: "quest:b" }],
      isFutureDlc: false,
    });

    const status = manager.getStatus(
      "region:wilderness",
      buildContext({ getQuestStatus: () => "COMPLETED" })
    );

    expect(status).toBe(WorldProgressionStatus.COMPLETED);
  });

  it("reports FUTURE_DLC regardless of conditions when marked as such", () => {
    const manager = new WorldProgressionManager();
    manager.register({
      worldRegionId: "region:future-world",
      displayName: "Future World",
      unlockConditions: [],
      completionConditions: [],
      isFutureDlc: true,
    });

    const status = manager.getStatus("region:future-world", buildContext());

    expect(status).toBe(WorldProgressionStatus.FUTURE_DLC);
  });

  it("supports scripture-unlocked and story-flag conditions", () => {
    const manager = new WorldProgressionManager();
    manager.register({
      worldRegionId: "region:sacred",
      displayName: "Sacred Place",
      unlockConditions: [
        { kind: "SCRIPTURE_UNLOCKED", referenceKey: "NIV:John 3:16" },
        { kind: "STORY_FLAG", flag: "met-the-elder" },
      ],
      completionConditions: [],
      isFutureDlc: false,
    });

    const lockedContext = buildContext();
    expect(manager.getStatus("region:sacred", lockedContext)).toBe(WorldProgressionStatus.LOCKED);

    const unlockedContext = buildContext({
      isScriptureUnlocked: () => true,
      hasStoryFlag: () => true,
    });
    expect(manager.getStatus("region:sacred", unlockedContext)).toBe(WorldProgressionStatus.CURRENT);
  });

  it("throws for an unregistered world region", () => {
    const manager = new WorldProgressionManager();
    expect(() => manager.getStatus("region:missing", buildContext())).toThrow(
      UnknownWorldProgressionEntryError
    );
  });

  it("lists every registered world with its computed status", () => {
    const manager = new WorldProgressionManager();
    manager.register({
      worldRegionId: "region:a",
      displayName: "A",
      unlockConditions: [],
      completionConditions: [],
      isFutureDlc: false,
    });
    manager.register({
      worldRegionId: "region:b",
      displayName: "B",
      unlockConditions: [{ kind: "QUEST_COMPLETED", questId: "quest:x" }],
      completionConditions: [],
      isFutureDlc: false,
    });

    const results = manager.listAllWithStatus(buildContext());

    expect(results).toHaveLength(2);
    expect(results.find((r) => r.definition.worldRegionId === "region:a")?.status).toBe(
      WorldProgressionStatus.CURRENT
    );
    expect(results.find((r) => r.definition.worldRegionId === "region:b")?.status).toBe(
      WorldProgressionStatus.LOCKED
    );
  });
});

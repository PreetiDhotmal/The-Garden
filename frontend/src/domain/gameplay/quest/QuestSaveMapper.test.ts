import { describe, expect, it } from "vitest";
import { createQuest } from "./Quest";
import { createQuestObjective } from "./QuestObjective";
import { QuestType, QuestStatus } from "./QuestTypes";
import { createRewardBundle } from "@/domain/gameplay/reward/RewardBundle";
import { applyQuestSave, toQuestSave } from "./QuestSaveMapper";

function buildQuest() {
  return createQuest({
    id: "quest-1",
    type: QuestType.SIDE,
    title: "Test Quest",
    description: "...",
    objectives: [createQuestObjective({ id: "obj-1", description: "Do a thing", targetCount: 3 })],
    rewardBundle: createRewardBundle("reward", []),
  });
}

describe("QuestSaveMapper", () => {
  it("converts a Quest to a QuestSave capturing status/progress/startedAt", () => {
    const quest = {
      ...buildQuest(),
      status: QuestStatus.ACTIVE,
      startedAtIso: "2026-01-01T00:00:00.000Z",
    };
    const save = toQuestSave(quest);

    expect(save).toEqual({
      questId: "quest-1",
      status: QuestStatus.ACTIVE,
      objectives: [{ objectiveId: "obj-1", currentCount: 0 }],
      startedAtIso: "2026-01-01T00:00:00.000Z",
    });
  });

  it("applyQuestSave restores status/progress/startedAt onto a fresh quest definition", () => {
    const freshQuest = buildQuest();
    const firstObjective = freshQuest.objectives[0];
    if (!firstObjective) {
      throw new Error("Test fixture is missing its first objective.");
    }
    const save = toQuestSave({
      ...freshQuest,
      status: QuestStatus.COMPLETED,
      startedAtIso: "2026-01-01T00:00:00.000Z",
      objectives: [{ ...firstObjective, currentCount: 3 }],
    });

    const restored = applyQuestSave(freshQuest, save);

    expect(restored.status).toBe(QuestStatus.COMPLETED);
    expect(restored.startedAtIso).toBe("2026-01-01T00:00:00.000Z");
    expect(restored.objectives[0]?.currentCount).toBe(3);
  });

  it("applyQuestSave leaves quest content (title, description, rewardBundle) untouched", () => {
    const freshQuest = buildQuest();
    const save = toQuestSave({ ...freshQuest, status: QuestStatus.COMPLETED });

    const restored = applyQuestSave(freshQuest, save);

    expect(restored.title).toBe("Test Quest");
    expect(restored.rewardBundle).toBe(freshQuest.rewardBundle);
  });

  it("ignores a saved objective id that no longer exists in the current quest content", () => {
    const freshQuest = buildQuest();
    const firstObjective = freshQuest.objectives[0];
    if (!firstObjective) {
      throw new Error("Test fixture is missing its first objective.");
    }
    const staleObjective = {
      id: "removed-objective",
      description: "x",
      isOptional: false,
      targetCount: 1,
      currentCount: 1,
      objectiveType: firstObjective.objectiveType,
      targetId: null,
    };
    const save = toQuestSave({ ...freshQuest, objectives: [staleObjective] });

    const restored = applyQuestSave(freshQuest, save);

    expect(restored.objectives[0]?.currentCount).toBe(0);
  });
});

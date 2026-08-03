import { describe, expect, it } from "vitest";
import {
  evaluateDialogueCondition,
  InvalidDialogueConditionError,
  type DialogueConditionContext,
} from "./DialogueConditionEvaluator";

function buildContext(
  overrides: Partial<DialogueConditionContext> = {}
): DialogueConditionContext {
  return {
    getQuestStatus: () => null,
    isScriptureUnlocked: () => false,
    hasTalkedToNpc: () => false,
    ...overrides,
  };
}

describe("evaluateDialogueCondition", () => {
  it("evaluates a simple quest status condition", () => {
    const context = buildContext({ getQuestStatus: () => "ACTIVE" });
    expect(evaluateDialogueCondition("quest:some-quest:active", context)).toBe(true);
  });

  it("correctly reconstructs a quest id that itself contains a colon", () => {
    let queriedId: string | null = null;
    const context = buildContext({
      getQuestStatus: (id) => {
        queriedId = id;
        return "COMPLETED";
      },
    });

    evaluateDialogueCondition("quest:quest:garden-of-beginnings-shrines:completed", context);

    expect(queriedId).toBe("quest:garden-of-beginnings-shrines");
  });

  it("correctly reconstructs a scripture reference key that contains a colon", () => {
    let queriedKey: string | null = null;
    const context = buildContext({
      isScriptureUnlocked: (key) => {
        queriedKey = key;
        return true;
      },
    });

    const result = evaluateDialogueCondition("scripture:NIV:John 3:16:unlocked", context);

    expect(queriedKey).toBe("NIV:John 3:16");
    expect(result).toBe(true);
  });

  it("evaluates an npc talked-to condition", () => {
    const context = buildContext({ hasTalkedToNpc: () => true });
    expect(evaluateDialogueCondition("npc:npc:elder:talked-to", context)).toBe(true);
  });

  it("throws for an unrecognized condition kind", () => {
    expect(() => evaluateDialogueCondition("weather:sunny:true", buildContext())).toThrow(
      InvalidDialogueConditionError
    );
  });

  it("throws for a malformed condition with too few segments", () => {
    expect(() => evaluateDialogueCondition("quest:onlyid", buildContext())).toThrow(
      InvalidDialogueConditionError
    );
  });
});

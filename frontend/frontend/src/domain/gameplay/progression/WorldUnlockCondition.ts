export type WorldUnlockCondition =
  | { readonly kind: "QUEST_COMPLETED"; readonly questId: string }
  | { readonly kind: "SCRIPTURE_UNLOCKED"; readonly referenceKey: string }
  | { readonly kind: "STORY_FLAG"; readonly flag: string };

export interface WorldProgressionQueryContext {
  readonly getQuestStatus: (questId: string) => string | null;
  readonly isScriptureUnlocked: (referenceKey: string) => boolean;
  readonly hasStoryFlag: (flag: string) => boolean;
}

export function isConditionSatisfied(
  condition: WorldUnlockCondition,
  context: WorldProgressionQueryContext
): boolean {
  switch (condition.kind) {
    case "QUEST_COMPLETED":
      return context.getQuestStatus(condition.questId) === "COMPLETED";
    case "SCRIPTURE_UNLOCKED":
      return context.isScriptureUnlocked(condition.referenceKey);
    case "STORY_FLAG":
      return context.hasStoryFlag(condition.flag);
    default: {
      const exhaustiveCheck: never = condition;
      throw new Error(`Unhandled world unlock condition: ${String(exhaustiveCheck)}`);
    }
  }
}

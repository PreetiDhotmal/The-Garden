export interface DialogueConditionContext {
  readonly getQuestStatus: (questId: string) => string | null;
  readonly isScriptureUnlocked: (referenceKey: string) => boolean;
  readonly hasTalkedToNpc: (npcId: string) => boolean;
}

export class InvalidDialogueConditionError extends Error {
  constructor(readonly condition: string) {
    super(`Could not parse dialogue condition: "${condition}"`);
    this.name = "InvalidDialogueConditionError";
  }
}

/**
 * Condition strings are colon-delimited: "quest:<id>:<status>",
 * "scripture:<referenceKey>:unlocked", "npc:<id>:talked-to". IDs
 * throughout this codebase are themselves colon-formatted (e.g.
 * "quest:garden-of-beginnings-shrines", or a scripture reference key
 * like "NIV:John 3:16") — so parsing takes the FIRST segment as the
 * condition kind and the LAST segment as the status/suffix, rejoining
 * everything between as the id. A naive 3-part split would break the
 * instant an id contains its own colon, which every id here does.
 */
export function evaluateDialogueCondition(
  condition: string,
  context: DialogueConditionContext
): boolean {
  const parts = condition.split(":");
  if (parts.length < 3) {
    throw new InvalidDialogueConditionError(condition);
  }

  const kind = parts[0];
  const suffix = parts[parts.length - 1];
  const id = parts.slice(1, -1).join(":");

  if (kind === "quest") {
    return context.getQuestStatus(id) === suffix?.toUpperCase();
  }
  if (kind === "scripture" && suffix === "unlocked") {
    return context.isScriptureUnlocked(id);
  }
  if (kind === "npc" && suffix === "talked-to") {
    return context.hasTalkedToNpc(id);
  }

  throw new InvalidDialogueConditionError(condition);
}

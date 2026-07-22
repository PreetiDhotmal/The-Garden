import { QuestObjectiveType } from "./QuestObjectiveType";

export interface QuestObjective {
  readonly id: string;
  readonly description: string;
  readonly isOptional: boolean;
  readonly targetCount: number;
  readonly currentCount: number;
  readonly objectiveType: QuestObjectiveType;
  /** The NPC id / collectible id / trigger id / scripture reference key this objective is about, if any — used by auto-progression wiring (NpcManager, CollectibleManager, TriggerVolumeManager). Null for objectives progressed manually. */
  readonly targetId: string | null;
}

export class InvalidQuestObjectiveError extends Error {
  constructor(reason: string) {
    super(`Invalid quest objective: ${reason}`);
    this.name = "InvalidQuestObjectiveError";
  }
}

export interface CreateQuestObjectiveInput {
  readonly id: string;
  readonly description: string;
  readonly isOptional?: boolean;
  readonly targetCount?: number;
  readonly objectiveType?: QuestObjectiveType;
  readonly targetId?: string | null;
}

export function createQuestObjective(input: CreateQuestObjectiveInput): QuestObjective {
  if (input.id.trim().length === 0) {
    throw new InvalidQuestObjectiveError("id must not be empty");
  }
  const targetCount = input.targetCount ?? 1;
  if (targetCount <= 0) {
    throw new InvalidQuestObjectiveError("targetCount must be greater than zero");
  }
  return {
    id: input.id,
    description: input.description,
    isOptional: input.isOptional ?? false,
    targetCount,
    currentCount: 0,
    objectiveType: input.objectiveType ?? QuestObjectiveType.MULTI_STEP,
    targetId: input.targetId ?? null,
  };
}

export function isObjectiveComplete(objective: QuestObjective): boolean {
  return objective.currentCount >= objective.targetCount;
}

export function progressObjective(objective: QuestObjective, amount = 1): QuestObjective {
  if (amount < 0) {
    throw new InvalidQuestObjectiveError("progress amount must not be negative");
  }
  return {
    ...objective,
    currentCount: Math.min(objective.targetCount, objective.currentCount + amount),
  };
}

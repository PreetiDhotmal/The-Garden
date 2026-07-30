import { QuestObjectiveType } from "./QuestObjectiveType";

/** Refines isOptional (unchanged, still the completion-gating field QuestProgress reads) — this is purely a UI/ordering hint distinguishing "the point of the level" from "worth doing but secondary." */
export enum ObjectivePriority {
  PRIMARY = "PRIMARY",
  SECONDARY = "SECONDARY",
}

export interface QuestObjective {
  readonly id: string;
  readonly description: string;
  readonly isOptional: boolean;
  readonly targetCount: number;
  readonly currentCount: number;
  readonly objectiveType: QuestObjectiveType;
  /** The NPC id / collectible id / trigger id / scripture reference key this objective is about, if any — used by auto-progression wiring (NpcManager, CollectibleManager, TriggerVolumeManager). Null for objectives progressed manually. */
  readonly targetId: string | null;
  /** UI/ordering hint only — does not affect isOptional's completion-gating behavior at all. Defaults to PRIMARY. */
  readonly priority: ObjectivePriority;
  /** Not shown in objective UI (QuestTracker, Journal) until revealed — for GDD-style "hidden objective" secrets. Progress can still be tracked/persisted while hidden. */
  readonly isHidden: boolean;
  /** IDs of other objectives (within the same quest) that must be complete before this one can be progressed — the dependency-graph requirement. Empty array means no dependency (available immediately, i.e. "parallel" with any objective that also has no unmet dependency on it). */
  readonly dependsOnObjectiveIds: readonly string[];
  /** Real-time seconds this objective must be completed within, measured from when it becomes available (all its dependencies are satisfied) — null means untimed. Enforcement lives in ObjectiveManager, not here; this is pure data. */
  readonly timeLimitSeconds: number | null;
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
  readonly priority?: ObjectivePriority;
  readonly isHidden?: boolean;
  readonly dependsOnObjectiveIds?: readonly string[];
  readonly timeLimitSeconds?: number | null;
}

export function createQuestObjective(input: CreateQuestObjectiveInput): QuestObjective {
  if (input.id.trim().length === 0) {
    throw new InvalidQuestObjectiveError("id must not be empty");
  }
  const targetCount = input.targetCount ?? 1;
  if (targetCount <= 0) {
    throw new InvalidQuestObjectiveError("targetCount must be greater than zero");
  }
  if (input.timeLimitSeconds !== undefined && input.timeLimitSeconds !== null && input.timeLimitSeconds <= 0) {
    throw new InvalidQuestObjectiveError("timeLimitSeconds must be greater than zero when set");
  }
  return {
    id: input.id,
    description: input.description,
    isOptional: input.isOptional ?? false,
    targetCount,
    currentCount: 0,
    objectiveType: input.objectiveType ?? QuestObjectiveType.MULTI_STEP,
    targetId: input.targetId ?? null,
    priority: input.priority ?? ObjectivePriority.PRIMARY,
    isHidden: input.isHidden ?? false,
    dependsOnObjectiveIds: input.dependsOnObjectiveIds ?? [],
    timeLimitSeconds: input.timeLimitSeconds ?? null,
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

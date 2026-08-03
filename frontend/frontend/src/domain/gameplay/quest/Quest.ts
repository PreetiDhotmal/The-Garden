import type { RewardBundle } from "@/domain/gameplay/reward/RewardBundle";
import type { QuestCheckpoint } from "./QuestCheckpoint";
import type { QuestDependency } from "./QuestDependency";
import type { QuestObjective } from "./QuestObjective";
import { QuestStatus, QuestType } from "./QuestTypes";

export interface Quest {
  readonly id: string;
  readonly type: QuestType;
  readonly title: string;
  readonly description: string;
  readonly objectives: readonly QuestObjective[];
  readonly dependencies: readonly QuestDependency[];
  readonly checkpoints: readonly QuestCheckpoint[];
  readonly rewardBundle: RewardBundle;
  readonly status: QuestStatus;
  /** Objectives must complete in array order. If false, any order (or any single one, for a "collect N of M" style quest) counts. */
  readonly isSequential: boolean;
  /** Wall-clock seconds allowed since the quest started, for TIMED quests. Null for all other types. */
  readonly timeLimitSeconds: number | null;
  readonly startedAtIso: string | null;
}

export class InvalidQuestError extends Error {
  constructor(reason: string) {
    super(`Invalid quest: ${reason}`);
    this.name = "InvalidQuestError";
  }
}

export interface CreateQuestInput {
  readonly id: string;
  readonly type: QuestType;
  readonly title: string;
  readonly description: string;
  readonly objectives: readonly QuestObjective[];
  readonly dependencies?: readonly QuestDependency[];
  readonly checkpoints?: readonly QuestCheckpoint[];
  readonly rewardBundle: RewardBundle;
  readonly isSequential?: boolean;
  readonly timeLimitSeconds?: number | null;
}

export function createQuest(input: CreateQuestInput): Quest {
  if (input.id.trim().length === 0) {
    throw new InvalidQuestError("id must not be empty");
  }
  if (input.objectives.length === 0) {
    throw new InvalidQuestError("a quest needs at least one objective");
  }
  if (input.type === QuestType.TIMED && (!input.timeLimitSeconds || input.timeLimitSeconds <= 0)) {
    throw new InvalidQuestError("TIMED quests require a positive timeLimitSeconds");
  }

  return {
    id: input.id,
    type: input.type,
    title: input.title,
    description: input.description,
    objectives: input.objectives,
    dependencies: input.dependencies ?? [],
    checkpoints: input.checkpoints ?? [],
    rewardBundle: input.rewardBundle,
    status: input.dependencies?.length ? QuestStatus.LOCKED : QuestStatus.AVAILABLE,
    isSequential: input.isSequential ?? false,
    timeLimitSeconds: input.type === QuestType.TIMED ? (input.timeLimitSeconds ?? null) : null,
    startedAtIso: null,
  };
}

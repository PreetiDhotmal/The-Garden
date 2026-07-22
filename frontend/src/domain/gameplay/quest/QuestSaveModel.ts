import type { QuestStatus } from "./QuestTypes";

export interface QuestObjectiveSave {
  readonly objectiveId: string;
  readonly currentCount: number;
}

export interface QuestSave {
  readonly questId: string;
  readonly status: QuestStatus;
  readonly objectives: readonly QuestObjectiveSave[];
  readonly startedAtIso: string | null;
}

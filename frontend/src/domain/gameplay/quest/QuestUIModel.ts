import type { QuestStatus } from "./QuestTypes";
import type { Quest } from "./Quest";
import { currentSequentialObjective, questProgressFraction } from "./QuestProgress";

export interface QuestObjectiveSummary {
  readonly text: string;
  readonly isComplete: boolean;
  readonly isOptional: boolean;
}

export interface QuestUIModel {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: QuestStatus;
  readonly progressFraction: number;
  readonly currentObjectiveText: string | null;
  readonly objectiveSummaries: readonly QuestObjectiveSummary[];
}

export function buildQuestUIModel(quest: Quest): QuestUIModel {
  const sequentialObjective = currentSequentialObjective(quest);
  return {
    id: quest.id,
    title: quest.title,
    description: quest.description,
    status: quest.status,
    progressFraction: questProgressFraction(quest),
    currentObjectiveText: sequentialObjective?.description ?? null,
    objectiveSummaries: quest.objectives.map((objective) => ({
      text: objective.description,
      isComplete: objective.currentCount >= objective.targetCount,
      isOptional: objective.isOptional,
    })),
  };
}

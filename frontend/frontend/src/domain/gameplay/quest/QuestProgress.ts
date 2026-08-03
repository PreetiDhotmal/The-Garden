import { isObjectiveComplete, type QuestObjective } from "./QuestObjective";
import type { Quest } from "./Quest";

export function requiredObjectives(quest: Quest): readonly QuestObjective[] {
  return quest.objectives.filter((objective) => !objective.isOptional);
}

export function completedObjectiveCount(quest: Quest): number {
  return quest.objectives.filter(isObjectiveComplete).length;
}

export function requiredObjectivesComplete(quest: Quest): boolean {
  return requiredObjectives(quest).every(isObjectiveComplete);
}

/** 0-1 fraction across required objectives only — optional objectives don't affect overall quest progress. */
export function questProgressFraction(quest: Quest): number {
  const required = requiredObjectives(quest);
  if (required.length === 0) {
    return 1;
  }
  const completed = required.filter(isObjectiveComplete).length;
  return completed / required.length;
}

/** In a sequential quest, the first not-yet-complete objective — the one the player should currently be working on. */
export function currentSequentialObjective(quest: Quest): QuestObjective | null {
  if (!quest.isSequential) {
    return null;
  }
  return quest.objectives.find((objective) => !isObjectiveComplete(objective)) ?? null;
}

import type { Quest } from "./Quest";
import type { QuestSave } from "./QuestSaveModel";

export function toQuestSave(quest: Quest): QuestSave {
  return {
    questId: quest.id,
    status: quest.status,
    objectives: quest.objectives.map((objective) => ({
      objectiveId: objective.id,
      currentCount: objective.currentCount,
    })),
    startedAtIso: quest.startedAtIso,
  };
}

/**
 * Applies saved mutable state onto a freshly-registered Quest
 * definition. `quest` must already exist in the registry (registered
 * from game content, same as any fresh game start) — this only
 * restores status/progress/startedAt, never quest content itself, so
 * a content update between sessions doesn't corrupt save data.
 */
export function applyQuestSave(quest: Quest, save: QuestSave): Quest {
  return {
    ...quest,
    status: save.status,
    startedAtIso: save.startedAtIso,
    objectives: quest.objectives.map((objective) => {
      const savedObjective = save.objectives.find(
        (candidate) => candidate.objectiveId === objective.id
      );
      return savedObjective ? { ...objective, currentCount: savedObjective.currentCount } : objective;
    }),
  };
}

import type { QuestObjective } from "@/domain/gameplay/quest/QuestObjective";

export interface PuzzleStage {
  readonly stageId: string;
  readonly description: string;
  /** A factory, not a static array — every attempt at this stage (including after a reset) needs a genuinely fresh set of objectives, matching LevelManager's own established convention for the same reason. */
  readonly createObjectives: () => readonly QuestObjective[];
  /** Reached-checkpoint id (CheckpointManager, reused unchanged) once this stage completes — "checkpoint after every completed puzzle" from the brief, expressed as data. */
  readonly checkpointId: string;
}

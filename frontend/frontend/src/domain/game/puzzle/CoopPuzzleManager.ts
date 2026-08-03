import type { GameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import { isObjectiveComplete } from "@/domain/gameplay/quest/QuestObjective";
import type { CheckpointManager } from "@/domain/world/checkpoint/CheckpointManager";
import { ObjectiveManager } from "@/domain/game/ObjectiveManager";
import type { PuzzleStage } from "./PuzzleStage";
import { PuzzleState } from "./PuzzleState";

export class UnknownPuzzleStageError extends Error {
  constructor(readonly stageId: string) {
    super(`No puzzle stage with id "${stageId}" is registered for this level.`);
    this.name = "UnknownPuzzleStageError";
  }
}

export class NoActivePuzzleLevelError extends Error {
  constructor() {
    super("No puzzle level is currently active — call startLevel() first.");
    this.name = "NoActivePuzzleLevelError";
  }
}

/**
 * The single reusable sequencer every relationship level (Communication,
 * Trust, Sacrifice, Forgiveness, ...) is meant to reuse verbatim —
 * this class contains no knowledge of what a "symbol dial" or a
 * "mirror" is. A level is entirely described by an ordered
 * PuzzleStage[] handed to startLevel(); everything about what a stage
 * actually IS (its 3D mechanism, its objectives) is level content,
 * built on top of this class, never inside it.
 *
 * Reuses, never duplicates: ObjectiveManager (fresh instance per
 * stage attempt — ties into QuestObjective exactly like LevelManager
 * already does, since "Player A sees symbols, Player B flips
 * switches, coordinating completes it" is structurally the same
 * split-information-objective shape already proven for Genesis
 * Garden's aqueduct puzzle), CheckpointManager (checkpoint id from
 * each stage's own data, no new checkpoint concept), and
 * GameplayEventBus (puzzle:stage-completed / puzzle:attempt-missed /
 * puzzle:level-completed, added additively — no parallel event bus).
 */
export class CoopPuzzleManager {
  private stages: readonly PuzzleStage[] = [];
  private levelId: string | null = null;
  private currentStageIndex = 0;
  private currentObjectiveManager: ObjectiveManager | null = null;
  private state: PuzzleState = PuzzleState.NOT_STARTED;

  constructor(
    private readonly checkpointManager: CheckpointManager,
    private readonly eventBus: GameplayEventBus
  ) {}

  /** Begins (or resumes, via startAtStageId) a level's puzzle sequence. */
  startLevel(levelId: string, stages: readonly PuzzleStage[], startAtStageId?: string): void {
    this.levelId = levelId;
    this.stages = stages;
    this.state = PuzzleState.IN_PROGRESS;
    const startIndex = startAtStageId
      ? stages.findIndex((stage) => stage.stageId === startAtStageId)
      : 0;
    this.currentStageIndex = startIndex >= 0 ? startIndex : 0;
    this.beginCurrentStageAttempt();
  }

  getState(): PuzzleState {
    return this.state;
  }

  getCurrentStage(): PuzzleStage {
    if (!this.levelId || this.stages.length === 0) {
      throw new NoActivePuzzleLevelError();
    }
    const stage = this.stages[this.currentStageIndex];
    if (!stage) {
      throw new NoActivePuzzleLevelError();
    }
    return stage;
  }

  getObjectiveManager(): ObjectiveManager {
    if (!this.currentObjectiveManager) {
      throw new NoActivePuzzleLevelError();
    }
    return this.currentObjectiveManager;
  }

  /** True once every objective in the current stage is complete. */
  isCurrentStageComplete(): boolean {
    return this.getObjectiveManager().listAll().every(isObjectiveComplete);
  }

  /**
   * Call after any objective progress on the current stage. If the
   * stage is now fully solved: marks the stage's checkpoint (reusing
   * CheckpointManager exactly), emits puzzle:stage-completed, and
   * either advances to the next stage or completes the level.
   */
  checkStageCompletion(): void {
    if (!this.isCurrentStageComplete()) {
      return;
    }
    const stage = this.getCurrentStage();
    const levelId = this.requireLevelId();
    this.checkpointManager.reach(stage.checkpointId);
    this.eventBus.emit("puzzle:stage-completed", { levelId, stageId: stage.stageId });

    if (this.currentStageIndex >= this.stages.length - 1) {
      this.state = PuzzleState.COMPLETE;
      this.eventBus.emit("puzzle:level-completed", { levelId });
      return;
    }
    this.currentStageIndex += 1;
    this.beginCurrentStageAttempt();
  }

  /**
   * Call when a player's mechanism input is WRONG (per the brief's
   * Part 4: "No punishment... fun, surprise, small animations, light
   * humor, then instantly reset"). Deliberately does NOT touch
   * puzzle/level state, checkpoints, or objective progress on other
   * stages — only the current stage's own attempt resets, via a fresh
   * ObjectiveManager, exactly mirroring LevelManager.restartLevel()'s
   * own reasoning for why a fresh instance (not a reset method) is
   * the correct way to guarantee a clean attempt.
   */
  recordMissedAttempt(): void {
    const stage = this.getCurrentStage();
    const levelId = this.requireLevelId();
    this.eventBus.emit("puzzle:attempt-missed", { levelId, stageId: stage.stageId });
    this.beginCurrentStageAttempt();
  }

  private beginCurrentStageAttempt(): void {
    const stage = this.getCurrentStage();
    const levelId = this.requireLevelId();
    this.currentObjectiveManager = new ObjectiveManager(
      levelId,
      stage.createObjectives(),
      this.eventBus
    );
  }

  private requireLevelId(): string {
    if (!this.levelId) {
      throw new NoActivePuzzleLevelError();
    }
    return this.levelId;
  }
}

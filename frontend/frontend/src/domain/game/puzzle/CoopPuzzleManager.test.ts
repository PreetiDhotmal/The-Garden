import { describe, expect, it, vi } from "vitest";
import { createGameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import { createQuestObjective, progressObjective } from "@/domain/gameplay/quest/QuestObjective";
import { CheckpointManager } from "@/domain/world/checkpoint/CheckpointManager";
import { createWorldEventBus } from "@/domain/world/events/WorldEventBus";
import { CoopPuzzleManager, NoActivePuzzleLevelError } from "./CoopPuzzleManager";
import { PuzzleState } from "./PuzzleState";
import type { PuzzleStage } from "./PuzzleStage";

function buildStages(): readonly PuzzleStage[] {
  return [
    {
      stageId: "stage:one",
      description: "First stage",
      checkpointId: "checkpoint:stage-one",
      createObjectives: () => [createQuestObjective({ id: "obj:one", description: "Solve one" })],
    },
    {
      stageId: "stage:two",
      description: "Second stage",
      checkpointId: "checkpoint:stage-two",
      createObjectives: () => [createQuestObjective({ id: "obj:two", description: "Solve two" })],
    },
  ];
}

function buildManager() {
  const eventBus = createGameplayEventBus();
  const checkpointManager = new CheckpointManager(createWorldEventBus());
  const manager = new CoopPuzzleManager(checkpointManager, eventBus);
  return { manager, eventBus, checkpointManager };
}

describe("CoopPuzzleManager", () => {
  it("throws before startLevel has been called", () => {
    const { manager } = buildManager();
    expect(() => manager.getCurrentStage()).toThrow(NoActivePuzzleLevelError);
  });

  it("starts at the first stage by default", () => {
    const { manager } = buildManager();
    manager.startLevel("level:test", buildStages());
    expect(manager.getCurrentStage().stageId).toBe("stage:one");
    expect(manager.getState()).toBe(PuzzleState.IN_PROGRESS);
  });

  it("can resume at a specific stage id", () => {
    const { manager } = buildManager();
    manager.startLevel("level:test", buildStages(), "stage:two");
    expect(manager.getCurrentStage().stageId).toBe("stage:two");
  });

  it("checkStageCompletion does nothing while the stage's objectives are incomplete", () => {
    const { manager } = buildManager();
    manager.startLevel("level:test", buildStages());
    manager.checkStageCompletion();
    expect(manager.getCurrentStage().stageId).toBe("stage:one");
  });

  it("advances to the next stage once the current stage's objectives complete", () => {
    const { manager } = buildManager();
    manager.startLevel("level:test", buildStages());
    const [objective] = manager.getObjectiveManager().listAll();
    if (!objective) {
      throw new Error("Test fixture missing expected objective.");
    }
    manager.getObjectiveManager().sync([progressObjective(objective, 1)]);

    manager.checkStageCompletion();

    expect(manager.getCurrentStage().stageId).toBe("stage:two");
    expect(manager.getState()).toBe(PuzzleState.IN_PROGRESS);
  });

  it("reaches PuzzleState.COMPLETE once the final stage completes", () => {
    const { manager } = buildManager();
    manager.startLevel("level:test", buildStages(), "stage:two");
    const [objective] = manager.getObjectiveManager().listAll();
    if (!objective) {
      throw new Error("Test fixture missing expected objective.");
    }
    manager.getObjectiveManager().sync([progressObjective(objective, 1)]);

    manager.checkStageCompletion();

    expect(manager.getState()).toBe(PuzzleState.COMPLETE);
  });

  it("marks the stage's checkpoint via the real CheckpointManager on completion", () => {
    const { manager, checkpointManager } = buildManager();
    manager.startLevel("level:test", buildStages());
    const [objective] = manager.getObjectiveManager().listAll();
    if (!objective) {
      throw new Error("Test fixture missing expected objective.");
    }
    manager.getObjectiveManager().sync([progressObjective(objective, 1)]);

    manager.checkStageCompletion();

    expect(checkpointManager.hasReached("checkpoint:stage-one")).toBe(true);
  });

  it("emits puzzle:stage-completed and puzzle:level-completed at the right times", () => {
    const { manager, eventBus } = buildManager();
    const stageListener = vi.fn();
    const levelListener = vi.fn();
    eventBus.on("puzzle:stage-completed", stageListener);
    eventBus.on("puzzle:level-completed", levelListener);
    manager.startLevel("level:test", buildStages());

    const [firstObjective] = manager.getObjectiveManager().listAll();
    if (!firstObjective) {
      throw new Error("Test fixture missing expected objective.");
    }
    manager.getObjectiveManager().sync([progressObjective(firstObjective, 1)]);
    manager.checkStageCompletion();

    expect(stageListener).toHaveBeenCalledWith({ levelId: "level:test", stageId: "stage:one" });
    expect(levelListener).not.toHaveBeenCalled();

    const [secondObjective] = manager.getObjectiveManager().listAll();
    if (!secondObjective) {
      throw new Error("Test fixture missing expected objective.");
    }
    manager.getObjectiveManager().sync([progressObjective(secondObjective, 1)]);
    manager.checkStageCompletion();

    expect(levelListener).toHaveBeenCalledWith({ levelId: "level:test" });
  });

  it("recordMissedAttempt resets the current stage's objectives without advancing or touching state", () => {
    const { manager } = buildManager();
    manager.startLevel("level:test", buildStages());

    manager.recordMissedAttempt();

    expect(manager.getCurrentStage().stageId).toBe("stage:one");
    expect(manager.getState()).toBe(PuzzleState.IN_PROGRESS);
    expect(manager.getObjectiveManager().listAll()[0]?.currentCount).toBe(0);
  });

  it("recordMissedAttempt emits puzzle:attempt-missed, not a failure/stage-completed event", () => {
    const { manager, eventBus } = buildManager();
    const missedListener = vi.fn();
    const completedListener = vi.fn();
    eventBus.on("puzzle:attempt-missed", missedListener);
    eventBus.on("puzzle:stage-completed", completedListener);
    manager.startLevel("level:test", buildStages());

    manager.recordMissedAttempt();

    expect(missedListener).toHaveBeenCalledWith({ levelId: "level:test", stageId: "stage:one" });
    expect(completedListener).not.toHaveBeenCalled();
  });

  it("a missed attempt on a later stage does not affect an earlier stage's already-marked checkpoint", () => {
    const { manager, checkpointManager } = buildManager();
    manager.startLevel("level:test", buildStages());
    const [firstObjective] = manager.getObjectiveManager().listAll();
    if (!firstObjective) {
      throw new Error("Test fixture missing expected objective.");
    }
    manager.getObjectiveManager().sync([progressObjective(firstObjective, 1)]);
    manager.checkStageCompletion();

    manager.recordMissedAttempt();

    expect(checkpointManager.hasReached("checkpoint:stage-one")).toBe(true);
    expect(manager.getCurrentStage().stageId).toBe("stage:two");
  });
});

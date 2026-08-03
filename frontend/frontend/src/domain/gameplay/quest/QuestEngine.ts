import type { GameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import type { RewardEngine } from "@/domain/gameplay/reward/RewardEngine";
import type { Quest } from "./Quest";
import { isDependencySatisfied } from "./QuestDependency";
import { isObjectiveComplete, progressObjective } from "./QuestObjective";
import { requiredObjectivesComplete } from "./QuestProgress";
import type { QuestRegistry } from "./QuestRegistry";
import { QuestStatus } from "./QuestTypes";

export class QuestNotAvailableError extends Error {
  constructor(
    readonly questId: string,
    readonly actualStatus: QuestStatus
  ) {
    super(`Quest "${questId}" cannot be started from status ${actualStatus} (must be AVAILABLE or ACCEPTED).`);
    this.name = "QuestNotAvailableError";
  }
}

export class QuestNotActiveError extends Error {
  constructor(
    readonly questId: string,
    readonly actualStatus: QuestStatus
  ) {
    super(`Quest "${questId}" is not ACTIVE (currently ${actualStatus}).`);
    this.name = "QuestNotActiveError";
  }
}

/**
 * Orchestrates every quest state transition. This is the only class
 * that mutates quest status — objectives progress, dependencies gate
 * availability, completion grants the reward bundle through
 * RewardEngine, and every transition emits a gameplay event so other
 * systems (UI, achievements, a future NPC reacting to quest state)
 * never need to poll.
 */
export class QuestEngine {
  constructor(
    private readonly registry: QuestRegistry,
    private readonly eventBus: GameplayEventBus,
    private readonly rewardEngine: RewardEngine
  ) {}

  /** Re-evaluates every LOCKED quest's dependencies, unlocking (to AVAILABLE) any now satisfied. Call after any quest completes. */
  refreshAvailability(): void {
    const statusOf = (questId: string): QuestStatus | undefined =>
      this.registry.has(questId) ? this.registry.get(questId).status : undefined;

    for (const quest of this.registry.list()) {
      if (quest.status !== QuestStatus.LOCKED) {
        continue;
      }
      const allSatisfied = quest.dependencies.every((dependency) =>
        isDependencySatisfied(dependency, statusOf)
      );
      if (allSatisfied) {
        this.registry.update({ ...quest, status: QuestStatus.AVAILABLE });
      }
    }
  }

  /**
   * NPC-offered quests go AVAILABLE -> ACCEPTED (this) -> ACTIVE (start()).
   * Quests reached via the original Milestone 4 flow (e.g. a Scripture
   * Stone) can skip straight to start() from AVAILABLE, unaffected —
   * this is purely an additive alternate entry point.
   */
  accept(questId: string): Quest {
    const quest = this.registry.get(questId);
    if (quest.status !== QuestStatus.AVAILABLE) {
      throw new QuestNotAvailableError(questId, quest.status);
    }
    const accepted: Quest = { ...quest, status: QuestStatus.ACCEPTED };
    this.registry.update(accepted);
    this.eventBus.emit("quest:accepted", { questId });
    return accepted;
  }

  start(questId: string): Quest {
    const quest = this.registry.get(questId);
    if (quest.status !== QuestStatus.AVAILABLE && quest.status !== QuestStatus.ACCEPTED) {
      throw new QuestNotAvailableError(questId, quest.status);
    }
    const started: Quest = {
      ...quest,
      status: QuestStatus.ACTIVE,
      startedAtIso: new Date().toISOString(),
    };
    this.registry.update(started);
    this.eventBus.emit("quest:started", { questId });
    return started;
  }

  /** Progresses one objective by `amount`, then re-evaluates checkpoints and completion. */
  progressObjective(questId: string, objectiveId: string, amount = 1): Quest {
    const quest = this.registry.get(questId);
    if (quest.status !== QuestStatus.ACTIVE) {
      throw new QuestNotActiveError(questId, quest.status);
    }

    const objectiveExists = quest.objectives.some((objective) => objective.id === objectiveId);
    const nextObjectives = quest.objectives.map((objective) =>
      objective.id === objectiveId ? progressObjective(objective, amount) : objective
    );

    let updated: Quest = { ...quest, objectives: nextObjectives };
    this.registry.update(updated);

    if (objectiveExists) {
      const progressedObjective = nextObjectives.find((objective) => objective.id === objectiveId);
      if (progressedObjective) {
        this.eventBus.emit("quest:objective-progressed", {
          questId,
          objectiveId,
          currentCount: progressedObjective.currentCount,
          targetCount: progressedObjective.targetCount,
        });
        this.checkCheckpoints(updated, progressedObjective.id, isObjectiveComplete(progressedObjective));
      }
    }

    if (requiredObjectivesComplete(updated)) {
      updated = this.complete(updated.id);
    }

    return updated;
  }

  private checkCheckpoints(quest: Quest, completedObjectiveId: string, isComplete: boolean): void {
    if (!isComplete) {
      return;
    }
    const checkpoint = quest.checkpoints.find(
      (candidate) => candidate.reachedAtObjectiveId === completedObjectiveId
    );
    if (checkpoint) {
      this.eventBus.emit("quest:checkpoint-reached", { questId: quest.id, checkpointId: checkpoint.id });
    }
  }

  complete(questId: string): Quest {
    const quest = this.registry.get(questId);
    const completed: Quest = { ...quest, status: QuestStatus.COMPLETED };
    this.registry.update(completed);
    this.eventBus.emit("quest:completed", { questId });
    this.rewardEngine.grant(quest.rewardBundle);
    this.refreshAvailability();
    return completed;
  }

  /**
   * Reward is already granted at complete() time (unchanged from
   * Milestone 4) — this only marks that the player has explicitly
   * acknowledged/claimed it, e.g. after tapping "Claim" in a dialogue
   * or quest-log UI. Purely a status/UI concern, not a second grant.
   */
  claimReward(questId: string): Quest {
    const quest = this.registry.get(questId);
    if (quest.status !== QuestStatus.COMPLETED) {
      throw new QuestNotActiveError(questId, quest.status);
    }
    const claimed: Quest = { ...quest, status: QuestStatus.REWARD_CLAIMED };
    this.registry.update(claimed);
    this.eventBus.emit("quest:reward-claimed", { questId });
    return claimed;
  }

  fail(questId: string, reason: string): Quest {
    const quest = this.registry.get(questId);
    const failed: Quest = { ...quest, status: QuestStatus.FAILED };
    this.registry.update(failed);
    this.eventBus.emit("quest:failed", { questId, reason });
    return failed;
  }

  /** For TIMED quests: call periodically (e.g. once per second) with elapsed game time to auto-fail on timeout. */
  checkTimeLimit(questId: string, nowIso: string): void {
    const quest = this.registry.get(questId);
    if (quest.status !== QuestStatus.ACTIVE || quest.timeLimitSeconds === null || !quest.startedAtIso) {
      return;
    }
    const elapsedSeconds = (new Date(nowIso).getTime() - new Date(quest.startedAtIso).getTime()) / 1000;
    if (elapsedSeconds > quest.timeLimitSeconds) {
      this.fail(questId, "Time limit exceeded.");
    }
  }
}

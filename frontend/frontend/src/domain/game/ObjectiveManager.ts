import type { GameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import { isObjectiveComplete, type QuestObjective } from "@/domain/gameplay/quest/QuestObjective";

export class UnknownObjectiveError extends Error {
  constructor(readonly objectiveId: string) {
    super(`No objective with id "${objectiveId}" is tracked by this ObjectiveManager.`);
    this.name = "UnknownObjectiveError";
  }
}

/**
 * Sits on top of QuestEngine/QuestObjective (reused, not duplicated)
 * — QuestEngine still owns actual progress mutation and reward
 * granting. ObjectiveManager answers the structural questions
 * QuestEngine was never meant to: is this objective's dependency
 * graph satisfied yet (so it's actually available to progress), is
 * its timer still running, should it currently be visible in UI.
 * Nothing here mutates a QuestObjective's currentCount — that
 * remains QuestEngine's sole responsibility.
 */
export class ObjectiveManager {
  private readonly objectivesById = new Map<string, QuestObjective>();
  private readonly availableSinceSecondsById = new Map<string, number>();
  private readonly levelId: string;

  constructor(
    levelId: string,
    objectives: readonly QuestObjective[],
    private readonly eventBus: GameplayEventBus
  ) {
    this.levelId = levelId;
    for (const objective of objectives) {
      this.objectivesById.set(objective.id, objective);
    }
  }

  /** Call whenever the underlying Quest's objectives array changes (e.g. after QuestEngine.progressObjective) to keep this manager's view in sync. */
  sync(objectives: readonly QuestObjective[]): void {
    for (const objective of objectives) {
      const wasComplete = this.objectivesById.get(objective.id)
        ? isObjectiveComplete(this.require(objective.id))
        : false;
      this.objectivesById.set(objective.id, objective);
      if (!wasComplete && isObjectiveComplete(objective)) {
        this.eventBus.emit("objective:completed", {
          objectiveId: objective.id,
          levelId: this.levelId,
        });
      }
    }
  }

  /**
   * True once every objective in `dependsOnObjectiveIds` is complete
   * — the dependency-graph gate. Objectives with an empty dependency
   * list are available immediately and can run in parallel with any
   * other objective whose own dependencies are already satisfied —
   * there is deliberately no separate "parallel" flag; parallelism
   * falls out of having no shared dependency, sequencing falls out
   * of depending on a prior step.
   */
  isAvailable(objectiveId: string, nowSeconds: number): boolean {
    const objective = this.require(objectiveId);
    const isDependencySatisfied = objective.dependsOnObjectiveIds.every((dependencyId) =>
      isObjectiveComplete(this.require(dependencyId))
    );
    if (isDependencySatisfied && !this.availableSinceSecondsById.has(objectiveId)) {
      this.availableSinceSecondsById.set(objectiveId, nowSeconds);
    }
    return isDependencySatisfied;
  }

  /** Seconds remaining before a timed objective expires, or null if untimed or not yet available. Does not itself fail the objective — callers decide what expiry means. */
  getTimeRemainingSeconds(objectiveId: string, nowSeconds: number): number | null {
    const objective = this.require(objectiveId);
    if (objective.timeLimitSeconds === null) {
      return null;
    }
    const availableSince = this.availableSinceSecondsById.get(objectiveId);
    if (availableSince === undefined) {
      return null;
    }
    return Math.max(0, objective.timeLimitSeconds - (nowSeconds - availableSince));
  }

  isExpired(objectiveId: string, nowSeconds: number): boolean {
    const remaining = this.getTimeRemainingSeconds(objectiveId, nowSeconds);
    return remaining !== null && remaining <= 0;
  }

  /** Objectives that should currently render in UI — a hidden objective is excluded until its dependencies are met (revealed), never based on optionality alone. */
  listVisible(nowSeconds: number): readonly QuestObjective[] {
    return Array.from(this.objectivesById.values()).filter((objective) => {
      if (!objective.isHidden) {
        return true;
      }
      return this.isAvailable(objective.id, nowSeconds);
    });
  }

  listAll(): readonly QuestObjective[] {
    return Array.from(this.objectivesById.values());
  }

  private require(objectiveId: string): QuestObjective {
    const objective = this.objectivesById.get(objectiveId);
    if (!objective) {
      throw new UnknownObjectiveError(objectiveId);
    }
    return objective;
  }
}

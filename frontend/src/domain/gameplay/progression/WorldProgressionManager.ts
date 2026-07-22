import {
  isConditionSatisfied,
  type WorldProgressionQueryContext,
  type WorldUnlockCondition,
} from "./WorldUnlockCondition";

export enum WorldProgressionStatus {
  LOCKED = "LOCKED",
  CURRENT = "CURRENT",
  COMPLETED = "COMPLETED",
  FUTURE_DLC = "FUTURE_DLC",
}

export interface WorldProgressionDefinition {
  readonly worldRegionId: string;
  readonly displayName: string;
  readonly unlockConditions: readonly WorldUnlockCondition[];
  /** Conditions for this (already-unlocked) world to be considered COMPLETED — e.g. its own quest chain finished. */
  readonly completionConditions: readonly WorldUnlockCondition[];
  /** Content that doesn't exist in the shipped game yet — always reports FUTURE_DLC regardless of conditions. */
  readonly isFutureDlc: boolean;
}

export class DuplicateWorldProgressionEntryError extends Error {
  constructor(readonly worldRegionId: string) {
    super(`World progression is already registered for region "${worldRegionId}".`);
    this.name = "DuplicateWorldProgressionEntryError";
  }
}

export class UnknownWorldProgressionEntryError extends Error {
  constructor(readonly worldRegionId: string) {
    super(`No world progression is registered for region "${worldRegionId}".`);
    this.name = "UnknownWorldProgressionEntryError";
  }
}

/**
 * Computes each world's unlock/completion status from quest/scripture/
 * story-flag state, without depending on QuestRegistry/ScriptureProgress
 * directly — the caller supplies a WorldProgressionQueryContext (the
 * same decoupling pattern as DialogueConditionEvaluator).
 */
export class WorldProgressionManager {
  private readonly definitionsByRegionId = new Map<string, WorldProgressionDefinition>();

  register(definition: WorldProgressionDefinition): void {
    if (this.definitionsByRegionId.has(definition.worldRegionId)) {
      throw new DuplicateWorldProgressionEntryError(definition.worldRegionId);
    }
    this.definitionsByRegionId.set(definition.worldRegionId, definition);
  }

  has(worldRegionId: string): boolean {
    return this.definitionsByRegionId.has(worldRegionId);
  }

  registerAll(definitions: readonly WorldProgressionDefinition[]): void {
    for (const definition of definitions) {
      this.register(definition);
    }
  }

  getStatus(worldRegionId: string, context: WorldProgressionQueryContext): WorldProgressionStatus {
    const definition = this.require(worldRegionId);

    if (definition.isFutureDlc) {
      return WorldProgressionStatus.FUTURE_DLC;
    }
    if (!this.allSatisfied(definition.unlockConditions, context)) {
      return WorldProgressionStatus.LOCKED;
    }
    if (
      definition.completionConditions.length > 0 &&
      this.allSatisfied(definition.completionConditions, context)
    ) {
      return WorldProgressionStatus.COMPLETED;
    }
    return WorldProgressionStatus.CURRENT;
  }

  listAllWithStatus(
    context: WorldProgressionQueryContext
  ): readonly { definition: WorldProgressionDefinition; status: WorldProgressionStatus }[] {
    return Array.from(this.definitionsByRegionId.values()).map((definition) => ({
      definition,
      status: this.getStatus(definition.worldRegionId, context),
    }));
  }

  private allSatisfied(
    conditions: readonly WorldUnlockCondition[],
    context: WorldProgressionQueryContext
  ): boolean {
    return conditions.every((condition) => isConditionSatisfied(condition, context));
  }

  private require(worldRegionId: string): WorldProgressionDefinition {
    const definition = this.definitionsByRegionId.get(worldRegionId);
    if (!definition) {
      throw new UnknownWorldProgressionEntryError(worldRegionId);
    }
    return definition;
  }
}

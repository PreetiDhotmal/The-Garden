import type { CharacterSpawnPoint } from "@/domain/character/CharacterSpawnPoint";
import type { GameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import type { QuestObjective } from "@/domain/gameplay/quest/QuestObjective";
import { isObjectiveComplete } from "@/domain/gameplay/quest/QuestObjective";
import type { WorldManager } from "@/infrastructure/world/WorldManager";
import { ObjectiveManager } from "./ObjectiveManager";

export interface LevelDefinition {
  readonly levelId: string;
  readonly chapterId: string;
  readonly worldRegionId: string;
  readonly spawnPointId: string | null;
  /** A factory, not a static array — every enterLevel/restartLevel call needs a genuinely fresh set of objectives (currentCount reset to 0) for that attempt, independent of any prior attempt's or the permanent Quest record's state. */
  readonly createObjectives: () => readonly QuestObjective[];
}

export class NoActiveLevelError extends Error {
  constructor() {
    super("No level is currently active — call enterLevel() first.");
    this.name = "NoActiveLevelError";
  }
}

export class UnknownLevelDefinitionError extends Error {
  constructor(readonly levelId: string) {
    super(`No level definition registered for id "${levelId}".`);
    this.name = "UnknownLevelDefinitionError";
  }
}

/**
 * Owns the lifecycle of "the level currently being played" — a
 * single active attempt at a time (this is a co-op game; there is
 * exactly one shared level session, not per-player sessions). Reuses
 * WorldManager (spawn resolution, already built) rather than
 * reimplementing it. Reuses ObjectiveManager for the objective graph
 * of the current attempt specifically — not the same instance
 * QuestEngine/Quest track permanently, since a level restart must
 * reset attempt-local objective progress without touching the
 * permanent "this chapter was ever completed" record
 * ChapterManager/GardenRestorationManager depend on.
 *
 * Deliberately emits events (level:started, level:completed) rather
 * than calling into ChapterManager or GardenRestorationManager
 * directly — those systems react to the events instead, keeping this
 * class decoupled from what "completing a level" means for the rest
 * of the game.
 */
export class LevelManager {
  private readonly definitionsById = new Map<string, LevelDefinition>();
  private currentDefinition: LevelDefinition | null = null;
  private currentObjectiveManager: ObjectiveManager | null = null;

  constructor(
    private readonly worldManager: WorldManager,
    private readonly eventBus: GameplayEventBus
  ) {}

  register(definition: LevelDefinition): void {
    this.definitionsById.set(definition.levelId, definition);
  }

  registerAll(definitions: readonly LevelDefinition[]): void {
    for (const definition of definitions) {
      this.register(definition);
    }
  }

  /** Starts a fresh objective attempt for this level. Does not itself move the streaming/loaded world region — that remains the Hub/route's own responsibility via WorldManager, consistent with how Genesis Garden/Wilderness already load their regions; resolveSpawnPoint() below is what actually reuses WorldManager. */
  enterLevel(levelId: string): void {
    const definition = this.definitionsById.get(levelId);
    if (!definition) {
      throw new UnknownLevelDefinitionError(levelId);
    }
    this.currentDefinition = definition;
    this.currentObjectiveManager = new ObjectiveManager(
      levelId,
      definition.createObjectives(),
      this.eventBus
    );
    this.eventBus.emit("level:started", { levelId });
  }

  /** Re-enters the current level definition, discarding the in-progress attempt's objective state entirely — a clean restart, not a QuestEngine reset. */
  restartLevel(): void {
    const definition = this.requireCurrentDefinition();
    this.enterLevel(definition.levelId);
  }

  exitLevel(): void {
    this.currentDefinition = null;
    this.currentObjectiveManager = null;
  }

  getCurrentLevelId(): string | null {
    return this.currentDefinition?.levelId ?? null;
  }

  getCurrentChapterId(): string | null {
    return this.currentDefinition?.chapterId ?? null;
  }

  /** Resolves the current level's actual spawn point via WorldManager.spawnManager (reused, not reimplemented) — falls back to the region's default spawn point if this level didn't specify its own. */
  resolveSpawnPoint(): CharacterSpawnPoint {
    const definition = this.requireCurrentDefinition();
    return this.worldManager.spawnManager.resolveSpawnPoint(definition.spawnPointId);
  }

  getObjectiveManager(): ObjectiveManager {
    if (!this.currentObjectiveManager) {
      throw new NoActiveLevelError();
    }
    return this.currentObjectiveManager;
  }

  /** True once every non-optional objective in the current attempt is complete. Mirrors QuestProgress.requiredObjectivesComplete's semantics (isOptional still gates completion) without depending on Quest/QuestRegistry, since this attempt's objectives are LevelManager's own fresh copies. */
  isLevelComplete(): boolean {
    const objectives = this.getObjectiveManager().listAll();
    return objectives.filter((objective) => !objective.isOptional).every(isObjectiveComplete);
  }

  /** Call once isLevelComplete() is true — emits level:completed. Does not itself trigger reward granting, chapter completion, or Garden Restoration; those are separate systems reacting to this event. */
  completeLevel(): void {
    const definition = this.requireCurrentDefinition();
    this.eventBus.emit("level:completed", { levelId: definition.levelId });
  }

  private requireCurrentDefinition(): LevelDefinition {
    if (!this.currentDefinition) {
      throw new NoActiveLevelError();
    }
    return this.currentDefinition;
  }
}

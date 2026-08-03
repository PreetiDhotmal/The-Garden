import type { GameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import type { WorldProgressionQueryContext } from "@/domain/gameplay/progression/WorldUnlockCondition";
import { WorldProgressionStatus } from "@/domain/gameplay/progression/WorldProgressionManager";
import { ChapterManager, type ChapterWithStatus } from "./ChapterManager";
import { GameState } from "./GameState";
import { GameStateMachine } from "./GameStateMachine";
import { GardenRestorationManager } from "./GardenRestorationManager";
import { LevelManager } from "./LevelManager";
import { ReflectionManager } from "./ReflectionManager";
import { CoopSessionManager } from "./CoopSessionManager";

export interface GameManagerDependencies {
  readonly eventBus: GameplayEventBus;
  readonly chapterManager: ChapterManager;
  readonly levelManager: LevelManager;
  readonly gardenRestorationManager: GardenRestorationManager;
  readonly reflectionManager: ReflectionManager;
  readonly coopSessionManager: CoopSessionManager;
  /** Chapter unlock/completion conditions ultimately read quest/scripture/story-flag state — this project's established pattern (WorldProgressionManager, used throughout Genesis Garden/Wilderness) is for the CALLER to supply that as a context object rather than GameManager owning QuestRegistry directly, keeping this class decoupled from exactly which quest system backs chapter completion. */
  readonly getProgressionContext: () => WorldProgressionQueryContext;
  /**
   * Milestone 2 addition. GameManager previously always constructed
   * its own internal GameStateMachine — but a route that hosts a
   * single chapter (and therefore its own WorldManager-scoped
   * LevelManager) needs its own GameManager instance, while GameState
   * itself must persist as one app-root singleton across Hub <->
   * Chapter transitions. Optional and defaulting to the original
   * behavior (a fresh internal machine) keeps every Milestone 1 call
   * site and test unchanged.
   */
  readonly gameStateMachine?: GameStateMachine;
}

/** The single aggregate read model the brief's "single source of truth" list describes. Difficulty and save-slot metadata live in the presentation layer (settingsStore/SaveManager) and are intentionally NOT duplicated here — a domain class cannot import presentation-layer state without breaking this milestone's own strict-layering requirement, and re-deriving a save-slot concept purely in domain terms would be a parallel, easily-desynced copy of what SaveManager already owns. */
export interface GameManagerSnapshot {
  readonly gameState: GameState;
  readonly currentChapterId: string | null;
  readonly currentLevelId: string | null;
  readonly chapters: readonly ChapterWithStatus[];
  readonly overallGardenRestoration: number;
  readonly isCoopSessionReady: boolean;
}

/**
 * Composes every system built this milestone. Deliberately owns NO
 * game logic of its own beyond sequencing reactions to events — every
 * actual rule (what unlocks a chapter, how a zone restores, what a
 * respawn point resolves to) lives in the system responsible for it,
 * already built and already tested in isolation. GameManager's own
 * correctness is entirely about wiring order, which is why its tests
 * assert event sequences, not domain rules.
 */
export class GameManager {
  private readonly eventBus: GameplayEventBus;
  private readonly chapterManager: ChapterManager;
  private readonly levelManager: LevelManager;
  private readonly gardenRestorationManager: GardenRestorationManager;
  private readonly reflectionManager: ReflectionManager;
  private readonly coopSessionManager: CoopSessionManager;
  private readonly getProgressionContext: () => WorldProgressionQueryContext;
  private readonly gameStateMachine: GameStateMachine;

  constructor(dependencies: GameManagerDependencies) {
    this.eventBus = dependencies.eventBus;
    this.chapterManager = dependencies.chapterManager;
    this.levelManager = dependencies.levelManager;
    this.gardenRestorationManager = dependencies.gardenRestorationManager;
    this.reflectionManager = dependencies.reflectionManager;
    this.coopSessionManager = dependencies.coopSessionManager;
    this.getProgressionContext = dependencies.getProgressionContext;
    this.gameStateMachine = new GameStateMachine(this.eventBus);

    this.wireEventReactions();
  }

  getStateMachine(): GameStateMachine {
    return this.gameStateMachine;
  }

  getSnapshot(): GameManagerSnapshot {
    const context = this.getProgressionContext();
    const chapters = this.chapterManager.listInOrder(context);
    return {
      gameState: this.gameStateMachine.current(),
      currentChapterId: this.getCurrentChapterIdFromChapters(chapters),
      currentLevelId: this.levelManager.getCurrentLevelId(),
      chapters,
      overallGardenRestoration: this.gardenRestorationManager.getOverallRestorationScalar(),
      isCoopSessionReady: this.coopSessionManager.isSessionReady(),
    };
  }

  /**
   * Wires exactly the reaction chain the GDD's level-complete flow
   * describes (Section 2.6-2.8): a level finishing opens Reflection
   * before Garden Restoration is applied — the player should see the
   * lesson before the world visibly changes around it, never the
   * reverse. Every step here is a call into an already-built,
   * already-tested system; nothing is reimplemented.
   */
  private wireEventReactions(): void {
    this.eventBus.on("level:completed", ({ levelId }) => {
      this.gameStateMachine.transitionTo(GameState.LEVEL_COMPLETE);
      this.gameStateMachine.transitionTo(GameState.REFLECTION);
      this.reflectionManager.open(levelId);
    });

    this.eventBus.on("reflection:closed", ({ levelId }) => {
      const chapterId = this.levelManager.getCurrentChapterId();
      const isActiveLevel = this.levelManager.getCurrentLevelId() === levelId;
      if (!isActiveLevel || !chapterId) {
        return;
      }
      this.reflectionManager.markWatched(levelId);
      this.gameStateMachine.transitionTo(GameState.GARDEN_RESTORATION);
      this.chapterManager.markEverCompleted(chapterId);
      this.gardenRestorationManager.applyChapterCompletion(chapterId);
      this.eventBus.emit("chapter:completed", { chapterId });
    });

    this.eventBus.on("chapter:completed", () => {
      this.gameStateMachine.transitionTo(GameState.SAVING);
    });
  }

  private getCurrentChapterIdFromChapters(chapters: readonly ChapterWithStatus[]): string | null {
    const current = chapters.find((chapter) => chapter.status === WorldProgressionStatus.CURRENT);
    return current?.definition.chapterId ?? this.levelManager.getCurrentChapterId();
  }
}

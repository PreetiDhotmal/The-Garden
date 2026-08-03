import { describe, expect, it } from "vitest";
import { createSpawnPoint } from "@/domain/character/CharacterSpawnPoint";
import { createGameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import { createQuestObjective } from "@/domain/gameplay/quest/QuestObjective";
import type { WorldProgressionQueryContext } from "@/domain/gameplay/progression/WorldUnlockCondition";
import { WorldProgressionStatus } from "@/domain/gameplay/progression/WorldProgressionManager";
import { StoryFlags } from "@/domain/gameplay/progression/StoryFlags";
import { SpawnManager } from "@/domain/world/spawn/SpawnManager";
import type { WorldManager } from "@/infrastructure/world/WorldManager";
import { ChapterManager } from "./ChapterManager";
import { CoopSessionManager } from "./CoopSessionManager";
import { GameManager } from "./GameManager";
import { GameState } from "./GameState";
import { GardenRestorationManager } from "./GardenRestorationManager";
import { LevelManager } from "./LevelManager";
import { ReflectionContentRegistry } from "./ReflectionContent";
import { ReflectionManager } from "./ReflectionManager";
import { DORMANT_RESTORATION_PROFILE } from "./RestorationProfile";

function buildWorldManagerStub(): WorldManager {
  const spawnManager = new SpawnManager();
  spawnManager.register(
    createSpawnPoint({ id: "spawn:communication", position: { x: 0, y: 0, z: 0 } }),
    true
  );
  return { spawnManager } as unknown as WorldManager;
}

function advanceToPlaying(gameManager: GameManager): void {
  gameManager.getStateMachine().transitionTo(GameState.LOADING);
  gameManager.getStateMachine().transitionTo(GameState.MAIN_MENU);
  gameManager.getStateMachine().transitionTo(GameState.LOBBY);
  gameManager.getStateMachine().transitionTo(GameState.HUB_WORLD);
  gameManager.getStateMachine().transitionTo(GameState.ENTERING_LEVEL);
  gameManager.getStateMachine().transitionTo(GameState.PLAYING);
}

function buildGameManager() {
  const eventBus = createGameplayEventBus();

  const chapterManager = new ChapterManager();
  chapterManager.register({
    chapterId: "chapter:communication",
    displayName: "Communication",
    order: 0,
    progression: {
      worldRegionId: "chapter:communication",
      displayName: "Communication",
      unlockConditions: [],
      completionConditions: [
        { kind: "STORY_FLAG", flag: "chapter-complete:chapter:communication" },
      ],
      isFutureDlc: false,
    },
  });

  const levelManager = new LevelManager(buildWorldManagerStub(), eventBus);
  levelManager.register({
    levelId: "level:communication",
    chapterId: "chapter:communication",
    worldRegionId: "region:aqueduct",
    spawnPointId: "spawn:communication",
    createObjectives: () => [
      createQuestObjective({ id: "obj:gate", description: "Open the gate" }),
    ],
  });

  const gardenRestorationManager = new GardenRestorationManager(eventBus);
  gardenRestorationManager.register({
    chapterId: "chapter:communication",
    zoneId: "zone:aqueduct",
    profile: { ...DORMANT_RESTORATION_PROFILE, waterLevel: 1 },
  });

  const reflectionContentRegistry = new ReflectionContentRegistry();
  reflectionContentRegistry.register({
    levelId: "level:communication",
    lessonText: "Understanding takes both a voice and an ear.",
    summaryText: "You restored the aqueduct together.",
    scriptureReference: null,
  });
  const storyFlags = new StoryFlags();
  const reflectionManager = new ReflectionManager(reflectionContentRegistry, storyFlags, eventBus);

  const coopSessionManager = new CoopSessionManager(eventBus);
  coopSessionManager.join("PLAYER_ONE", "player:one", "boy");
  coopSessionManager.join("PLAYER_TWO", "player:two", "girl");

  const context: WorldProgressionQueryContext = {
    getQuestStatus: () => null,
    isScriptureUnlocked: () => false,
    hasStoryFlag: (flag) => storyFlags.has(flag),
  };

  const gameManager = new GameManager({
    eventBus,
    chapterManager,
    levelManager,
    gardenRestorationManager,
    reflectionManager,
    coopSessionManager,
    getProgressionContext: () => context,
  });

  return {
    gameManager,
    eventBus,
    chapterManager,
    levelManager,
    gardenRestorationManager,
    storyFlags,
  };
}

describe("GameManager", () => {
  it("starts in GAME_BOOT", () => {
    const { gameManager } = buildGameManager();
    expect(gameManager.getStateMachine().current()).toBe(GameState.GAME_BOOT);
  });

  it("getSnapshot reflects a ready coop session before any level starts", () => {
    const { gameManager } = buildGameManager();
    const snapshot = gameManager.getSnapshot();
    expect(snapshot.isCoopSessionReady).toBe(true);
    expect(snapshot.currentLevelId).toBeNull();
    expect(snapshot.overallGardenRestoration).toBe(0);
  });

  it("level:completed transitions the state machine through LEVEL_COMPLETE into REFLECTION and opens the reflection", () => {
    const { gameManager, levelManager, eventBus } = buildGameManager();
    advanceToPlaying(gameManager);
    levelManager.enterLevel("level:communication");

    let reflectionOpenedFor: string | null = null;
    eventBus.on("reflection:opened", ({ levelId }) => {
      reflectionOpenedFor = levelId;
    });

    eventBus.emit("level:completed", { levelId: "level:communication" });

    expect(gameManager.getStateMachine().current()).toBe(GameState.REFLECTION);
    expect(reflectionOpenedFor).toBe("level:communication");
  });

  it("reflection:closed marks the reflection watched, restores the garden, and completes the chapter", () => {
    const {
      gameManager,
      levelManager,
      eventBus,
      chapterManager,
      gardenRestorationManager,
      storyFlags,
    } = buildGameManager();
    advanceToPlaying(gameManager);
    levelManager.enterLevel("level:communication");
    eventBus.emit("level:completed", { levelId: "level:communication" });

    let chapterCompletedId: string | null = null;
    eventBus.on("chapter:completed", ({ chapterId }) => {
      chapterCompletedId = chapterId;
    });

    storyFlags.set("chapter-complete:chapter:communication");
    eventBus.emit("reflection:closed", { levelId: "level:communication" });

    expect(gameManager.getStateMachine().current()).toBe(GameState.SAVING);
    expect(chapterCompletedId).toBe("chapter:communication");
    expect(gardenRestorationManager.getZoneProfile("zone:aqueduct").waterLevel).toBe(1);
    const context: WorldProgressionQueryContext = {
      getQuestStatus: () => null,
      isScriptureUnlocked: () => false,
      hasStoryFlag: (flag) => storyFlags.has(flag),
    };
    expect(chapterManager.getStatus("chapter:communication", context)).toBe(
      WorldProgressionStatus.COMPLETED
    );
  });

  it("getSnapshot reflects garden restoration progress after a chapter completes", () => {
    const { gameManager, levelManager, eventBus, storyFlags } = buildGameManager();
    advanceToPlaying(gameManager);
    levelManager.enterLevel("level:communication");
    eventBus.emit("level:completed", { levelId: "level:communication" });
    storyFlags.set("chapter-complete:chapter:communication");
    eventBus.emit("reflection:closed", { levelId: "level:communication" });

    expect(gameManager.getSnapshot().overallGardenRestoration).toBeGreaterThan(0);
  });

  it("does not react to reflection:closed for a level that is not the currently active one", () => {
    const { gardenRestorationManager, eventBus } = buildGameManager();
    eventBus.emit("reflection:closed", { levelId: "level:communication" });
    expect(gardenRestorationManager.getZoneProfile("zone:aqueduct").waterLevel).toBe(0);
  });
});

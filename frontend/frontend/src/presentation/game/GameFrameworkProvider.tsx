import { useMemo, type ReactNode } from "react";
import { createGameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import type { WorldProgressionQueryContext } from "@/domain/gameplay/progression/WorldUnlockCondition";
import { StoryFlags } from "@/domain/gameplay/progression/StoryFlags";
import { ChapterManager } from "@/domain/game/ChapterManager";
import { LevelManager } from "@/domain/game/LevelManager";
import { GardenRestorationManager } from "@/domain/game/GardenRestorationManager";
import { ReflectionManager } from "@/domain/game/ReflectionManager";
import { ReflectionContentRegistry } from "@/domain/game/ReflectionContent";
import { CoopSessionManager } from "@/domain/game/CoopSessionManager";
import { RespawnCoordinator } from "@/domain/game/RespawnCoordinator";
import { TransitionManager } from "@/domain/game/TransitionManager";
import { GameManager } from "@/domain/game/GameManager";
import type { AssetManager } from "@/infrastructure/engine/assets/AssetManager";
import { WorldManager } from "@/infrastructure/world/WorldManager";
import { useEngine } from "@/presentation/engine/hooks/useEngine";
import { CHAPTER_DEFINITIONS, CHAPTER_RESTORATION_ENTRIES, CHAPTER_REFLECTION_CONTENT } from "@/presentation/hub/chapterData";
import { GameFrameworkContext, type GameFrameworkServices } from "./GameFrameworkContext";

function createGameFrameworkServices(assetManager: AssetManager): {
  services: GameFrameworkServices;
  storyFlags: StoryFlags;
} {
  const eventBus = createGameplayEventBus();
  const worldManager = new WorldManager(assetManager);
  const storyFlags = new StoryFlags();

  const chapterManager = new ChapterManager();
  chapterManager.registerAll(CHAPTER_DEFINITIONS);

  const levelManager = new LevelManager(worldManager, eventBus);

  const gardenRestorationManager = new GardenRestorationManager(eventBus);
  gardenRestorationManager.registerAll(CHAPTER_RESTORATION_ENTRIES);

  const reflectionContentRegistry = new ReflectionContentRegistry();
  reflectionContentRegistry.registerAll(CHAPTER_REFLECTION_CONTENT);
  const reflectionManager = new ReflectionManager(reflectionContentRegistry, storyFlags, eventBus);

  const coopSessionManager = new CoopSessionManager(eventBus);
  const respawnCoordinator = new RespawnCoordinator(
    worldManager.checkpointManager,
    worldManager.spawnManager,
    eventBus
  );
  const transitionManager = new TransitionManager(eventBus);

  const getProgressionContext = (): WorldProgressionQueryContext => ({
    getQuestStatus: () => null,
    isScriptureUnlocked: () => false,
    hasStoryFlag: (flag) => storyFlags.has(flag),
  });

  const gameManager = new GameManager({
    eventBus,
    chapterManager,
    levelManager,
    gardenRestorationManager,
    reflectionManager,
    coopSessionManager,
    getProgressionContext,
  });

  return {
    services: {
      eventBus,
      gameManager,
      gameStateMachine: gameManager.getStateMachine(),
      chapterManager,
      levelManager,
      gardenRestorationManager,
      reflectionManager,
      coopSessionManager,
      respawnCoordinator,
      transitionManager,
    },
    storyFlags,
  };
}

export interface GameFrameworkProviderProps {
  readonly children: ReactNode;
}

/**
 * Requires an ancestor EngineProvider (needs a real AssetManager for
 * its own WorldManager, used by LevelManager/RespawnCoordinator).
 * Nested EngineProviders — e.g. MainMenuScreen's own local one for
 * its animated background — resolve correctly via normal React
 * context nesting (the closer provider wins for that subtree).
 */
export function GameFrameworkProvider({ children }: GameFrameworkProviderProps) {
  const { assetManager } = useEngine();
  const { services } = useMemo(() => createGameFrameworkServices(assetManager), [assetManager]);

  return (
    <GameFrameworkContext.Provider value={services}>{children}</GameFrameworkContext.Provider>
  );
}

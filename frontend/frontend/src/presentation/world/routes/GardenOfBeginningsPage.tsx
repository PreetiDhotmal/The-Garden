import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { EngineProvider } from "@/presentation/engine/providers/EngineProvider";
import { GameCanvas } from "@/presentation/engine/components/GameCanvas";
import { DebugPanel } from "@/presentation/engine/components/DebugPanel";
import { useEngine } from "@/presentation/engine/hooks/useEngine";
import { CharacterType } from "@/domain/character/CharacterType";
import { CharacterFactory } from "@/domain/character/CharacterFactory";
import type { CharacterEntity } from "@/domain/character/CharacterEntity";
import { createCharacterConfig } from "@/domain/engine/config/CharacterConfig";
import { createBoyAnimationConfig, createGirlAnimationConfig } from "@/infrastructure/character/defaultAnimationConfigs";
import {
  useCharacterSelectionStore,
  PLAYABLE_CHARACTERS,
} from "@/presentation/character/stores/characterSelectionStore";
import { InputSystem } from "@/infrastructure/input/InputSystem";
import { KeyboardInputSource } from "@/infrastructure/input/KeyboardInputSource";
import { MouseInputSource } from "@/infrastructure/input/MouseInputSource";
import { GamepadInputSource } from "@/infrastructure/input/GamepadInputSource";
import { createInputMapWithOverrides } from "@/domain/input/InputMap";
import { InputAction } from "@/domain/input/InputAction";
import { useKeyBindingsStore } from "@/presentation/settings/keyBindingsStore";
import {
  CHARACTER_MODEL_ASSET_IDS,
  CHARACTER_MODEL_URLS,
} from "@/presentation/character/characterModelAssets";
import { createAssetDescriptor } from "@/domain/engine/assets/AssetDescriptor";
import { AssetType } from "@/domain/engine/assets/AssetType";
import { CharacterScene } from "@/presentation/character/components/CharacterScene";
import type { ThirdPersonCameraController } from "@/infrastructure/camera/ThirdPersonCameraController";
import { useCharacterAssets } from "@/presentation/character/hooks/useCharacterAssets";
import { GameplayProvider } from "@/presentation/gameplay/providers/GameplayProvider";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { InteractionDriver } from "@/presentation/gameplay/components/InteractionDriver";
import { InteractionPromptUI } from "@/presentation/gameplay/components/InteractionPromptUI";
import { QuestTracker } from "@/presentation/gameplay/components/QuestTracker";
import { InventoryWindow } from "@/presentation/gameplay/components/InventoryWindow";
import { ScriptureWindow } from "@/presentation/gameplay/components/ScriptureWindow";
import { VersePopup } from "@/presentation/gameplay/components/VersePopup";
import { RewardPopup } from "@/presentation/gameplay/components/RewardPopup";
import { AchievementPopup } from "@/presentation/gameplay/components/AchievementPopup";
import { NotificationSystem } from "@/presentation/gameplay/components/NotificationSystem";
import { ProgressWidget } from "@/presentation/gameplay/components/ProgressWidget";
import { GameplayEventBridge } from "@/presentation/gameplay/components/GameplayEventBridge";
import { ScriptureDebugPanel } from "@/presentation/gameplay/components/ScriptureDebugPanel";
import { OfflineIndicator } from "@/presentation/gameplay/components/scripture/OfflineIndicator";
import { WorldManager } from "@/infrastructure/world/WorldManager";
import { GardenOfBeginningsScene } from "@/presentation/world/components/GardenOfBeginningsScene";
import { WorldDebugPanel } from "@/presentation/world/components/WorldDebugPanel";
import { CollisionDebugPanel } from "@/presentation/world/components/CollisionDebugPanel";
import { CameraDebugPanel } from "@/presentation/world/components/CameraDebugPanel";
import { setupGardenOfBeginnings, GARDEN_REGION_ID } from "@/presentation/world/gardenOfBeginningsContent";
import { setupTheBeginningQuest } from "@/presentation/world/theBeginningQuestContent";
import {
  ANCIENT_TREE_ID,
  ANCIENT_TREE_POSITION,
  GENESIS_STONE_ID,
  GENESIS_STONE_POSITION,
  SEED_IDS,
  SEED_POSITIONS,
} from "@/presentation/world/theBeginningQuestContent";
import { InteractableObject } from "@/presentation/gameplay/components/InteractableObject";
import { GlowingSeed } from "@/presentation/gameplay/components/GlowingSeed";
import { useTheBeginningQuestFlow } from "@/presentation/world/useTheBeginningQuestFlow";
import { useScriptureStoneFlow } from "@/presentation/world/useScriptureStoneFlow";
import { NpcField } from "@/presentation/gameplay/components/npc/NpcField";
import { useNpcDialogueFlow } from "@/presentation/gameplay/hooks/useNpcDialogueFlow";
import { DialogueBox } from "@/presentation/gameplay/components/dialogue/DialogueBox";
import { GameplayDevTools } from "@/presentation/gameplay/components/devtools/GameplayDevTools";
import { GameplayHud } from "@/presentation/gameplay/components/GameplayHud";
import { PauseMenu } from "@/presentation/gameplay/components/PauseMenu";
import { JournalScreen } from "@/presentation/gameplay/components/JournalScreen";
import { InventoryScreen } from "@/presentation/gameplay/components/InventoryScreen";
import { TutorialOverlay } from "@/presentation/gameplay/components/TutorialOverlay";
import { QuestCompleteBanner } from "@/presentation/gameplay/components/QuestCompleteBanner";
import { QuestCelebrationEffect } from "@/presentation/gameplay/components/QuestCelebrationEffect";
import { THE_BEGINNING_QUEST_ID } from "@/presentation/world/theBeginningQuestContent";
import { useTutorialFlow } from "@/presentation/gameplay/hooks/useTutorialFlow";
import { useSettingsStore, MAX_HEALTH_BY_DIFFICULTY } from "@/presentation/settings/settingsStore";
import { GRAPHICS_QUALITY_PRESETS } from "@/domain/engine/config/GraphicsQualityPreset";
import { LoadingScreen } from "@/presentation/engine/components/LoadingScreen";
import { useAssetPreloader } from "@/presentation/engine/hooks/useAssetPreloader";

function GardenContent() {
  const { assetRegistry, assetManager, audioManager } = useEngine();
  const gameplayServices = useGameplay();
  const [celebratingQuestTitle, setCelebratingQuestTitle] = useState<string | null>(null);
  const [isCelebrationEffectActive, setIsCelebrationEffectActive] = useState(false);
  const [searchParams] = useSearchParams();
  // Defaults to "boy" for the direct-URL developer-shortcut case (no
  // selection was ever made) — every other path through the game
  // flow always calls selectCharacter() before navigating here.
  const selectedCharacterId = useCharacterSelectionStore((state) => state.selectedCharacterId) ?? "boy";
  const selectedModelAssetId = PLAYABLE_CHARACTERS[selectedCharacterId].modelAssetId;
  const createAnimationConfig = selectedCharacterId === "girl" ? createGirlAnimationConfig : createBoyAnimationConfig;
  const { data, isLoading, error } = useCharacterAssets(selectedModelAssetId);
  const { handleStoneInteract } = useScriptureStoneFlow();

  const worldManager = useMemo(() => new WorldManager(assetManager), [assetManager]);
  const theBeginningFlow = useTheBeginningQuestFlow(worldManager);
  const factory = useMemo(() => new CharacterFactory(), []);
  const inputSystem = useMemo(() => new InputSystem(), []);
  const containerRef = useRef<HTMLDivElement>(null);
  const [entity, setEntity] = useState<CharacterEntity | null>(null);
  const groundHeightRef = useRef<((x: number, z: number) => number) | null>(null);
  const [isTerrainReady, setIsTerrainReady] = useState(false);
  const cameraControllerRef = useRef<ThirdPersonCameraController | null>(null);

  useEffect(() => {
    return gameplayServices.eventBus.on("quest:completed", ({ questId }) => {
      if (questId !== THE_BEGINNING_QUEST_ID) {
        return;
      }
      const quest = gameplayServices.questRegistry.has(questId)
        ? gameplayServices.questRegistry.get(questId)
        : null;
      setCelebratingQuestTitle(quest?.title ?? "The Beginning");
      setIsCelebrationEffectActive(true);
      // Music dip (not a full duck like pause, just a brief moment for the
      // fanfare to read clearly) then restore, matching "fade music" —
      // "play completion fanfare" itself has no audio asset, same honest
      // silent-until-assets-exist pattern used throughout this project.
      const previousMusicVolume = audioManager.getGroupVolume("music");
      audioManager.setGroupVolume("music", previousMusicVolume * 0.3);
      window.setTimeout(() => {
        audioManager.setGroupVolume("music", previousMusicVolume);
      }, 3000);
      // Brief camera flourish — zoom out then back in, a lightweight
      // stand-in for a full cinematic camera handoff (not built this
      // pass — see the deliverable's known limitations).
      cameraControllerRef.current?.applyZoomDelta(-3);
      window.setTimeout(() => {
        cameraControllerRef.current?.applyZoomDelta(3);
      }, 1200);
    });
  }, [gameplayServices, audioManager, cameraControllerRef]);
  const playtimeSecondsRef = useRef(0);
  const dialogueFlow = useNpcDialogueFlow();
  const [isPaused, setIsPaused] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const tutorial = useTutorialFlow({
    entity,
    cameraControllerRef,
    isJournalOpen,
    isInventoryOpen,
    isPaused,
  });
  const mouseSensitivity = useSettingsStore((state) => state.mouseSensitivity);
  const difficulty = useSettingsStore((state) => state.difficulty);
  const graphicsQuality = useSettingsStore((state) => state.graphicsQuality);
  const masterVolume = useSettingsStore((state) => state.masterVolume);
  const invertY = useSettingsStore((state) => state.invertY);
  const crosshairEnabled = useSettingsStore((state) => state.crosshairEnabled);
  const qualityPreset = GRAPHICS_QUALITY_PRESETS[graphicsQuality];
  const musicVolume = useSettingsStore((state) => state.musicVolume);
  const sfxVolume = useSettingsStore((state) => state.sfxVolume);
  const keyBindingOverrides = useKeyBindingsStore((state) => state.overrides);

  useEffect(() => {
    const pauseKey = keyBindingOverrides[InputAction.PAUSE] ?? "Escape";
    const journalKey = keyBindingOverrides[InputAction.OPEN_JOURNAL] ?? "KeyJ";
    const inventoryKey = keyBindingOverrides[InputAction.OPEN_INVENTORY] ?? "KeyI";
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.code === pauseKey) {
        setIsPaused((paused) => !paused);
      } else if (event.code === journalKey) {
        setIsJournalOpen((open) => !open);
      } else if (event.code === inventoryKey) {
        setIsInventoryOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [keyBindingOverrides]);

  useEffect(() => {
    if (isPaused && document.pointerLockElement) {
      document.exitPointerLock();
    }
  }, [isPaused]);

  useEffect(() => {
    if (isPaused) {
      return;
    }
    const interval = window.setInterval(() => {
      playtimeSecondsRef.current += 1;
    }, 1000);
    return () => {
      window.clearInterval(interval);
    };
  }, [isPaused]);

  const DUCKED_VOLUME_FACTOR = 0.3;
  useEffect(() => {
    const duck = isPaused ? DUCKED_VOLUME_FACTOR : 1;
    audioManager.setGroupVolume("music", masterVolume * musicVolume * duck);
    audioManager.setGroupVolume("sfx", masterVolume * sfxVolume * duck);
  }, [isPaused, audioManager, masterVolume, musicVolume, sfxVolume]);

  useEffect(() => {
    if (!assetRegistry.has(CHARACTER_MODEL_ASSET_IDS.BOY)) {
      assetRegistry.register(
        createAssetDescriptor({
          id: CHARACTER_MODEL_ASSET_IDS.BOY,
          type: AssetType.MODEL,
          url: CHARACTER_MODEL_URLS[CHARACTER_MODEL_ASSET_IDS.BOY] ?? "",
          priority: "critical",
        })
      );
    }
    if (!assetRegistry.has(CHARACTER_MODEL_ASSET_IDS.GIRL)) {
      assetRegistry.register(
        createAssetDescriptor({
          id: CHARACTER_MODEL_ASSET_IDS.GIRL,
          type: AssetType.MODEL,
          url: CHARACTER_MODEL_URLS[CHARACTER_MODEL_ASSET_IDS.GIRL] ?? "",
          priority: "high",
        })
      );
    }
  }, [assetRegistry]);

  useEffect(() => {
    gameplayServices.worldSaveContextRef.current = {
      getCurrentWorldId: () => GARDEN_REGION_ID,
      getUnlockedWorldIds: () => [GARDEN_REGION_ID],
      getPlayerPosition: () => (entity ? entity.getPosition() : { x: 0, y: 0, z: 0 }),
      getPlayerYaw: () => (entity ? entity.getYaw() : 0),
      restorePlayerPosition: (position, yaw) => {
        entity?.setPosition(position);
        entity?.setYaw(yaw);
      },
      getCameraState: () => cameraControllerRef.current?.getOrbitState() ?? null,
      restoreCameraState: (state) => {
        cameraControllerRef.current?.restoreOrbitState(state);
      },
      getTotalPlaytimeSeconds: () => playtimeSecondsRef.current,
      restoreTotalPlaytimeSeconds: (seconds) => {
        playtimeSecondsRef.current = seconds;
      },
    };
  }, [gameplayServices, entity]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    const inputMap = createInputMapWithOverrides(keyBindingOverrides);
    inputSystem.addSource(new KeyboardInputSource(inputMap));
    inputSystem.addSource(new MouseInputSource(containerRef.current, mouseSensitivity));
    inputSystem.addSource(new GamepadInputSource(inputMap));
    return () => {
      inputSystem.removeAllSources();
    };
  }, [inputSystem, mouseSensitivity, keyBindingOverrides]);

  const animationConfig = useMemo(() => {
    if (!data) {
      return null;
    }
    return createAnimationConfig(data.clipRegistry);
  }, [data, createAnimationConfig]);

  const handleGroundHeightReady = (heightFunction: (x: number, z: number) => number) => {
    if (groundHeightRef.current) {
      return;
    }
    groundHeightRef.current = heightFunction;
    setupGardenOfBeginnings(worldManager, gameplayServices, heightFunction);
    setupTheBeginningQuest(worldManager, gameplayServices);
    setIsTerrainReady(true);
  };

  /**
   * Terrain generation and character-model loading race against each
   * other — either can finish first. The previous version only ever
   * attempted to spawn from inside handleGroundHeightReady itself,
   * which silently never spawned the player at all if the character
   * model was still loading when terrain finished (a very plausible
   * real-world ordering, not an edge case) — visible downstream as a
   * permanently un-initialized camera, among other things. This
   * effect re-evaluates whenever either dependency changes, so the
   * spawn happens exactly once, whichever one finishes last.
   */
  useEffect(() => {
    if (!isTerrainReady || !animationConfig || entity) {
      return;
    }
    const config = createCharacterConfig({
      id: `character:${selectedCharacterId}`,
      type: CharacterType.PLAYER,
      modelAssetId: selectedModelAssetId,
      animationConfigId: animationConfig.id,
    });
    const spawnPoint = worldManager.spawnManager.resolveSpawnPoint();
    const maxHealth = MAX_HEALTH_BY_DIFFICULTY[difficulty];
    setEntity(
      factory.spawn(config, spawnPoint, { statsOverrides: { maxHealth, currentHealth: maxHealth } })
    );
  }, [
    isTerrainReady,
    animationConfig,
    entity,
    worldManager,
    factory,
    selectedCharacterId,
    selectedModelAssetId,
    difficulty,
  ]);

  /**
   * "Continue" only means anything if this actually loads the save —
   * spawning at the default point and stopping there (the previous
   * behavior) made Continue functionally identical to New Game. Runs
   * once the player has spawned at the default point (so there's
   * something to override) and only when arriving via ?continue=1;
   * the ref guard prevents a second attempt if this effect re-fires
   * for an unrelated dependency change.
   */
  const hasAttemptedRestoreRef = useRef(false);
  useEffect(() => {
    if (!entity || searchParams.get("continue") !== "1" || hasAttemptedRestoreRef.current) {
      return;
    }
    hasAttemptedRestoreRef.current = true;
    gameplayServices.saveManager
      .loadFromStorage()
      .then((save) => {
        if (save) {
          gameplayServices.saveManager.restoreFromSnapshot(save);
        }
      })
      .catch(() => {
        // A failed/corrupt save shouldn't block play — the player
        // just starts from the default spawn point instead.
      });
  }, [entity, gameplayServices, searchParams]);

  const preloadAssetIds = useMemo(
    () => [CHARACTER_MODEL_ASSET_IDS.BOY, CHARACTER_MODEL_ASSET_IDS.GIRL],
    []
  );
  const preload = useAssetPreloader(preloadAssetIds);

  const isReady = data !== null && entity !== null && animationConfig !== null;

  if (error) {
    return <div className="p-6 text-red-400">Failed to load character: {error}</div>;
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={() => {
        void containerRef.current?.requestPointerLock();
      }}
      className="relative h-full w-full"
    >
      {(isLoading || !isReady) && (
        <LoadingScreen preload={preload} title="Garden of Beginnings" />
      )}

      <GameCanvas isPaused={isPaused} antialias={qualityPreset.antialias}>
        <GardenOfBeginningsScene
          qualityPreset={qualityPreset}
          onGroundHeightReady={handleGroundHeightReady}
          onStoneInteract={handleStoneInteract}
        />
        <NpcField
          worldRegionId={GARDEN_REGION_ID}
          activeNpcId={dialogueFlow.activeNpcId}
          playerEntity={entity}
          onInteract={(npcId) => {
            dialogueFlow.startDialogue(npcId);
            theBeginningFlow.handleReturnToElder();
          }}
        />
        <InteractableObject
          id={ANCIENT_TREE_ID}
          position={ANCIENT_TREE_POSITION}
          promptText="Inspect the Ancient Tree"
          color="#5a4530"
          onInteract={theBeginningFlow.handleTreeInspect}
        />
        <InteractableObject
          id={GENESIS_STONE_ID}
          position={GENESIS_STONE_POSITION}
          promptText="Read the Genesis Stone"
          color="#c9a84c"
          onInteract={theBeginningFlow.handleGenesisStoneInteract}
        />
        {SEED_IDS.map((seedId, index) => {
          const seedPosition = SEED_POSITIONS[index];
          if (!seedPosition) {
            return null;
          }
          return (
            <GlowingSeed
              key={seedId}
              id={seedId}
              position={seedPosition}
              onCollected={theBeginningFlow.handleSeedCollected}
            />
          );
        })}
        {isCelebrationEffectActive && entity && (
          <QuestCelebrationEffect
            position={[entity.getPosition().x, entity.getPosition().y + 1, entity.getPosition().z]}
            onFinished={() => {
              setIsCelebrationEffectActive(false);
            }}
          />
        )}
        {isReady && (
          <CharacterScene
            entity={entity}
            gltf={data.gltf}
            clips={data.gltf.animations}
            animationConfig={animationConfig}
            inputSystem={inputSystem}
            cameraControllerRef={cameraControllerRef}
            invertY={invertY}
          >
            {({ inputFrameRef }) => (
              <InteractionDriver player={entity} inputFrameRef={inputFrameRef} />
            )}
          </CharacterScene>
        )}
        {import.meta.env.DEV && <CollisionDebugPanel />}
      </GameCanvas>

      <GameplayEventBridge />
      <OfflineIndicator />
      {isPaused && (
        <PauseMenu
          onResume={() => {
            setIsPaused(false);
          }}
        />
      )}
      {isJournalOpen && (
        <JournalScreen
          onClose={() => {
            setIsJournalOpen(false);
          }}
        />
      )}
      {isInventoryOpen && (
        <InventoryScreen
          onClose={() => {
            setIsInventoryOpen(false);
          }}
        />
      )}
      {dialogueFlow.snapshot && (
        <DialogueBox
          snapshot={dialogueFlow.snapshot}
          onAdvance={dialogueFlow.advance}
          onChoose={dialogueFlow.choose}
          onClose={dialogueFlow.close}
        />
      )}
      {import.meta.env.DEV && (
        <GameplayDevTools playerEntity={entity} dialogueSnapshot={dialogueFlow.snapshot} />
      )}
      <DebugPanel />
      <GameplayHud />
      {celebratingQuestTitle && (
        <QuestCompleteBanner
          questTitle={celebratingQuestTitle}
          onFinished={() => {
            setCelebratingQuestTitle(null);
          }}
        />
      )}
      {tutorial.isActive && tutorial.currentStep && (
        <TutorialOverlay step={tutorial.currentStep} onSkip={tutorial.skip} />
      )}
      {crosshairEnabled && (
        <div className="pointer-events-none fixed left-1/2 top-1/2 z-20 h-4 w-4 -translate-x-1/2 -translate-y-1/2">
          <div className="absolute left-1/2 top-0 h-4 w-0.5 -translate-x-1/2 bg-light-divine opacity-70" />
          <div className="absolute left-0 top-1/2 h-0.5 w-4 -translate-y-1/2 bg-light-divine opacity-70" />
        </div>
      )}
      <ProgressWidget />
      <QuestTracker />
      <InteractionPromptUI />
      <InventoryWindow />
      <ScriptureWindow />
      <NotificationSystem />
      <VersePopup />
      <RewardPopup />
      <AchievementPopup />

      <div className="pointer-events-none fixed left-4 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-2">
        <WorldDebugPanel worldManager={worldManager} />
        <ScriptureDebugPanel />
        {import.meta.env.DEV && <CameraDebugPanel controllerRef={cameraControllerRef} />}
      </div>

      <div className="pointer-events-none fixed bottom-16 left-1/2 z-30 -translate-x-1/2 rounded-md border border-garden-700 bg-black/70 px-3 py-1 text-center font-mono text-xs text-light-divine">
        Click canvas to lock mouse · WASD move · Shift sprint · Space jump · E interact
      </div>
    </div>
  );
}

/**
 * Milestone 5 deliverable route: the first complete playable world.
 * Reuses EngineProvider/GameCanvas/DebugPanel (Milestone 2), the
 * character controller (Milestone 3), and every gameplay system
 * (Milestone 4) without modification — only the environment and world
 * systems are new here.
 */
export function GardenOfBeginningsPage() {
  return (
    <EngineProvider>
      <GameplayProvider>
        <GardenContent />
      </GameplayProvider>
    </EngineProvider>
  );
}

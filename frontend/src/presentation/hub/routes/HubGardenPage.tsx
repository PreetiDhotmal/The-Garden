import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { EngineProvider } from "@/presentation/engine/providers/EngineProvider";
import { GameplayProvider } from "@/presentation/gameplay/providers/GameplayProvider";
import { GameFrameworkProvider } from "@/presentation/game/GameFrameworkProvider";
import { useRegisterCoreAssets } from "@/presentation/engine/assetBootstrap/useRegisterCoreAssets";
import { useRegisterEnvironmentProps } from "@/presentation/engine/assetBootstrap/useRegisterEnvironmentProps";
import { SceneErrorBoundary } from "@/presentation/engine/components/SceneErrorBoundary";
import { useGameFramework } from "@/presentation/game/hooks/useGameFramework";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { GameCanvas } from "@/presentation/engine/components/GameCanvas";
import { LoadingScreen } from "@/presentation/engine/components/LoadingScreen";
import { useAssetPreloader } from "@/presentation/engine/hooks/useAssetPreloader";
import { HubGardenScene } from "@/presentation/hub/components/HubGardenScene";
import { ChapterGatePanel } from "@/presentation/hub/components/ChapterGatePanel";
import { CHAPTER_META_BY_ID } from "@/presentation/hub/chapterData";
import { CharacterScene } from "@/presentation/character/components/CharacterScene";
import { InputSystem } from "@/infrastructure/input/InputSystem";
import { createInputMapWithOverrides } from "@/domain/input/InputMap";
import { KeyboardInputSource } from "@/infrastructure/input/KeyboardInputSource";
import { MouseInputSource } from "@/infrastructure/input/MouseInputSource";
import { GamepadInputSource } from "@/infrastructure/input/GamepadInputSource";
import { CharacterFactory } from "@/domain/character/CharacterFactory";
import { createCharacterConfig } from "@/domain/engine/config/CharacterConfig";
import { CharacterType } from "@/domain/character/CharacterType";
import { CHARACTER_MODEL_ASSET_IDS } from "@/presentation/character/characterModelAssets";
import { useCharacterAssets } from "@/presentation/character/hooks/useCharacterAssets";
import {
  createBoyAnimationConfig,
  createGirlAnimationConfig,
} from "@/infrastructure/character/defaultAnimationConfigs";
import type { CharacterEntity } from "@/domain/character/CharacterEntity";
import type { ThirdPersonCameraController } from "@/infrastructure/camera/ThirdPersonCameraController";
import { GameplayEventBridge } from "@/presentation/gameplay/components/GameplayEventBridge";
import { GameplayHud } from "@/presentation/gameplay/components/GameplayHud";
import { InteractionDriver } from "@/presentation/gameplay/components/InteractionDriver";
import { InteractionPromptUI } from "@/presentation/gameplay/components/InteractionPromptUI";
import { PauseMenu } from "@/presentation/gameplay/components/PauseMenu";
import { JournalScreen } from "@/presentation/gameplay/components/JournalScreen";
import { InventoryScreen } from "@/presentation/gameplay/components/InventoryScreen";
import { useSettingsStore, MAX_HEALTH_BY_DIFFICULTY } from "@/presentation/settings/settingsStore";
import { useKeyBindingsStore } from "@/presentation/settings/keyBindingsStore";
import { InputAction } from "@/domain/input/InputAction";
import { GRAPHICS_QUALITY_PRESETS } from "@/domain/engine/config/GraphicsQualityPreset";
import {
  useCharacterSelectionStore,
  PLAYABLE_CHARACTERS,
} from "@/presentation/character/stores/characterSelectionStore";
import type { WorldProgressionQueryContext } from "@/domain/gameplay/progression/WorldUnlockCondition";
import { WorldProgressionStatus } from "@/domain/gameplay/progression/WorldProgressionManager";

export interface HubGardenContentProps {
  /** Set when arriving via Continue rather than New Game — triggers loading and restoring the last save once the player has spawned. */
  readonly shouldLoadSave?: boolean;
}

export function HubGardenContent({ shouldLoadSave = false }: HubGardenContentProps = {}) {
  useRegisterCoreAssets();
  useRegisterEnvironmentProps();
  const gameplayServices = useGameplay();
  const { chapterManager, gardenRestorationManager } = useGameFramework();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraControllerRef = useRef<ThirdPersonCameraController | null>(null);
  const inputSystem = useMemo(() => new InputSystem(), []);
  const factory = useMemo(() => new CharacterFactory(), []);

  const selectedCharacterId =
    useCharacterSelectionStore((state) => state.selectedCharacterId) ?? "boy";
  const selectedModelAssetId = PLAYABLE_CHARACTERS[selectedCharacterId].modelAssetId;
  const createAnimationConfig =
    selectedCharacterId === "girl" ? createGirlAnimationConfig : createBoyAnimationConfig;
  const { data, isLoading, error } = useCharacterAssets(selectedModelAssetId);
  const mouseSensitivity = useSettingsStore((state) => state.mouseSensitivity);
  const difficulty = useSettingsStore((state) => state.difficulty);
  const graphicsQuality = useSettingsStore((state) => state.graphicsQuality);
  const invertY = useSettingsStore((state) => state.invertY);
  const qualityPreset = GRAPHICS_QUALITY_PRESETS[graphicsQuality];
  const keyBindingOverrides = useKeyBindingsStore((state) => state.overrides);

  const [entity, setEntity] = useState<CharacterEntity | null>(null);
  const [isTerrainReady, setIsTerrainReady] = useState(false);
  const groundHeightRef = useRef<((x: number, z: number) => number) | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [openChapterId, setOpenChapterId] = useState<string | null>(null);
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null);

  const getProgressionContext = useCallback(
    (): WorldProgressionQueryContext => ({
      getQuestStatus: (questId) =>
        gameplayServices.questRegistry.has(questId)
          ? gameplayServices.questRegistry.get(questId).status
          : null,
      isScriptureUnlocked: (referenceKey) =>
        gameplayServices.scriptureProgressRef.current.listDiscoveredKeys().includes(referenceKey),
      hasStoryFlag: (flag) => gameplayServices.storyFlags.has(flag),
    }),
    [gameplayServices]
  );

  useEffect(() => {
    gameplayServices.worldSaveContextRef.current = {
      getCurrentWorldId: () => "hub-world",
      getUnlockedWorldIds: () =>
        chapterManager
          .listInOrder(getProgressionContext())
          .filter((chapter) => chapter.status !== WorldProgressionStatus.LOCKED)
          .map((chapter) => chapter.definition.chapterId),
      getPlayerPosition: () => (entity ? entity.getPosition() : { x: 0, y: 0, z: 22 }),
      getPlayerYaw: () => (entity ? entity.getYaw() : Math.PI),
      restorePlayerPosition: (position, yaw) => {
        entity?.setPosition(position);
        entity?.setYaw(yaw);
      },
      getCameraState: () => cameraControllerRef.current?.getOrbitState() ?? null,
      restoreCameraState: (state) => {
        cameraControllerRef.current?.restoreOrbitState(state);
      },
      getTotalPlaytimeSeconds: () => 0,
      restoreTotalPlaytimeSeconds: () => {
        // Not tracked for the Hub this pass — matches every other route's current limitation.
      },
      getGardenRestorationState: () => gardenRestorationManager.listRestoredZones(),
      restoreGardenRestorationState: (state) => {
        for (const { zoneId, profile } of state) {
          gardenRestorationManager.restoreZoneProfile(zoneId, profile);
        }
      },
      getCurrentChapterId: () => currentChapterId,
      restoreCurrentChapterId: (chapterId) => {
        setCurrentChapterId(chapterId);
      },
    };
  }, [
    gameplayServices,
    entity,
    chapterManager,
    gardenRestorationManager,
    currentChapterId,
    getProgressionContext,
  ]);

  const preloadAssetIds = useMemo(
    () => [CHARACTER_MODEL_ASSET_IDS.BOY, CHARACTER_MODEL_ASSET_IDS.GIRL],
    []
  );
  const preload = useAssetPreloader(preloadAssetIds);

  /**
   * Runs once the player has spawned (so there's a position/camera to
   * override) and only when arriving via Continue. Matches
   * GardenOfBeginningsPage's established ?continue=1 pattern exactly,
   * adapted from a URL param to a prop since the Hub renders inline
   * within GameRoot's state switch rather than through navigation.
   */
  const hasAttemptedRestoreRef = useRef(false);
  useEffect(() => {
    if (!entity || !shouldLoadSave || hasAttemptedRestoreRef.current) {
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
        // A failed/corrupt save shouldn't block play — the player just starts fresh instead.
      });
  }, [entity, shouldLoadSave, gameplayServices]);

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

  const isReady = data !== null && entity !== null && animationConfig !== null;

  const handleGroundHeightReady = (heightFunction: (x: number, z: number) => number) => {
    if (groundHeightRef.current) {
      return;
    }
    groundHeightRef.current = heightFunction;
    setIsTerrainReady(true);
  };

  useEffect(() => {
    if (!isTerrainReady || !animationConfig || entity || !groundHeightRef.current) {
      return;
    }
    const config = createCharacterConfig({
      id: `character:${selectedCharacterId}`,
      type: CharacterType.PLAYER,
      modelAssetId: selectedModelAssetId,
      animationConfigId: animationConfig.id,
    });
    const spawnHeight = groundHeightRef.current(0, 22);
    const maxHealth = MAX_HEALTH_BY_DIFFICULTY[difficulty];
    setEntity(
      factory.spawn(
        config,
        {
          id: "spawn:hub-entrance",
          position: { x: 0, y: spawnHeight + 1, z: 22 },
          facingYaw: Math.PI,
        },
        { statsOverrides: { maxHealth, currentHealth: maxHealth } }
      )
    );
  }, [
    isTerrainReady,
    animationConfig,
    entity,
    factory,
    selectedCharacterId,
    selectedModelAssetId,
    difficulty,
  ]);

  const chapters = chapterManager.listInOrder(getProgressionContext());
  const openChapterIndex = chapters.findIndex((c) => c.definition.chapterId === openChapterId);
  const openChapter = openChapterIndex >= 0 ? chapters[openChapterIndex] : null;
  const openChapterMeta = openChapterId ? CHAPTER_META_BY_ID.get(openChapterId) : null;
  const previousChapter = openChapterIndex > 0 ? chapters[openChapterIndex - 1] : null;

  return (
    <div
      ref={containerRef}
      onPointerDown={() => {
        void containerRef.current?.requestPointerLock();
      }}
      className="relative h-full w-full"
    >
      {(isLoading || !isReady) && <LoadingScreen preload={preload} title="The Garden" />}

      <GameCanvas
        isPaused={isPaused}
        antialias={qualityPreset.antialias}
        enablePostProcessing
      >
        <SceneErrorBoundary sceneName="hub-garden">
          <HubGardenScene
            qualityPreset={qualityPreset}
            onGroundHeightReady={handleGroundHeightReady}
            getProgressionContext={getProgressionContext}
            onGateInteract={(chapterId) => {
              setOpenChapterId(chapterId);
            }}
          />
        </SceneErrorBoundary>
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
      </GameCanvas>

      <GameplayEventBridge />
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
      {openChapter && openChapterMeta && (
        <ChapterGatePanel
          meta={openChapterMeta}
          status={openChapter.status}
          previousChapterDisplayName={
            previousChapter?.status !== WorldProgressionStatus.COMPLETED
              ? (previousChapter?.definition.displayName ?? null)
              : null
          }
          onClose={() => {
            setOpenChapterId(null);
          }}
          onStart={() => {
            if (openChapterId === "chapter:communication") {
              void navigate("/level/communication");
              return;
            }
            if (openChapterId === "chapter:trust") {
              void navigate("/level/trust");
              return;
            }
            // Every other chapter's gameplay content is not yet built —
            // honestly reflecting that rather than faking a level.
            setOpenChapterId(null);
          }}
        />
      )}
      <GameplayHud />
      <InteractionPromptUI />
      {error && (
        <div className="fixed bottom-4 left-4 z-30 rounded bg-red-900/80 px-3 py-2 text-sm text-white">
          Failed to load character assets.
        </div>
      )}
    </div>
  );
}

export function HubGardenPage() {
  return (
    <EngineProvider>
      <GameplayProvider>
        <GameFrameworkProvider>
          <HubGardenContent shouldLoadSave />
        </GameFrameworkProvider>
      </GameplayProvider>
    </EngineProvider>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { EngineProvider } from "@/presentation/engine/providers/EngineProvider";
import { GameplayProvider } from "@/presentation/gameplay/providers/GameplayProvider";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { useEngine } from "@/presentation/engine/hooks/useEngine";
import { useRegisterCoreAssets } from "@/presentation/engine/assetBootstrap/useRegisterCoreAssets";
import { InteractionDriver } from "@/presentation/gameplay/components/InteractionDriver";
import { InteractionPromptUI } from "@/presentation/gameplay/components/InteractionPromptUI";
import { GameCanvas } from "@/presentation/engine/components/GameCanvas";
import { LoadingScreen } from "@/presentation/engine/components/LoadingScreen";
import { useAssetPreloader } from "@/presentation/engine/hooks/useAssetPreloader";
import { DebugPanel } from "@/presentation/engine/components/DebugPanel";
import { WorldManager } from "@/infrastructure/world/WorldManager";
import { WildernessScene } from "@/presentation/world/components/WildernessScene";
import { WorldDebugPanel } from "@/presentation/world/components/WorldDebugPanel";
import {
  setupTheWilderness,
  WILDERNESS_REGION_ID,
  GUIDE_POSITION,
} from "@/presentation/world/wildernessContent";
import { useWildernessQuestFlow } from "@/presentation/world/useWildernessQuestFlow";
import { NpcField } from "@/presentation/gameplay/components/npc/NpcField";
import { useNpcDialogueFlow } from "@/presentation/gameplay/hooks/useNpcDialogueFlow";
import { DialogueBox } from "@/presentation/gameplay/components/dialogue/DialogueBox";
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
import { CameraDebugPanel } from "@/presentation/world/components/CameraDebugPanel";
import { CollisionDebugPanel } from "@/presentation/world/components/CollisionDebugPanel";
import { GameplayEventBridge } from "@/presentation/gameplay/components/GameplayEventBridge";
import { OfflineIndicator } from "@/presentation/gameplay/components/scripture/OfflineIndicator";
import { GameplayHud } from "@/presentation/gameplay/components/GameplayHud";
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
import { ScriptureWindow } from "@/presentation/gameplay/components/ScriptureWindow";
import {
  INITIAL_SURVIVAL_STATS,
  drainThirst,
  updateStamina,
  drinkWater,
} from "@/domain/gameplay/survival/SurvivalStats";
import { SurvivalHud } from "@/presentation/world/components/SurvivalHud";
import { CharacterState } from "@/domain/character/CharacterState";

function WildernessContent() {
  useRegisterCoreAssets();
  const { assetManager } = useEngine();
  const gameplayServices = useGameplay();
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraControllerRef = useRef<ThirdPersonCameraController | null>(null);
  const inputSystem = useMemo(() => new InputSystem(), []);
  const factory = useMemo(() => new CharacterFactory(), []);
  const worldManager = useMemo(() => new WorldManager(assetManager), [assetManager]);
  const dialogueFlow = useNpcDialogueFlow();
  const wildernessFlow = useWildernessQuestFlow(worldManager, () => {
    setSurvivalStats((stats) => drinkWater(stats, 100));
  });

  const selectedCharacterId = useCharacterSelectionStore((state) => state.selectedCharacterId) ?? "boy";
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
  const [survivalStats, setSurvivalStats] = useState(INITIAL_SURVIVAL_STATS);

  const preloadAssetIds = useMemo(
    () => [CHARACTER_MODEL_ASSET_IDS.BOY, CHARACTER_MODEL_ASSET_IDS.GIRL],
    []
  );
  const preload = useAssetPreloader(preloadAssetIds);

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
    setupTheWilderness(worldManager, gameplayServices, heightFunction);
    setIsTerrainReady(true);
  };

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

  useEffect(() => {
    gameplayServices.worldSaveContextRef.current = {
      getCurrentWorldId: () => WILDERNESS_REGION_ID,
      getUnlockedWorldIds: () => [WILDERNESS_REGION_ID],
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
      getTotalPlaytimeSeconds: () => 0,
      restoreTotalPlaytimeSeconds: () => {
        // Not tracked for this route this pass — see known limitations.
      },
    };
  }, [gameplayServices, entity]);

  useEffect(() => {
    if (isPaused) {
      return;
    }
    const interval = window.setInterval(() => {
      setSurvivalStats((stats) => drainThirst(stats, 1, false));
    }, 1000);
    return () => {
      window.clearInterval(interval);
    };
  }, [isPaused]);

  useEffect(() => {
    if (!entity) {
      return;
    }
    const interval = window.setInterval(() => {
      setSurvivalStats((stats) =>
        updateStamina(stats, 0.2, entity.getLocomotionState() === CharacterState.SPRINTING)
      );
    }, 200);
    return () => {
      window.clearInterval(interval);
    };
  }, [entity]);

  return (
    <div
      ref={containerRef}
      onPointerDown={() => {
        void containerRef.current?.requestPointerLock();
      }}
      className="relative h-full w-full"
    >
      {(isLoading || !isReady) && <LoadingScreen preload={preload} title="The Wilderness" />}

      <GameCanvas isPaused={isPaused} antialias={qualityPreset.antialias}>
        <WildernessScene
          qualityPreset={qualityPreset}
          onGroundHeightReady={handleGroundHeightReady}
          onOasisInteract={wildernessFlow.handleOasisInteract}
          onTemptationInteract={wildernessFlow.handleTemptationInteract}
          onMatthewStoneInteract={wildernessFlow.handleMatthewStoneInteract}
          onMannaCollected={wildernessFlow.handleMannaCollected}
        />
        <NpcField
          worldRegionId={WILDERNESS_REGION_ID}
          activeNpcId={dialogueFlow.activeNpcId}
          playerEntity={entity}
          onInteract={dialogueFlow.startDialogue}
        />
        {import.meta.env.DEV && <CollisionDebugPanel />}
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

      <InteractionPromptUI />

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
      <GameplayHud />
      <SurvivalHud stats={survivalStats} />
      <ScriptureWindow />
      <div className="pointer-events-none fixed left-4 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-2">
        {import.meta.env.DEV && <WorldDebugPanel worldManager={worldManager} />}
        {import.meta.env.DEV && <CameraDebugPanel controllerRef={cameraControllerRef} />}
      </div>
      <DebugPanel />
      {error && (
        <div className="fixed bottom-4 left-4 z-30 rounded bg-red-900/80 px-3 py-2 text-sm text-white">
          Failed to load character assets.
        </div>
      )}
      <p className="pointer-events-none fixed bottom-4 left-1/2 z-10 -translate-x-1/2 text-xs text-garden-700">
        The Guide waits near the entrance at ({GUIDE_POSITION.x}, {GUIDE_POSITION.z})
      </p>
    </div>
  );
}

export function WildernessPage() {
  return (
    <EngineProvider>
      <GameplayProvider>
        <WildernessContent />
      </GameplayProvider>
    </EngineProvider>
  );
}

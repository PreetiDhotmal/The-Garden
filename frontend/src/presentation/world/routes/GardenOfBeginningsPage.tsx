import { useEffect, useMemo, useRef, useState } from "react";
import { EngineProvider } from "@/presentation/engine/providers/EngineProvider";
import { GameCanvas } from "@/presentation/engine/components/GameCanvas";
import { DebugPanel } from "@/presentation/engine/components/DebugPanel";
import { useEngine } from "@/presentation/engine/hooks/useEngine";
import { CharacterType } from "@/domain/character/CharacterType";
import { CharacterFactory } from "@/domain/character/CharacterFactory";
import type { CharacterEntity } from "@/domain/character/CharacterEntity";
import { createCharacterConfig } from "@/domain/engine/config/CharacterConfig";
import { createBoyAnimationConfig } from "@/infrastructure/character/defaultAnimationConfigs";
import { InputSystem } from "@/infrastructure/input/InputSystem";
import { KeyboardInputSource } from "@/infrastructure/input/KeyboardInputSource";
import { MouseInputSource } from "@/infrastructure/input/MouseInputSource";
import { GamepadInputSource } from "@/infrastructure/input/GamepadInputSource";
import { createDefaultInputMap } from "@/domain/input/InputMap";
import {
  CHARACTER_MODEL_ASSET_IDS,
  CHARACTER_MODEL_URLS,
} from "@/presentation/character/characterModelAssets";
import { createAssetDescriptor } from "@/domain/engine/assets/AssetDescriptor";
import { AssetType } from "@/domain/engine/assets/AssetType";
import { CharacterScene } from "@/presentation/character/components/CharacterScene";
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
import { setupGardenOfBeginnings, GARDEN_REGION_ID } from "@/presentation/world/gardenOfBeginningsContent";
import { useScriptureStoneFlow } from "@/presentation/world/useScriptureStoneFlow";
import { NpcField } from "@/presentation/gameplay/components/npc/NpcField";
import { useNpcDialogueFlow } from "@/presentation/gameplay/hooks/useNpcDialogueFlow";
import { DialogueBox } from "@/presentation/gameplay/components/dialogue/DialogueBox";
import { GameplayDevTools } from "@/presentation/gameplay/components/devtools/GameplayDevTools";

function GardenContent() {
  const { assetRegistry, assetManager } = useEngine();
  const gameplayServices = useGameplay();
  const { data, isLoading, error } = useCharacterAssets(CHARACTER_MODEL_ASSET_IDS.BOY);
  const { handleStoneInteract } = useScriptureStoneFlow();

  const worldManager = useMemo(() => new WorldManager(assetManager), [assetManager]);
  const factory = useMemo(() => new CharacterFactory(), []);
  const inputSystem = useMemo(() => new InputSystem(), []);
  const containerRef = useRef<HTMLDivElement>(null);
  const [entity, setEntity] = useState<CharacterEntity | null>(null);
  const groundHeightRef = useRef<((x: number, z: number) => number) | null>(null);
  const dialogueFlow = useNpcDialogueFlow();

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
    };
  }, [gameplayServices, entity]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    const inputMap = createDefaultInputMap();
    inputSystem.addSource(new KeyboardInputSource(inputMap));
    inputSystem.addSource(new MouseInputSource(containerRef.current));
    inputSystem.addSource(new GamepadInputSource(inputMap));
    return () => {
      inputSystem.removeAllSources();
    };
  }, [inputSystem]);

  const animationConfig = useMemo(() => {
    if (!data) {
      return null;
    }
    return createBoyAnimationConfig(data.clipRegistry);
  }, [data]);

  const handleGroundHeightReady = (heightFunction: (x: number, z: number) => number) => {
    if (groundHeightRef.current) {
      return;
    }
    groundHeightRef.current = heightFunction;
    setupGardenOfBeginnings(worldManager, gameplayServices, heightFunction);

    if (!animationConfig) {
      return;
    }
    const config = createCharacterConfig({
      id: "character:boy",
      type: CharacterType.PLAYER,
      modelAssetId: CHARACTER_MODEL_ASSET_IDS.BOY,
      animationConfigId: animationConfig.id,
    });
    const spawnPoint = worldManager.spawnManager.resolveSpawnPoint();
    setEntity(factory.spawn(config, spawnPoint));
  };

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
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-shadow-valley text-light-divine">
          Entering the Garden of Beginnings…
        </div>
      )}

      <GameCanvas>
        <GardenOfBeginningsScene
          onGroundHeightReady={handleGroundHeightReady}
          onStoneInteract={handleStoneInteract}
        />
        <NpcField
          worldRegionId={GARDEN_REGION_ID}
          activeNpcId={dialogueFlow.activeNpcId}
          onInteract={dialogueFlow.startDialogue}
        />
        {isReady && (
          <CharacterScene
            entity={entity}
            gltf={data.gltf}
            clips={data.gltf.animations}
            animationConfig={animationConfig}
            inputSystem={inputSystem}
          >
            {({ inputFrameRef }) => (
              <InteractionDriver player={entity} inputFrameRef={inputFrameRef} />
            )}
          </CharacterScene>
        )}
      </GameCanvas>

      <GameplayEventBridge />
      <OfflineIndicator />
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

import { useEffect, useMemo, useRef, useState } from "react";
import { EngineProvider } from "@/presentation/engine/providers/EngineProvider";
import { GameCanvas } from "@/presentation/engine/components/GameCanvas";
import { DebugPanel } from "@/presentation/engine/components/DebugPanel";
import { useEngine } from "@/presentation/engine/hooks/useEngine";
import { createAssetDescriptor } from "@/domain/engine/assets/AssetDescriptor";
import { AssetType } from "@/domain/engine/assets/AssetType";
import { CharacterType } from "@/domain/character/CharacterType";
import { createSpawnPoint } from "@/domain/character/CharacterSpawnPoint";
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
import { CharacterScene } from "@/presentation/character/components/CharacterScene";
import { useCharacterAssets } from "@/presentation/character/hooks/useCharacterAssets";
import { GameplayProvider } from "@/presentation/gameplay/providers/GameplayProvider";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { InteractionDriver } from "@/presentation/gameplay/components/InteractionDriver";
import { InteractableObject } from "@/presentation/gameplay/components/InteractableObject";
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
import { OfflineIndicator } from "@/presentation/gameplay/components/scripture/OfflineIndicator";
import {
  setupVerticalSliceContent,
  VERTICAL_SLICE_STONE_ID,
} from "@/presentation/gameplay/verticalSliceContent";
import { useVerticalSliceFlow } from "./useVerticalSliceFlow";

function VerticalSliceContent() {
  const { assetRegistry } = useEngine();
  const gameplayServices = useGameplay();
  const { data, isLoading, error } = useCharacterAssets(CHARACTER_MODEL_ASSET_IDS.BOY);

  const factory = useMemo(() => new CharacterFactory(), []);
  const inputSystem = useMemo(() => new InputSystem(), []);
  const containerRef = useRef<HTMLDivElement>(null);
  const [entity, setEntity] = useState<CharacterEntity | null>(null);
  const { handleStoneInteract } = useVerticalSliceFlow();

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
    setupVerticalSliceContent(gameplayServices);
  }, [assetRegistry, gameplayServices]);

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

  useEffect(() => {
    if (!animationConfig) {
      return;
    }
    const config = createCharacterConfig({
      id: "character:boy",
      type: CharacterType.PLAYER,
      modelAssetId: CHARACTER_MODEL_ASSET_IDS.BOY,
      animationConfigId: animationConfig.id,
    });
    const spawnPoint = createSpawnPoint({ id: "default", position: { x: 0, y: 1, z: 0 } });
    setEntity(factory.spawn(config, spawnPoint));
  }, [animationConfig, factory]);

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
          Loading…
        </div>
      )}

      <GameCanvas>
        {isReady && (
          <CharacterScene
            entity={entity}
            gltf={data.gltf}
            clips={data.gltf.animations}
            animationConfig={animationConfig}
            inputSystem={inputSystem}
          >
            {({ inputFrameRef }) => (
              <>
                <InteractionDriver player={entity} inputFrameRef={inputFrameRef} />
                <InteractableObject
                  id={VERTICAL_SLICE_STONE_ID}
                  position={[4, 0.5, 4]}
                  promptText="Touch the Scripture Stone"
                  onInteract={handleStoneInteract}
                />
              </>
            )}
          </CharacterScene>
        )}
      </GameCanvas>

      <GameplayEventBridge />
      <OfflineIndicator />
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

      <div className="pointer-events-none fixed bottom-16 left-1/2 z-30 -translate-x-1/2 rounded-md border border-garden-700 bg-black/70 px-3 py-1 text-center font-mono text-xs text-light-divine">
        Click canvas to lock mouse · WASD move · Shift sprint · Space jump · E interact
      </div>
    </div>
  );
}

/**
 * Milestone 4 deliverable route: the complete gameplay loop —
 * spawn -> walk -> interaction prompt -> interact -> scripture
 * fragment -> verse popup -> quest progress -> reward -> completion ->
 * achievement popup — using mock data throughout, exactly as scoped.
 */
export function VerticalSlicePage() {
  return (
    <EngineProvider>
      <GameplayProvider>
        <VerticalSliceContent />
      </GameplayProvider>
    </EngineProvider>
  );
}

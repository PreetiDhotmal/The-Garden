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
import {
  createBoyAnimationConfig,
  createGirlAnimationConfig,
} from "@/infrastructure/character/defaultAnimationConfigs";
import { InputSystem } from "@/infrastructure/input/InputSystem";
import { KeyboardInputSource } from "@/infrastructure/input/KeyboardInputSource";
import { MouseInputSource } from "@/infrastructure/input/MouseInputSource";
import { GamepadInputSource } from "@/infrastructure/input/GamepadInputSource";
import { TouchInputSource } from "@/infrastructure/input/TouchInputSource";
import { createDefaultInputMap } from "@/domain/input/InputMap";
import { CHARACTER_MODEL_URLS } from "@/presentation/character/characterModelAssets";
import {
  PLAYABLE_CHARACTERS,
  type PlayableCharacterId,
} from "@/presentation/character/stores/characterSelectionStore";
import { CharacterSelectionScreen } from "@/presentation/character/components/CharacterSelectionScreen";
import { CharacterScene } from "@/presentation/character/components/CharacterScene";
import { CharacterDebugPanel } from "@/presentation/character/components/CharacterDebugPanel";
import { AnimationDebugPanel } from "@/presentation/character/components/AnimationDebugPanel";
import { useCharacterAssets } from "@/presentation/character/hooks/useCharacterAssets";
import type { AssetRegistry } from "@/domain/engine/assets/AssetRegistry";
import type { CharacterAnimationConfig } from "@/domain/character/animation/CharacterAnimationConfig";

function registerCharacterModelAssets(assetRegistry: AssetRegistry): void {
  for (const [assetId, url] of Object.entries(CHARACTER_MODEL_URLS)) {
    if (!assetRegistry.has(assetId)) {
      assetRegistry.register(
        createAssetDescriptor({ id: assetId, type: AssetType.MODEL, url, priority: "critical" })
      );
    }
  }
}

function buildAnimationConfigFor(
  characterId: PlayableCharacterId,
  clipRegistry: NonNullable<ReturnType<typeof useCharacterAssets>["data"]>["clipRegistry"]
): CharacterAnimationConfig {
  return characterId === "boy"
    ? createBoyAnimationConfig(clipRegistry)
    : createGirlAnimationConfig(clipRegistry);
}

interface ActiveCharacterExperienceProps {
  readonly characterId: PlayableCharacterId;
}

function ActiveCharacterExperience({ characterId }: ActiveCharacterExperienceProps) {
  const modelAssetId = PLAYABLE_CHARACTERS[characterId].modelAssetId;
  const { data, isLoading, error } = useCharacterAssets(modelAssetId);

  const factory = useMemo(() => new CharacterFactory(), []);
  const inputSystem = useMemo(() => new InputSystem(), []);
  const containerRef = useRef<HTMLDivElement>(null);
  const [entity, setEntity] = useState<CharacterEntity | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    const inputMap = createDefaultInputMap();
    inputSystem.addSource(new KeyboardInputSource(inputMap));
    inputSystem.addSource(new MouseInputSource(containerRef.current));
    inputSystem.addSource(new GamepadInputSource(inputMap));
    inputSystem.addSource(new TouchInputSource(containerRef.current));
    return () => {
      inputSystem.removeAllSources();
    };
  }, [inputSystem]);

  const animationConfig = useMemo(() => {
    if (!data) {
      return null;
    }
    return buildAnimationConfigFor(characterId, data.clipRegistry);
  }, [data, characterId]);

  useEffect(() => {
    if (!animationConfig) {
      return;
    }
    const config = createCharacterConfig({
      id: `character:${characterId}`,
      type: CharacterType.PLAYER,
      modelAssetId,
      animationConfigId: animationConfig.id,
    });
    const spawnPoint = createSpawnPoint({ id: "default", position: { x: 0, y: 1, z: 0 } });
    setEntity(factory.spawn(config, spawnPoint));
  }, [animationConfig, characterId, modelAssetId, factory]);

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
          Loading {PLAYABLE_CHARACTERS[characterId].label}…
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
          />
        )}
      </GameCanvas>
      <DebugPanel />
      {isReady && (
        <div className="pointer-events-none fixed bottom-4 left-4 z-40 flex flex-col gap-2">
          <div className="pointer-events-auto">
            <CharacterDebugPanel entity={entity} />
          </div>
          <div className="pointer-events-auto">
            <AnimationDebugPanel clipRegistry={data.clipRegistry} animationConfig={animationConfig} />
          </div>
        </div>
      )}
      <div className="pointer-events-none fixed bottom-4 right-4 z-40 rounded-md border border-garden-700 bg-black/70 p-2 font-mono text-xs text-light-divine">
        Click canvas to lock mouse look · WASD move · Shift sprint · Space jump
      </div>
    </div>
  );
}

interface CharacterAssetBootstrapProps {
  readonly characterId: PlayableCharacterId;
}

function CharacterAssetBootstrap({ characterId }: CharacterAssetBootstrapProps) {
  const { assetRegistry } = useEngine();
  useEffect(() => {
    registerCharacterModelAssets(assetRegistry);
  }, [assetRegistry]);
  return <ActiveCharacterExperience characterId={characterId} />;
}

/**
 * Full character experience: selection screen, then spawn + third-
 * person controller + debug tools. This is the Milestone 3 deliverable
 * route — reuses EngineProvider/GameCanvas/DebugPanel from Milestone 2
 * rather than duplicating engine bootstrap.
 */
export function CharacterExperiencePage() {
  const [confirmedCharacterId, setConfirmedCharacterId] = useState<PlayableCharacterId | null>(null);

  return (
    <EngineProvider>
      <div className="h-full w-full">
        {confirmedCharacterId ? (
          <CharacterAssetBootstrap characterId={confirmedCharacterId} />
        ) : (
          <CharacterSelectionScreen
            onConfirm={(id) => {
              setConfirmedCharacterId(id);
            }}
          />
        )}
      </div>
    </EngineProvider>
  );
}

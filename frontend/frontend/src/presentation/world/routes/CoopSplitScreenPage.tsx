import { useEffect, useMemo, useRef, useState } from "react";
import { PerspectiveCamera } from "three";
import { EngineProvider } from "@/presentation/engine/providers/EngineProvider";
import { useRegisterCoreAssets } from "@/presentation/engine/assetBootstrap/useRegisterCoreAssets";
import { InteractionDriver } from "@/presentation/gameplay/components/InteractionDriver";
import { InteractionPromptUI } from "@/presentation/gameplay/components/InteractionPromptUI";
import { GameplayProvider } from "@/presentation/gameplay/providers/GameplayProvider";
import { GameCanvas } from "@/presentation/engine/components/GameCanvas";
import { SplitScreenRenderer } from "@/presentation/engine/components/SplitScreenRenderer";
import { GardenOfBeginningsScene } from "@/presentation/world/components/GardenOfBeginningsScene";
import { CharacterScene } from "@/presentation/character/components/CharacterScene";
import { InputSystem } from "@/infrastructure/input/InputSystem";
import { createPlayerOneInputMap, createPlayerTwoInputMap } from "@/domain/input/InputMap";
import { KeyboardInputSource } from "@/infrastructure/input/KeyboardInputSource";
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
import { GRAPHICS_QUALITY_PRESETS } from "@/domain/engine/config/GraphicsQualityPreset";

/**
 * A validation route, not a designed level — proves two players can
 * exist, move independently (split keyboard, no mouse-look for P2
 * since local co-op can't split one mouse), and share one physics
 * world/scene simultaneously. Level 1's actual Communication puzzle
 * is a separate, not-yet-built task on top of this foundation.
 */
function CoopContent() {
  useRegisterCoreAssets();
  const factory = useMemo(() => new CharacterFactory(), []);

  const inputSystemOne = useMemo(() => new InputSystem(), []);
  const inputSystemTwo = useMemo(() => new InputSystem(), []);

  const cameraOne = useMemo(() => new PerspectiveCamera(60, 1, 0.1, 500), []);
  const cameraTwo = useMemo(() => new PerspectiveCamera(60, 1, 0.1, 500), []);

  const { data: boyData } = useCharacterAssets(CHARACTER_MODEL_ASSET_IDS.BOY);
  const { data: girlData } = useCharacterAssets(CHARACTER_MODEL_ASSET_IDS.GIRL);

  const [entityOne, setEntityOne] = useState<CharacterEntity | null>(null);
  const [entityTwo, setEntityTwo] = useState<CharacterEntity | null>(null);
  const [isTerrainReady, setIsTerrainReady] = useState(false);
  const groundHeightRef = useRef<((x: number, z: number) => number) | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasFocus, setHasFocus] = useState(false);

  useEffect(() => {
    inputSystemOne.addSource(new KeyboardInputSource(createPlayerOneInputMap()));
    return () => {
      inputSystemOne.removeAllSources();
    };
  }, [inputSystemOne]);

  useEffect(() => {
    inputSystemTwo.addSource(new KeyboardInputSource(createPlayerTwoInputMap()));
    return () => {
      inputSystemTwo.removeAllSources();
    };
  }, [inputSystemTwo]);

  const handleGroundHeightReady = (heightFunction: (x: number, z: number) => number) => {
    if (groundHeightRef.current) {
      return;
    }
    groundHeightRef.current = heightFunction;
    setIsTerrainReady(true);
  };

  const boyAnimationConfig = useMemo(
    () => (boyData ? createBoyAnimationConfig(boyData.clipRegistry) : null),
    [boyData]
  );
  const girlAnimationConfig = useMemo(
    () => (girlData ? createGirlAnimationConfig(girlData.clipRegistry) : null),
    [girlData]
  );

  useEffect(() => {
    if (!isTerrainReady || !boyAnimationConfig || !groundHeightRef.current || entityOne) {
      return;
    }
    const height = groundHeightRef.current(0, 8);
    const config = createCharacterConfig({
      id: "character:coop-player-one",
      type: CharacterType.PLAYER,
      modelAssetId: CHARACTER_MODEL_ASSET_IDS.BOY,
      animationConfigId: boyAnimationConfig.id,
    });
    setEntityOne(
      factory.spawn(config, {
        id: "spawn:coop-one",
        position: { x: -2, y: height + 1, z: 8 },
        facingYaw: 0,
      })
    );
  }, [isTerrainReady, boyAnimationConfig, entityOne, factory]);

  useEffect(() => {
    if (!isTerrainReady || !girlAnimationConfig || !groundHeightRef.current || entityTwo) {
      return;
    }
    const height = groundHeightRef.current(2, 8);
    const config = createCharacterConfig({
      id: "character:coop-player-two",
      type: CharacterType.PLAYER,
      modelAssetId: CHARACTER_MODEL_ASSET_IDS.GIRL,
      animationConfigId: girlAnimationConfig.id,
    });
    setEntityTwo(
      factory.spawn(config, {
        id: "spawn:coop-two",
        position: { x: 2, y: height + 1, z: 8 },
        facingYaw: 0,
      })
    );
  }, [isTerrainReady, girlAnimationConfig, entityTwo, factory]);

  const qualityPreset = GRAPHICS_QUALITY_PRESETS.high;
  const bothReady =
    entityOne && entityTwo && boyData && girlData && boyAnimationConfig && girlAnimationConfig;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onClick={() => {
        containerRef.current?.focus();
        setHasFocus(true);
      }}
      onFocus={() => {
        setHasFocus(true);
      }}
      className="relative h-full w-full outline-none"
    >
      {!hasFocus && (
        <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center bg-black/50 text-xl text-light-divine">
          Click anywhere to start
        </div>
      )}
      {!bothReady && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-shadow-valley text-light-divine">
          Entering the Garden together…
        </div>
      )}

      <GameCanvas>
        <GardenOfBeginningsScene
          qualityPreset={qualityPreset}
          onGroundHeightReady={handleGroundHeightReady}
          onStoneInteract={() => {
            // Co-op validation route — scripture stone reading isn't wired here yet.
          }}
        />

        {entityOne && boyData && boyAnimationConfig && (
          <CharacterScene
            entity={entityOne}
            gltf={boyData.gltf}
            clips={boyData.gltf.animations}
            animationConfig={boyAnimationConfig}
            inputSystem={inputSystemOne}
            cameraOverride={cameraOne}
            skipGroundPlane
          >
            {({ inputFrameRef }) => (
              <InteractionDriver player={entityOne} inputFrameRef={inputFrameRef} />
            )}
          </CharacterScene>
        )}
        {entityTwo && girlData && girlAnimationConfig && (
          <CharacterScene
            entity={entityTwo}
            gltf={girlData.gltf}
            clips={girlData.gltf.animations}
            animationConfig={girlAnimationConfig}
            inputSystem={inputSystemTwo}
            cameraOverride={cameraTwo}
            skipGroundPlane
          >
            {({ inputFrameRef }) => (
              <InteractionDriver player={entityTwo} inputFrameRef={inputFrameRef} />
            )}
          </CharacterScene>
        )}

        {bothReady && (
          <SplitScreenRenderer cameraOne={cameraOne} cameraTwo={cameraTwo} orientation="vertical" />
        )}
      </GameCanvas>

      <InteractionPromptUI />

      <div className="pointer-events-none fixed inset-x-0 top-1/2 z-20 h-0.5 -translate-y-1/2 bg-black/40" />
      <div className="pointer-events-none fixed left-4 top-4 z-20 rounded bg-black/50 px-3 py-1.5 text-xs text-light-divine">
        Player One (Boy) — WASD, Space, Shift, E
      </div>
      <div className="pointer-events-none fixed right-4 top-4 z-20 rounded bg-black/50 px-3 py-1.5 text-xs text-light-divine">
        Player Two (Girl) — Arrow keys, Enter, Right Shift, /
      </div>
    </div>
  );
}

export function CoopSplitScreenPage() {
  return (
    <EngineProvider>
      <GameplayProvider>
        <CoopContent />
      </GameplayProvider>
    </EngineProvider>
  );
}

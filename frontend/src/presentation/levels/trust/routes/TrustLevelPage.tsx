import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { PerspectiveCamera } from "three";
import { EngineProvider } from "@/presentation/engine/providers/EngineProvider";
import { GameplayProvider } from "@/presentation/gameplay/providers/GameplayProvider";
import { GameFrameworkProvider } from "@/presentation/game/GameFrameworkProvider";
import { useGameFramework } from "@/presentation/game/hooks/useGameFramework";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { useEngine } from "@/presentation/engine/hooks/useEngine";
import { useRegisterCoreAssets } from "@/presentation/engine/assetBootstrap/useRegisterCoreAssets";
import { useRegisterEnvironmentProps } from "@/presentation/engine/assetBootstrap/useRegisterEnvironmentProps";
import { GameCanvas } from "@/presentation/engine/components/GameCanvas";
import { SplitScreenRenderer } from "@/presentation/engine/components/SplitScreenRenderer";
import { TrustLevelScene } from "@/presentation/levels/trust/TrustLevelScene";
import { SceneErrorBoundary } from "@/presentation/engine/components/SceneErrorBoundary";
import { ScreenFadeOverlay } from "@/presentation/engine/components/ScreenFadeOverlay";
import {
  TRUST_LEVEL_ID,
  buildHiddenBridgeStage,
  buildInvisiblePlatformsStage,
  buildFaithLiftStage,
  buildWindCrossingStage,
  buildTrustFinalStage,
  setupTrustLevel,
} from "@/presentation/levels/trust/trustLevelContent";
import { PuzzleTimerHud } from "@/presentation/gameplay/components/puzzle/PuzzleTimerHud";
import { CharacterScene } from "@/presentation/character/components/CharacterScene";
import type { TeleportRequest } from "@/presentation/character/components/CharacterController";
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
import { WorldManager } from "@/infrastructure/world/WorldManager";
import { CoopPuzzleManager } from "@/domain/game/puzzle/CoopPuzzleManager";
import { PuzzleState } from "@/domain/game/puzzle/PuzzleState";
import { DORMANT_RESTORATION_PROFILE } from "@/domain/game/RestorationProfile";
import { GameplayEventBridge } from "@/presentation/gameplay/components/GameplayEventBridge";
import { InteractionDriver } from "@/presentation/gameplay/components/InteractionDriver";
import { InteractionPromptUI } from "@/presentation/gameplay/components/InteractionPromptUI";
import { TrustTutorial, type TrustTutorialStep } from "@/presentation/gameplay/components/trust/TrustTutorial";
import { TrustTutorialOverlay } from "@/presentation/gameplay/components/trust/TrustTutorialOverlay";
import { ReflectionScreen } from "@/presentation/gameplay/components/ReflectionScreen";
import { completedFlag } from "@/presentation/hub/chapterData";

const LEVEL_ZONE_ID = `zone:level:${TRUST_LEVEL_ID}`;
const TOTAL_PLANNED_STAGES = 5;

function TrustLevelContent() {
  useRegisterCoreAssets();
  useRegisterEnvironmentProps();
  const navigate = useNavigate();
  const { assetManager } = useEngine();
  const { gardenRestorationManager, eventBus } = useGameFramework();
  const gameplayServices = useGameplay();
  const factory = useMemo(() => new CharacterFactory(), []);
  const worldManager = useMemo(() => new WorldManager(assetManager), [assetManager]);
  const puzzleManager = useMemo(
    () => new CoopPuzzleManager(worldManager.checkpointManager, eventBus),
    [worldManager, eventBus]
  );

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
  const [isFadingIn, setIsFadingIn] = useState(true);
  const [isFadingOutToHub, setIsFadingOutToHub] = useState(false);
  const [levelState, setLevelState] = useState(PuzzleState.NOT_STARTED);
  const [, forceRerender] = useState(0);
  const playerBTeleportRequestRef = useRef<TeleportRequest | null>(null);
  const playerAExternalVelocityRef = useRef<{ x: number; z: number } | null>(null);
  const playerBExternalVelocityRef = useRef<{ x: number; z: number } | null>(null);
  const [resumeAtStageId, setResumeAtStageId] = useState<string | undefined>(undefined);
  const [hasCheckedForResume, setHasCheckedForResume] = useState(false);
  const [finalTimeRemaining, setFinalTimeRemaining] = useState<number | null>(null);
  const [tutorialStep, setTutorialStep] = useState<TrustTutorialStep>(null);

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

  useEffect(() => {
    return eventBus.on("puzzle:stage-completed", ({ levelId, stageId }) => {
      if (levelId !== TRUST_LEVEL_ID) {
        return;
      }
      gameplayServices.storyFlags.set(`stage-complete:${stageId}`);
      const completedCount = [
        buildHiddenBridgeStage().stageId,
        buildInvisiblePlatformsStage().stageId,
        buildFaithLiftStage().stageId,
        buildWindCrossingStage().stageId,
        buildTrustFinalStage().stageId,
      ].filter((id) =>
        gameplayServices.storyFlags.has(`stage-complete:${id}`)
      ).length;
      const fraction = completedCount / TOTAL_PLANNED_STAGES;
      gardenRestorationManager.restoreZoneProfile(LEVEL_ZONE_ID, {
        ...DORMANT_RESTORATION_PROFILE,
        flowerDensity: fraction,
        waterLevel: fraction,
        lightingWarmth: fraction,
        particleDensity: fraction * 0.9,
        animalPresence: fraction * 0.9,
        treeCanopyDensity: Math.min(1, fraction * 1.5),
      });
      void gameplayServices.saveManager.saveToStorage();
      forceRerender((count) => count + 1);
    });
  }, [eventBus, gardenRestorationManager, gameplayServices]);

  /**
   * Sets the chapter-level completion flag the Hub's unlock condition
   * for the NEXT chapter actually checks — the same gap found (and
   * fixed) in CommunicationLevelPage: per-stage stage-complete flags
   * are a different namespace entirely, and without this the next
   * chapter's gate would stay locked forever regardless of finishing
   * every Trust puzzle. Wired proactively here, before Trust's
   * remaining puzzles even exist, rather than waiting to discover the
   * same bug again once Puzzle 4/Final are built.
   */
  useEffect(() => {
    return eventBus.on("puzzle:level-completed", ({ levelId }) => {
      if (levelId !== TRUST_LEVEL_ID) {
        return;
      }
      gameplayServices.storyFlags.set(completedFlag(TRUST_LEVEL_ID));
      void gameplayServices.saveManager.saveToStorage();
    });
  }, [eventBus, gameplayServices]);

  /**
   * Loading the save here (not only via the Hub's own Continue)
   * means arriving at this level after already completing Puzzle 1 in
   * a prior session resumes at Puzzle 2, rather than restarting the
   * whole level — matching Communication's established pattern
   * exactly, and closing the gap the previous commit stated plainly:
   * this level previously always started fresh at Puzzle 1 regardless
   * of prior progress.
   */
  useEffect(() => {
    gameplayServices.saveManager
      .loadFromStorage()
      .then((save) => {
        if (save) {
          gameplayServices.saveManager.restoreFromSnapshot(save);
        }
        const stageOrder = [
          buildHiddenBridgeStage().stageId,
          buildInvisiblePlatformsStage().stageId,
          buildFaithLiftStage().stageId,
          buildWindCrossingStage().stageId,
          buildTrustFinalStage().stageId,
        ];
        const firstIncompleteStageId = stageOrder.find(
          (stageId) => !gameplayServices.storyFlags.has(`stage-complete:${stageId}`)
        );
        setResumeAtStageId(firstIncompleteStageId);
      })
      .catch(() => {
        // No save, or a corrupt one — start fresh at Puzzle 1.
      })
      .finally(() => {
        setHasCheckedForResume(true);
      });
    // Runs once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGroundHeightReady = (heightFunction: (x: number, z: number) => number) => {
    if (groundHeightRef.current) {
      return;
    }
    groundHeightRef.current = heightFunction;
    setupTrustLevel(worldManager, heightFunction);
    setIsTerrainReady(true);
  };

  useEffect(() => {
    if (
      !isTerrainReady ||
      !hasCheckedForResume ||
      puzzleManager.getState() !== PuzzleState.NOT_STARTED
    ) {
      return;
    }
    // Only Puzzles 1-2 are implemented so far — starting the sequence
    // with just these stages is honest about current scope, not a
    // placeholder: CoopPuzzleManager reaches PuzzleState.COMPLETE once
    // the last one is solved, exactly as it would with a longer
    // stages[] once Puzzles 3-4/Final exist.
    puzzleManager.startLevel(
      TRUST_LEVEL_ID,
      [
        buildHiddenBridgeStage(),
        buildInvisiblePlatformsStage(),
        buildFaithLiftStage(),
        buildWindCrossingStage(),
        buildTrustFinalStage(),
      ],
      resumeAtStageId
    );
    setLevelState(puzzleManager.getState());
  }, [isTerrainReady, hasCheckedForResume, puzzleManager, resumeAtStageId]);

  const boyAnimationConfig = useMemo(
    () => (boyData ? createBoyAnimationConfig(boyData.clipRegistry) : null),
    [boyData]
  );
  const girlAnimationConfig = useMemo(
    () => (girlData ? createGirlAnimationConfig(girlData.clipRegistry) : null),
    [girlData]
  );

  useEffect(() => {
    if (
      !isTerrainReady ||
      !hasCheckedForResume ||
      !boyAnimationConfig ||
      !groundHeightRef.current ||
      entityOne
    ) {
      return;
    }
    const spawnId =
      resumeAtStageId === buildTrustFinalStage().stageId
        ? "checkpoint:trust:wind-crossing:a"
        : resumeAtStageId === buildWindCrossingStage().stageId
          ? "checkpoint:trust:faith-lift:a"
          : resumeAtStageId === buildFaithLiftStage().stageId
            ? "checkpoint:trust:invisible-platforms:a"
            : resumeAtStageId === buildInvisiblePlatformsStage().stageId
              ? "checkpoint:trust:hidden-bridge:a"
              : "spawn:trust-a";
    const spawnPoint = worldManager.spawnManager.resolveSpawnPoint(spawnId);
    const config = createCharacterConfig({
      id: "character:trust-player-a",
      type: CharacterType.PLAYER,
      modelAssetId: CHARACTER_MODEL_ASSET_IDS.BOY,
      animationConfigId: boyAnimationConfig.id,
    });
    setEntityOne(factory.spawn(config, spawnPoint));
  }, [
    isTerrainReady,
    hasCheckedForResume,
    boyAnimationConfig,
    entityOne,
    factory,
    worldManager,
    resumeAtStageId,
  ]);

  useEffect(() => {
    if (
      !isTerrainReady ||
      !hasCheckedForResume ||
      !girlAnimationConfig ||
      !groundHeightRef.current ||
      entityTwo
    ) {
      return;
    }
    const spawnId =
      resumeAtStageId === buildTrustFinalStage().stageId
        ? "checkpoint:trust:wind-crossing:b"
        : resumeAtStageId === buildWindCrossingStage().stageId
          ? "checkpoint:trust:faith-lift:b"
          : resumeAtStageId === buildFaithLiftStage().stageId
            ? "checkpoint:trust:invisible-platforms:b"
            : resumeAtStageId === buildInvisiblePlatformsStage().stageId
              ? "checkpoint:trust:hidden-bridge:b"
              : "spawn:trust-b";
    const spawnPoint = worldManager.spawnManager.resolveSpawnPoint(spawnId);
    const config = createCharacterConfig({
      id: "character:trust-player-b",
      type: CharacterType.PLAYER,
      modelAssetId: CHARACTER_MODEL_ASSET_IDS.GIRL,
      animationConfigId: girlAnimationConfig.id,
    });
    setEntityTwo(factory.spawn(config, spawnPoint));
  }, [
    isTerrainReady,
    hasCheckedForResume,
    girlAnimationConfig,
    entityTwo,
    factory,
    worldManager,
    resumeAtStageId,
  ]);

  const qualityPreset = GRAPHICS_QUALITY_PRESETS.high;
  const bothReady =
    entityOne && entityTwo && boyData && girlData && boyAnimationConfig && girlAnimationConfig;
  const restoration = gardenRestorationManager.getZoneProfile(LEVEL_ZONE_ID);

  const isHiddenBridgeStageActive = (() => {
    if (levelState === PuzzleState.NOT_STARTED) {
      return false;
    }
    try {
      return puzzleManager.getCurrentStage().stageId === buildHiddenBridgeStage().stageId;
    } catch {
      return false;
    }
  })();

  const isInvisiblePlatformsStageActive = (() => {
    if (levelState === PuzzleState.NOT_STARTED) {
      return false;
    }
    try {
      return (
        puzzleManager.getCurrentStage().stageId === buildInvisiblePlatformsStage().stageId
      );
    } catch {
      return false;
    }
  })();

  const isFaithLiftStageActive = (() => {
    if (levelState === PuzzleState.NOT_STARTED) {
      return false;
    }
    try {
      return puzzleManager.getCurrentStage().stageId === buildFaithLiftStage().stageId;
    } catch {
      return false;
    }
  })();

  const isWindCrossingStageActive = (() => {
    if (levelState === PuzzleState.NOT_STARTED) {
      return false;
    }
    try {
      return puzzleManager.getCurrentStage().stageId === buildWindCrossingStage().stageId;
    } catch {
      return false;
    }
  })();

  const isFinalStageActive = (() => {
    if (levelState === PuzzleState.NOT_STARTED) {
      return false;
    }
    try {
      return puzzleManager.getCurrentStage().stageId === buildTrustFinalStage().stageId;
    } catch {
      return false;
    }
  })();

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
          Entering the Forest together…
        </div>
      )}
      {isFadingIn && (
        <ScreenFadeOverlay
          direction="IN"
          durationSeconds={0.6}
          onComplete={() => {
            setIsFadingIn(false);
          }}
        />
      )}
      {isFadingOutToHub && (
        <ScreenFadeOverlay
          direction="OUT"
          durationSeconds={0.6}
          onComplete={() => {
            void navigate("/hub");
          }}
        />
      )}
      {levelState === PuzzleState.COMPLETE && !isFadingOutToHub && (
        <ReflectionScreen
          levelId={TRUST_LEVEL_ID}
          onContinue={() => {
            setIsFadingOutToHub(true);
          }}
        />
      )}

      <GameCanvas>
        <SceneErrorBoundary sceneName="trust-level">
          <TrustLevelScene
            qualityPreset={qualityPreset}
            onGroundHeightReady={handleGroundHeightReady}
            restoration={restoration}
            playerAEntity={entityOne}
            playerBEntity={entityTwo}
            playerBTeleportRequestRef={playerBTeleportRequestRef}
            playerAExternalVelocityRef={playerAExternalVelocityRef}
            playerBExternalVelocityRef={playerBExternalVelocityRef}
            puzzleManager={puzzleManager}
            isHiddenBridgeStageActive={isHiddenBridgeStageActive}
            isInvisiblePlatformsStageActive={isInvisiblePlatformsStageActive}
            isFaithLiftStageActive={isFaithLiftStageActive}
            isWindCrossingStageActive={isWindCrossingStageActive}
            isFinalStageActive={isFinalStageActive}
            onStageProgressChanged={() => {
              setLevelState(puzzleManager.getState());
            }}
            onPlayerBFell={() => {
              forceRerender((count) => count + 1);
            }}
            onFinalTimeRemainingChanged={setFinalTimeRemaining}
          />
        </SceneErrorBoundary>
        <TrustTutorial
          entityOne={entityOne}
          entityTwo={entityTwo}
          onStepChanged={setTutorialStep}
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
            externalVelocityRef={playerAExternalVelocityRef}
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
            teleportRequestRef={playerBTeleportRequestRef}
            externalVelocityRef={playerBExternalVelocityRef}
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

      <PuzzleTimerHud secondsRemaining={finalTimeRemaining} />

      <GameplayEventBridge />
      <InteractionPromptUI />
      <TrustTutorialOverlay step={tutorialStep} />

      <div className="pointer-events-none fixed inset-x-0 top-1/2 z-20 h-0.5 -translate-y-1/2 bg-black/40" />
      <div className="pointer-events-none fixed left-4 top-4 z-20 rounded bg-black/50 px-3 py-1.5 text-xs text-light-divine">
        Player A — stand on the plate. WASD, Space, Shift, E.
      </div>
      <div className="pointer-events-none fixed right-4 top-4 z-20 rounded bg-black/50 px-3 py-1.5 text-xs text-light-divine">
        Player B — trust the bridge. Arrows, Enter, Right Shift, /.
      </div>
    </div>
  );
}

export function TrustLevelPage() {
  return (
    <EngineProvider>
      <GameplayProvider>
        <GameFrameworkProvider>
          <TrustLevelContent />
        </GameFrameworkProvider>
      </GameplayProvider>
    </EngineProvider>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { PerspectiveCamera } from "three";
import { EngineProvider } from "@/presentation/engine/providers/EngineProvider";
import { GameplayProvider } from "@/presentation/gameplay/providers/GameplayProvider";
import { GameFrameworkProvider } from "@/presentation/game/GameFrameworkProvider";
import { completedFlag } from "@/presentation/hub/chapterData";
import { useRegisterCoreAssets } from "@/presentation/engine/assetBootstrap/useRegisterCoreAssets";
import { useRegisterEnvironmentProps } from "@/presentation/engine/assetBootstrap/useRegisterEnvironmentProps";
import { useGameFramework } from "@/presentation/game/hooks/useGameFramework";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { useEngine } from "@/presentation/engine/hooks/useEngine";
import { GameCanvas } from "@/presentation/engine/components/GameCanvas";
import { SplitScreenRenderer } from "@/presentation/engine/components/SplitScreenRenderer";
import { CommunicationLevelScene } from "@/presentation/levels/communication/CommunicationLevelScene";
import { SceneErrorBoundary } from "@/presentation/engine/components/SceneErrorBoundary";
import {
  COMMUNICATION_LEVEL_ID,
  buildPuzzleOneStage,
  buildPuzzleTwoStage,
  buildPuzzleThreeStage,
  buildFinalStage,
  generateSplitCode,
  setupCommunicationLevel,
  shuffleSymbolOrder,
  ALL_SYMBOLS,
  PuzzleSymbol,
} from "@/presentation/levels/communication/communicationLevelContent";
import { PuzzleTimerHud } from "@/presentation/gameplay/components/puzzle/PuzzleTimerHud";
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
import { WorldManager } from "@/infrastructure/world/WorldManager";
import { CoopPuzzleManager } from "@/domain/game/puzzle/CoopPuzzleManager";
import { PuzzleState } from "@/domain/game/puzzle/PuzzleState";
import { DORMANT_RESTORATION_PROFILE } from "@/domain/game/RestorationProfile";
import { GameplayEventBridge } from "@/presentation/gameplay/components/GameplayEventBridge";
import { InteractionDriver } from "@/presentation/gameplay/components/InteractionDriver";
import { InteractionPromptUI } from "@/presentation/gameplay/components/InteractionPromptUI";
import { ReflectionScreen } from "@/presentation/gameplay/components/ReflectionScreen";
import { CommunicationTutorial, type TutorialStep } from "@/presentation/gameplay/components/puzzle/CommunicationTutorial";
import { CommunicationTutorialOverlay } from "@/presentation/gameplay/components/puzzle/CommunicationTutorialOverlay";

const LEVEL_ZONE_ID = `zone:level:${COMMUNICATION_LEVEL_ID}`;

function CommunicationLevelContent() {
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
  const attemptSeed = useMemo(() => Math.floor(Math.random() * 1_000_000), []);
  const targetOrder = useMemo(() => shuffleSymbolOrder(attemptSeed), [attemptSeed]);
  const puzzleThreeCode = useMemo(() => generateSplitCode(attemptSeed + 1), [attemptSeed]);
  const finalPuzzleSymbol = useMemo(
    () => ALL_SYMBOLS[attemptSeed % ALL_SYMBOLS.length] ?? PuzzleSymbol.SPHERE,
    [attemptSeed]
  );
  const finalPuzzleCode = useMemo(
    () => generateSplitCode(attemptSeed + 2).slice(0, 2),
    [attemptSeed]
  );
  const [finalTimeRemaining, setFinalTimeRemaining] = useState<number | null>(null);
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>(null);

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
  const [levelState, setLevelState] = useState(PuzzleState.NOT_STARTED);
  const [, forceRerender] = useState(0);

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

  /**
   * "As puzzles are solved: flowers bloom, grass returns..." (Part 7)
   * — each solved stage merges a real, PROGRESSIVELY LARGER
   * restoration increment into this level's own zone via
   * GardenRestorationManager.restoreZoneProfile (reused from the
   * save/load work). The fraction is computed from how many of this
   * level's stages are now complete out of TOTAL_PLANNED_STAGES (4:
   * Puzzles 1-3 + Final) — not a fixed value repeated on every
   * completion, which would never increase past the first stage's
   * contribution once restoreZoneProfile's max-merge saw the same
   * number twice. Forward-compatible: adding Puzzle 3/Final needs no
   * change here, since the fraction is already computed from "how
   * many are done" rather than hardcoded per stage.
   */
  const TOTAL_PLANNED_STAGES = 4;
  useEffect(() => {
    return eventBus.on("puzzle:stage-completed", ({ levelId, stageId }) => {
      if (levelId !== COMMUNICATION_LEVEL_ID) {
        return;
      }
      gameplayServices.storyFlags.set(`stage-complete:${stageId}`);
      const completedCount = [
        buildPuzzleOneStage(targetOrder).stageId,
        buildPuzzleTwoStage().stageId,
        buildPuzzleThreeStage().stageId,
        buildFinalStage().stageId,
      ].filter((id) => gameplayServices.storyFlags.has(`stage-complete:${id}`)).length;
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
  }, [eventBus, gardenRestorationManager, gameplayServices, targetOrder]);

  /**
   * chapterData.ts's unlock condition for the NEXT chapter checks
   * `chapter-complete:${chapterId}` via chapterCompleteFlag — a
   * DIFFERENT flag namespace than this level's own per-stage
   * `stage-complete:${stageId}` flags above. Without this listener,
   * finishing every puzzle in Communication would never actually set
   * the flag the Hub gate's unlock condition is checking, and the
   * next chapter's gate would stay locked forever regardless of how
   * much of this level a player completes — a real gap, not a
   * hypothetical one, since it's what Trust's own unlock condition
   * depends on.
   */
  useEffect(() => {
    return eventBus.on("puzzle:level-completed", ({ levelId }) => {
      if (levelId !== COMMUNICATION_LEVEL_ID) {
        return;
      }
      gameplayServices.storyFlags.set(completedFlag(COMMUNICATION_LEVEL_ID));
      void gameplayServices.saveManager.saveToStorage();
    });
  }, [eventBus, gameplayServices]);

  const [resumeAtStageId, setResumeAtStageId] = useState<string | undefined>(undefined);
  const [hasCheckedForResume, setHasCheckedForResume] = useState(false);

  /**
   * Loading the save here (not only in the Hub) means arriving at
   * this level after already completing Puzzle 1 in a prior session
   * resumes at Puzzle 2, rather than silently re-forcing the first
   * puzzle every time — "Continue resumes after Puzzle 2" (and, by
   * the same logic, after Puzzle 1) applies however the player
   * arrives at this route, not only via the Hub's own Continue
   * button. Story flag restoration doesn't depend on
   * worldSaveContextRef (SaveManager restores StoryFlags directly),
   * so this works correctly even though this route doesn't yet wire
   * position/camera restoration — a real, stated limitation, not
   * something silently broken.
   */
  useEffect(() => {
    gameplayServices.saveManager
      .loadFromStorage()
      .then((save) => {
        if (save) {
          gameplayServices.saveManager.restoreFromSnapshot(save);
        }
        const stageOrder = [
          buildPuzzleOneStage(targetOrder).stageId,
          buildPuzzleTwoStage().stageId,
          buildPuzzleThreeStage().stageId,
          buildFinalStage().stageId,
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
    // Runs once on mount only — re-running on every targetOrder change
    // would re-check the save mid-session, which isn't the intent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGroundHeightReady = (heightFunction: (x: number, z: number) => number) => {
    if (groundHeightRef.current) {
      return;
    }
    groundHeightRef.current = heightFunction;
    setupCommunicationLevel(worldManager, heightFunction);
    setIsTerrainReady(true);
  };

  /**
   * Starting the puzzle sequence needs BOTH the terrain (for
   * setupCommunicationLevel's spawn-point registration) and the
   * resume check (for which stage to start at) — gating this on
   * hasCheckedForResume inside handleGroundHeightReady itself would
   * be wrong, since TerrainMesh only calls that callback once and a
   * still-pending async resume check at that moment would mean the
   * puzzle sequence never starts at all. This effect fires once both
   * conditions are independently true, regardless of which finishes
   * first.
   */
  useEffect(() => {
    if (!isTerrainReady || !hasCheckedForResume || puzzleManager.getState() !== PuzzleState.NOT_STARTED) {
      return;
    }
    puzzleManager.startLevel(
      COMMUNICATION_LEVEL_ID,
      [
        buildPuzzleOneStage(targetOrder),
        buildPuzzleTwoStage(),
        buildPuzzleThreeStage(),
        buildFinalStage(),
      ],
      resumeAtStageId
    );
    setLevelState(puzzleManager.getState());
  }, [isTerrainReady, hasCheckedForResume, puzzleManager, targetOrder, resumeAtStageId]);

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
    // Resume-aware: if the save indicates Puzzle 1 is already
    // complete, spawn at Puzzle 2's entrance rather than the level's
    // very start — a checkpoint that restores puzzle progress but
    // leaves the player at the beginning would be a real, confusing
    // gap, not a genuine resume.
    const spawnId =
      resumeAtStageId === buildFinalStage().stageId
        ? "checkpoint:communication:puzzle-three:a"
        : resumeAtStageId === buildPuzzleThreeStage().stageId
          ? "checkpoint:communication:puzzle-two:a"
          : resumeAtStageId === buildPuzzleTwoStage().stageId
            ? "checkpoint:communication:puzzle-one:a"
            : "spawn:communication-a";
    const spawnPoint = worldManager.spawnManager.resolveSpawnPoint(spawnId);
    const config = createCharacterConfig({
      id: "character:communication-player-a",
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
      resumeAtStageId === buildFinalStage().stageId
        ? "checkpoint:communication:puzzle-three:b"
        : resumeAtStageId === buildPuzzleThreeStage().stageId
          ? "checkpoint:communication:puzzle-two:b"
          : resumeAtStageId === buildPuzzleTwoStage().stageId
            ? "checkpoint:communication:puzzle-one:b"
            : "spawn:communication-b";
    const spawnPoint = worldManager.spawnManager.resolveSpawnPoint(spawnId);
    const config = createCharacterConfig({
      id: "character:communication-player-b",
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

  const isPuzzleTwoActive = (() => {
    if (levelState === PuzzleState.NOT_STARTED || !hasCheckedForResume) {
      return false;
    }
    try {
      return puzzleManager.getCurrentStage().stageId === buildPuzzleTwoStage().stageId;
    } catch {
      return false;
    }
  })();

  const isFinalStageActive = (() => {
    if (levelState === PuzzleState.NOT_STARTED || !hasCheckedForResume) {
      return false;
    }
    try {
      return puzzleManager.getCurrentStage().stageId === buildFinalStage().stageId;
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
          Entering the Garden together…
        </div>
      )}
      {levelState === PuzzleState.COMPLETE && (
        <ReflectionScreen
          levelId={COMMUNICATION_LEVEL_ID}
          onContinue={() => {
            void navigate("/hub");
          }}
        />
      )}

      <GameCanvas>
        <SceneErrorBoundary sceneName="communication-level">
          <CommunicationLevelScene
            qualityPreset={qualityPreset}
            onGroundHeightReady={handleGroundHeightReady}
            restoration={restoration}
            puzzleOneTargetOrder={targetOrder}
            puzzleThreeCode={puzzleThreeCode}
            finalPuzzleSymbol={finalPuzzleSymbol}
            finalPuzzleCode={finalPuzzleCode}
            puzzleManager={puzzleManager}
            isPuzzleTwoActive={isPuzzleTwoActive}
            isFinalStageActive={isFinalStageActive}
            onStageProgressChanged={() => {
              setLevelState(puzzleManager.getState());
            }}
            onMissedAttempt={() => {
              forceRerender((count) => count + 1);
            }}
            onFinalTimeRemainingChanged={setFinalTimeRemaining}
          />
        </SceneErrorBoundary>

        <CommunicationTutorial
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

      <PuzzleTimerHud secondsRemaining={finalTimeRemaining} />

      <GameplayEventBridge />
      <InteractionPromptUI />
      <CommunicationTutorialOverlay step={tutorialStep} />

      <div className="pointer-events-none fixed inset-x-0 top-1/2 z-20 h-0.5 -translate-y-1/2 bg-black/40" />
      <div className="pointer-events-none fixed left-4 top-4 z-20 rounded bg-black/50 px-3 py-1.5 text-xs text-light-divine">
        Player A — sees the symbols. WASD, Space, Shift, E.
      </div>
      <div className="pointer-events-none fixed right-4 top-4 z-20 rounded bg-black/50 px-3 py-1.5 text-xs text-light-divine">
        Player B — operates the switches. Arrows, Enter, Right Shift, /.
      </div>
    </div>
  );
}

export function CommunicationLevelPage() {
  return (
    <EngineProvider>
      <GameplayProvider>
        <GameFrameworkProvider>
          <CommunicationLevelContent />
        </GameFrameworkProvider>
      </GameplayProvider>
    </EngineProvider>
  );
}

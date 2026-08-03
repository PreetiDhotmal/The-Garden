import { useMemo, useState } from "react";
import { Sky, Environment } from "@react-three/drei";
import { TerrainMesh } from "@/presentation/world/components/TerrainMesh";
import { VegetationField } from "@/presentation/world/components/VegetationField";
import { EnvironmentPropField } from "@/presentation/world/components/EnvironmentPropField";
import { useEnvironmentPropModel } from "@/presentation/world/hooks/useEnvironmentPropModel";
import { ENVIRONMENT_PROP_IDS, ENVIRONMENT_PROPS } from "@/presentation/world/environmentPropAssets";
import { RiverWater } from "@/presentation/world/components/RiverWater";
import { AmbientParticles } from "@/presentation/world/components/AmbientParticles";
import { FlyingCreatures } from "@/presentation/world/components/FlyingCreatures";
import {
  createGrassBladeGeometry,
  createFlowerGeometry,
} from "@/infrastructure/world/vegetation/ProceduralVegetationGeometry";
import { generateClusteredPoints } from "@/infrastructure/world/vegetation/ClusteredScattering";
import type { GraphicsQualityPreset } from "@/domain/engine/config/GraphicsQualityPreset";
import type { RestorationProfile } from "@/domain/game/RestorationProfile";
import type { CoopPuzzleManager } from "@/domain/game/puzzle/CoopPuzzleManager";
import { CommunicationPuzzleOne } from "@/presentation/gameplay/components/puzzle/CommunicationPuzzleOne";
import { CommunicationPuzzleTwo } from "@/presentation/gameplay/components/puzzle/CommunicationPuzzleTwo";
import { CommunicationPuzzleThree } from "@/presentation/gameplay/components/puzzle/CommunicationPuzzleThree";
import { CommunicationFinalPuzzle } from "@/presentation/gameplay/components/puzzle/CommunicationFinalPuzzle";
import { createExclusionZones } from "@/infrastructure/world/vegetation/ExclusionZones";
import {
  PuzzleSymbol,
  WORLD_WIDTH,
  WORLD_DEPTH,
  SYMBOL_TOTEM_POSITIONS as EXCL_TOTEMS_ONE,
  SWITCH_POSITIONS as EXCL_SWITCHES_ONE,
  PUZZLE_TWO_MIRROR_POSITIONS as EXCL_MIRRORS_TWO,
  PUZZLE_THREE_DIGIT_POST_POSITIONS as EXCL_DIGITS_THREE,
  PUZZLE_THREE_COMMIT_LEVER_POSITION as EXCL_LEVER_THREE,
  FINAL_PUZZLE_SWITCH_POSITION as EXCL_SWITCH_FINAL,
  FINAL_PUZZLE_MIRROR_POSITION as EXCL_MIRROR_FINAL,
  FINAL_PUZZLE_COMMIT_LEVER_POSITION as EXCL_LEVER_FINAL,
  PLAYER_A_SPAWN as EXCL_SPAWN_A,
  PLAYER_B_SPAWN as EXCL_SPAWN_B,
} from "./communicationLevelContent";

export interface CommunicationLevelSceneProps {
  readonly onGroundHeightReady: (heightFunction: (x: number, z: number) => number) => void;
  readonly qualityPreset: GraphicsQualityPreset;
  readonly restoration: RestorationProfile;
  readonly puzzleOneTargetOrder: readonly PuzzleSymbol[];
  readonly puzzleThreeCode: readonly number[];
  readonly finalPuzzleSymbol: PuzzleSymbol;
  readonly finalPuzzleCode: readonly number[];
  readonly puzzleManager: CoopPuzzleManager;
  readonly isPuzzleTwoActive: boolean;
  readonly isFinalStageActive: boolean;
  readonly onStageProgressChanged: () => void;
  readonly onMissedAttempt: () => void;
  readonly onFinalTimeRemainingChanged: (secondsRemaining: number | null) => void;
}

/** Interpolates between the "dry, abandoned" palette (0 restoration) and a warm, living palette (1) — the same restoration -> visual mapping principle RestorationProfile already defines, applied to a level scene for the first time rather than only the Hub. */
function lerpColor(
  from: [number, number, number],
  to: [number, number, number],
  t: number
): string {
  const r = Math.round(from[0] + (to[0] - from[0]) * t);
  const g = Math.round(from[1] + (to[1] - from[1]) * t);
  const b = Math.round(from[2] + (to[2] - from[2]) * t);
  return `rgb(${r.toString()}, ${g.toString()}, ${b.toString()})`;
}

const DRY_TERRAIN_RGB: [number, number, number] = [138, 122, 92];
const LUSH_TERRAIN_RGB: [number, number, number] = [74, 143, 71];

export function CommunicationLevelScene({
  onGroundHeightReady,
  qualityPreset,
  restoration,
  puzzleOneTargetOrder,
  puzzleThreeCode,
  finalPuzzleSymbol,
  finalPuzzleCode,
  puzzleManager,
  isPuzzleTwoActive,
  isFinalStageActive,
  onStageProgressChanged,
  onMissedAttempt,
  onFinalTimeRemainingChanged,
}: CommunicationLevelSceneProps) {
  const [heightFunction, setHeightFunction] = useState<((x: number, z: number) => number) | null>(
    null
  );
  const grassBladeGeometry = useMemo(() => createGrassBladeGeometry(), []);
  const flowerGeometry = useMemo(() => createFlowerGeometry(), []);

  const treeProp = useEnvironmentPropModel(ENVIRONMENT_PROP_IDS.TREE);
  const rockProp = useEnvironmentPropModel(ENVIRONMENT_PROP_IDS.ROCK);
  const bushProp = useEnvironmentPropModel(ENVIRONMENT_PROP_IDS.BUSH);
  const grassProp = useEnvironmentPropModel(ENVIRONMENT_PROP_IDS.GRASS);
  const flowerProp = useEnvironmentPropModel(ENVIRONMENT_PROP_IDS.FLOWER);

  const propScale = (assetId: string): number =>
    ENVIRONMENT_PROPS.find((prop) => prop.assetId === assetId)?.baseScale ?? 1;

  const puzzleExclusion = useMemo(
    () =>
      createExclusionZones([
        ...EXCL_TOTEMS_ONE.map((position) => ({ x: position[0], z: position[2], radius: 2.5 })),
        ...EXCL_SWITCHES_ONE.map((position) => ({ x: position[0], z: position[2], radius: 2.5 })),
        ...EXCL_MIRRORS_TWO.map((position) => ({ x: position[0], z: position[2], radius: 2.5 })),
        ...EXCL_DIGITS_THREE.map((position) => ({ x: position[0], z: position[2], radius: 2 })),
        { x: EXCL_LEVER_THREE[0], z: EXCL_LEVER_THREE[2], radius: 3 },
        { x: EXCL_SWITCH_FINAL[0], z: EXCL_SWITCH_FINAL[2], radius: 2.5 },
        { x: EXCL_MIRROR_FINAL[0], z: EXCL_MIRROR_FINAL[2], radius: 2.5 },
        { x: EXCL_LEVER_FINAL[0], z: EXCL_LEVER_FINAL[2], radius: 3 },
        { x: EXCL_SPAWN_A.x, z: EXCL_SPAWN_A.z, radius: 6 },
        { x: EXCL_SPAWN_B.x, z: EXCL_SPAWN_B.z, radius: 6 },
      ]),
    []
  );

  // Edge-aligned cluster centers — trees frame the world's perimeter
  // and the paths through it, not the open ground grass is meant to
  // dominate. Hand-placed along both long edges of Communication's
  // 90-wide, 220-deep world, spread across its full depth.
  const treeClusterCenters = useMemo(
    () => [
      { x: -32, z: 85, weight: 1, radius: 9 },
      { x: 34, z: 55, weight: 1, radius: 8 },
      { x: -34, z: 15, weight: 1, radius: 9 },
      { x: 32, z: -25, weight: 1, radius: 8 },
      { x: -30, z: -65, weight: 1, radius: 9 },
    ],
    []
  );

  const treePoints = useMemo(
    () =>
      generateClusteredPoints({
        seed: 46,
        count: Math.round(24 * qualityPreset.foliageDensityMultiplier),
        areaWidth: WORLD_WIDTH,
        areaDepth: WORLD_DEPTH,
        centers: treeClusterCenters,
        scatterFraction: 0.1,
        isExcluded: puzzleExclusion,
      }),
    [treeClusterCenters, puzzleExclusion, qualityPreset.foliageDensityMultiplier]
  );

  const handleHeightFunctionReady = (fn: (x: number, z: number) => number) => {
    setHeightFunction(() => fn);
    onGroundHeightReady(fn);
  };

  const restorationLevel =
    (restoration.flowerDensity + restoration.waterLevel + restoration.lightingWarmth) / 3;
  const terrainColor = lerpColor(DRY_TERRAIN_RGB, LUSH_TERRAIN_RGB, restorationLevel);
  // Dirt/stone/cliff stay close to neutral earth tones regardless of
  // restoration — only grass "blooms," matching the existing
  // dry-to-lush narrative; rock and dirt don't restore the same way.
  const terrainLayerColors = {
    grass: terrainColor,
    dirt: "rgb(120, 98, 68)",
    stone: "rgb(128, 124, 116)",
    cliff: "rgb(96, 92, 86)",
  };

  return (
    <>
      <Sky
        sunPosition={[8, 6 + restorationLevel * 8, 6]}
        turbidity={10 - restorationLevel * 6}
        rayleigh={0.3 + restorationLevel * 0.9}
      />
      <fogExp2
        attach="fog"
        args={[
          restorationLevel > 0.5 ? "#cfe8d8" : "#c4bca8",
          1.1 / (qualityPreset.drawDistance * (0.6 + restorationLevel * 0.4)),
        ]}
      />
      <directionalLight
        castShadow
        intensity={1.5 + restorationLevel * 1.5}
        color={restorationLevel > 0.5 ? "#fff6e0" : "#e0d8c0"}
        shadow-mapSize={[qualityPreset.shadowMapSize, qualityPreset.shadowMapSize]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
        shadow-camera-left={-WORLD_WIDTH / 2 - 10}
        shadow-camera-right={WORLD_WIDTH / 2 + 10}
        shadow-camera-top={WORLD_DEPTH / 2 + 10}
        shadow-camera-bottom={-WORLD_DEPTH / 2 - 10}
        shadow-camera-near={1}
        shadow-camera-far={100}
        position={[8, 14, 6]}
      />
      <ambientLight intensity={0.3 + restorationLevel * 0.3} color="#e8e0d0" />
      <hemisphereLight args={["#e8e0c8", "#8a7458", 0.3 + restorationLevel * 0.3]} />
      <Environment preset={restorationLevel > 0.5 ? "park" : "sunset"} background={false} />

      <TerrainMesh
        width={WORLD_WIDTH}
        depth={WORLD_DEPTH}
        onHeightFunctionReady={handleHeightFunctionReady}
        layerColors={terrainLayerColors}
        roughness={1 - restorationLevel * 0.1}
      />

      {heightFunction && treeProp.scene && (
        <EnvironmentPropField
          scene={treeProp.scene}
          baseScale={propScale(ENVIRONMENT_PROP_IDS.TREE)}
          seed={31}
          count={0}
          areaWidth={WORLD_WIDTH}
          areaDepth={WORLD_DEPTH}
          heightFunction={heightFunction}
          preComputedPoints={treePoints}
        />
      )}
      {heightFunction && rockProp.scene && (
        <EnvironmentPropField
          scene={rockProp.scene}
          baseScale={propScale(ENVIRONMENT_PROP_IDS.ROCK)}
          seed={32}
          count={Math.round(20 * qualityPreset.foliageDensityMultiplier)}
          areaWidth={WORLD_WIDTH}
          areaDepth={WORLD_DEPTH}
          heightFunction={heightFunction}
          isExcluded={puzzleExclusion}
          minScaleVariation={0.6}
          maxScaleVariation={1.5}
        />
      )}
      {heightFunction && bushProp.scene && (
        <EnvironmentPropField
          scene={bushProp.scene}
          baseScale={propScale(ENVIRONMENT_PROP_IDS.BUSH)}
          seed={63}
          count={Math.round(38 * qualityPreset.foliageDensityMultiplier)}
          areaWidth={WORLD_WIDTH}
          areaDepth={WORLD_DEPTH}
          heightFunction={heightFunction}
          isExcluded={puzzleExclusion}
          minScaleVariation={0.7}
          maxScaleVariation={1.6}
        />
      )}
      {heightFunction && (
        <VegetationField
          seed={74}
          count={Math.round(8500 * qualityPreset.foliageDensityMultiplier)}
          areaWidth={WORLD_WIDTH}
          areaDepth={WORLD_DEPTH}
          heightFunction={heightFunction}
          isExcluded={puzzleExclusion}
          geometry={grassBladeGeometry}
          color="#5a9450"
          minScale={0.6}
          maxScale={1.3}
          maxLeanRadians={0.35}
          windStrength={0.25}
          castShadow={false}
        />
      )}
      {heightFunction && (
        <VegetationField
          seed={85}
          count={Math.round(50 * qualityPreset.foliageDensityMultiplier)}
          areaWidth={WORLD_WIDTH}
          areaDepth={WORLD_DEPTH}
          heightFunction={heightFunction}
          isExcluded={puzzleExclusion}
          geometry={flowerGeometry}
          color="#e8e0a0"
          minScale={0.8}
          maxScale={1.2}
          windStrength={0.2}
          castShadow={false}
        />
      )}
      {heightFunction && (
        <VegetationField
          seed={96}
          count={Math.round(40 * qualityPreset.foliageDensityMultiplier)}
          areaWidth={WORLD_WIDTH}
          areaDepth={WORLD_DEPTH}
          heightFunction={heightFunction}
          isExcluded={puzzleExclusion}
          geometry={flowerGeometry}
          color="#c890d8"
          minScale={0.8}
          maxScale={1.2}
          windStrength={0.2}
          castShadow={false}
        />
      )}
      {heightFunction && grassProp.scene && (
        <EnvironmentPropField
          scene={grassProp.scene}
          baseScale={propScale(ENVIRONMENT_PROP_IDS.GRASS)}
          seed={98}
          count={Math.round(6 * qualityPreset.foliageDensityMultiplier)}
          areaWidth={WORLD_WIDTH}
          areaDepth={WORLD_DEPTH}
          heightFunction={heightFunction}
          isExcluded={puzzleExclusion}
          minScaleVariation={0.8}
          maxScaleVariation={1.3}
          castShadow={false}
        />
      )}
      {heightFunction && flowerProp.scene && (
        <EnvironmentPropField
          scene={flowerProp.scene}
          baseScale={propScale(ENVIRONMENT_PROP_IDS.FLOWER)}
          seed={100}
          count={Math.round(35 * qualityPreset.foliageDensityMultiplier)}
          areaWidth={WORLD_WIDTH}
          areaDepth={WORLD_DEPTH}
          heightFunction={heightFunction}
          isExcluded={puzzleExclusion}
          minScaleVariation={0.8}
          maxScaleVariation={1.2}
          castShadow={false}
        />
      )}
      {restoration.waterLevel > 0.15 && (
        <RiverWater position={[0, 0.05, -20]} width={6} length={WORLD_DEPTH * 0.5} />
      )}

      <CommunicationPuzzleOne
        targetOrder={puzzleOneTargetOrder}
        puzzleManager={puzzleManager}
        onStageProgressChanged={onStageProgressChanged}
        onMissedAttempt={onMissedAttempt}
      />

      <CommunicationPuzzleTwo
        puzzleManager={puzzleManager}
        isActiveStage={isPuzzleTwoActive}
        onStageProgressChanged={onStageProgressChanged}
      />

      <CommunicationPuzzleThree
        code={puzzleThreeCode}
        puzzleManager={puzzleManager}
        onStageProgressChanged={onStageProgressChanged}
        onMissedAttempt={onMissedAttempt}
      />

      <CommunicationFinalPuzzle
        targetSymbol={finalPuzzleSymbol}
        targetCode={finalPuzzleCode}
        puzzleManager={puzzleManager}
        isActiveStage={isFinalStageActive}
        onStageProgressChanged={onStageProgressChanged}
        onMissedAttempt={onMissedAttempt}
        onTimeRemainingChanged={onFinalTimeRemainingChanged}
      />

      {restoration.particleDensity > 0.1 && (
        <AmbientParticles
          kind="pollen"
          position={[0, 3, 0]}
          area={[WORLD_WIDTH, 6, WORLD_DEPTH]}
          count={Math.round(
            40 * restoration.particleDensity * qualityPreset.particleCountMultiplier
          )}
        />
      )}
      {restoration.animalPresence > 0.2 && (
        <FlyingCreatures kind="bird" center={[0, 12, -10]} count={3} radius={25} />
      )}
    </>
  );
}

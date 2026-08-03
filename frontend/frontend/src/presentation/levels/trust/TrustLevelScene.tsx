import { useMemo, useState } from "react";
import { Sky, Environment } from "@react-three/drei";
import { TerrainMesh } from "@/presentation/world/components/TerrainMesh";
import { VegetationField } from "@/presentation/world/components/VegetationField";
import { Waterfall } from "@/presentation/world/components/Waterfall";
import { AmbientParticles } from "@/presentation/world/components/AmbientParticles";
import { FlyingCreatures } from "@/presentation/world/components/FlyingCreatures";
import {
  createGrassBladeGeometry,
  createFlowerGeometry,
} from "@/infrastructure/world/vegetation/ProceduralVegetationGeometry";
import type { GraphicsQualityPreset } from "@/domain/engine/config/GraphicsQualityPreset";
import type { RestorationProfile } from "@/domain/game/RestorationProfile";
import type { CharacterEntity } from "@/domain/character/CharacterEntity";
import type { CoopPuzzleManager } from "@/domain/game/puzzle/CoopPuzzleManager";
import { HiddenBridgePuzzle } from "@/presentation/gameplay/components/trust/HiddenBridgePuzzle";
import { InvisiblePlatformPuzzle } from "@/presentation/gameplay/components/trust/InvisiblePlatformPuzzle";
import { FaithLiftPuzzle } from "@/presentation/gameplay/components/trust/FaithLiftPuzzle";
import { WindCrossingPuzzle } from "@/presentation/gameplay/components/trust/WindCrossingPuzzle";
import { TrustFinalPuzzle } from "@/presentation/gameplay/components/trust/TrustFinalPuzzle";
import { EnvironmentPropField } from "@/presentation/world/components/EnvironmentPropField";
import { useEnvironmentPropModel } from "@/presentation/world/hooks/useEnvironmentPropModel";
import { ENVIRONMENT_PROP_IDS, ENVIRONMENT_PROPS } from "@/presentation/world/environmentPropAssets";
import { createExclusionZones } from "@/infrastructure/world/vegetation/ExclusionZones";
import { generateClusteredPoints } from "@/infrastructure/world/vegetation/ClusteredScattering";
import type { TeleportRequest } from "@/presentation/character/components/CharacterController";
import {
  WORLD_WIDTH,
  WORLD_DEPTH,
  PUZZLE_ONE_PLATE_POSITION,
  PUZZLE_ONE_BRIDGE_POSITION,
  PUZZLE_ONE_BRIDGE_LENGTH,
  PUZZLE_ONE_GOAL_POSITION,
  OBJECTIVE_HIDDEN_BRIDGE,
  PUZZLE_TWO_PLATFORM_POSITIONS,
  PUZZLE_TWO_PLAYER_B_RESPAWN_POSITION,
  PUZZLE_TWO_FALL_Y_THRESHOLD,
  PUZZLE_TWO_GOAL_POSITION,
  OBJECTIVE_INVISIBLE_PLATFORMS,
  PUZZLE_THREE_LEVER_POSITION,
  PUZZLE_THREE_LIFT_BASE_POSITION,
  PUZZLE_THREE_LIFT_TOP_Y,
  PUZZLE_THREE_LIFT_TRAVEL_SECONDS,
  PUZZLE_THREE_DESTINATION_POSITION,
  PUZZLE_THREE_PLAYER_B_READY_RADIUS,
  PUZZLE_THREE_GOAL_POSITION,
  PUZZLE_THREE_GOAL_RADIUS,
  OBJECTIVE_FAITH_LIFT,
  PUZZLE_FOUR_ZONE_START_Z,
  PUZZLE_FOUR_ZONE_END_Z,
  PUZZLE_FOUR_TOGETHER_DISTANCE,
  PUZZLE_FOUR_MAX_WIND_SPEED,
  PUZZLE_FOUR_GOAL_POSITION,
  PUZZLE_FOUR_GOAL_RADIUS,
  OBJECTIVE_WIND_CROSSING,
  FINAL_PUZZLE_PLATE_POSITION,
  FINAL_PUZZLE_BRIDGE_POSITION,
  FINAL_PUZZLE_BRIDGE_LENGTH,
  FINAL_PUZZLE_WIND_ZONE_START_Z,
  FINAL_PUZZLE_WIND_ZONE_END_Z,
  FINAL_PUZZLE_TOGETHER_DISTANCE,
  FINAL_PUZZLE_MAX_WIND_SPEED,
  FINAL_PUZZLE_GOAL_POSITION,
  FINAL_PUZZLE_GOAL_RADIUS,
  OBJECTIVE_FINAL,
  PUZZLE_ONE_PLATE_POSITION as EXCL_PLATE_ONE,
  PUZZLE_ONE_BRIDGE_POSITION as EXCL_BRIDGE_ONE,
  PUZZLE_TWO_PLATFORM_POSITIONS as EXCL_PLATFORMS_TWO,
  PUZZLE_THREE_LEVER_POSITION as EXCL_LEVER_THREE,
  PUZZLE_THREE_LIFT_BASE_POSITION as EXCL_LIFT_BASE_THREE,
  FINAL_PUZZLE_PLATE_POSITION as EXCL_PLATE_FINAL,
  FINAL_PUZZLE_LEVER_POSITION as EXCL_LEVER_FINAL,
  PLAYER_A_SPAWN as EXCL_SPAWN_A,
  PLAYER_B_SPAWN as EXCL_SPAWN_B,
} from "./trustLevelContent";

export interface TrustLevelSceneProps {
  readonly onGroundHeightReady: (heightFunction: (x: number, z: number) => number) => void;
  readonly qualityPreset: GraphicsQualityPreset;
  readonly restoration: RestorationProfile;
  readonly playerAEntity: CharacterEntity | null;
  readonly playerBEntity: CharacterEntity | null;
  readonly playerBTeleportRequestRef: React.RefObject<TeleportRequest | null>;
  readonly playerAExternalVelocityRef: React.RefObject<{ x: number; z: number } | null>;
  readonly playerBExternalVelocityRef: React.RefObject<{ x: number; z: number } | null>;
  readonly puzzleManager: CoopPuzzleManager;
  readonly isHiddenBridgeStageActive: boolean;
  readonly isInvisiblePlatformsStageActive: boolean;
  readonly isFaithLiftStageActive: boolean;
  readonly isWindCrossingStageActive: boolean;
  readonly isFinalStageActive: boolean;
  readonly onStageProgressChanged: () => void;
  readonly onPlayerBFell: () => void;
  readonly onFinalTimeRemainingChanged: (secondsRemaining: number | null) => void;
}

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

const FOGGY_TERRAIN_RGB: [number, number, number] = [110, 112, 100];
const LUSH_TERRAIN_RGB: [number, number, number] = [42, 78, 46];

export function TrustLevelScene({
  onGroundHeightReady,
  qualityPreset,
  restoration,
  playerAEntity,
  playerBEntity,
  playerBTeleportRequestRef,
  playerAExternalVelocityRef,
  playerBExternalVelocityRef,
  puzzleManager,
  isHiddenBridgeStageActive,
  isInvisiblePlatformsStageActive,
  isFaithLiftStageActive,
  isWindCrossingStageActive,
  isFinalStageActive,
  onStageProgressChanged,
  onPlayerBFell,
  onFinalTimeRemainingChanged,
}: TrustLevelSceneProps) {
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

  // Built from the same position constants that place the actual
  // puzzle mechanisms — not duplicated numbers — so this list can
  // never silently drift out of sync with where puzzles really are.
  // Radius chosen per mechanism type: platforms/plates/levers need a
  // tight radius (small, precise interaction points); the final
  // puzzle's combined area gets a wider one given how much happens
  // there.
  const puzzleExclusion = useMemo(
    () =>
      createExclusionZones([
        { x: EXCL_PLATE_ONE[0], z: EXCL_PLATE_ONE[2], radius: 3 },
        { x: EXCL_BRIDGE_ONE[0], z: EXCL_BRIDGE_ONE[2], radius: 6 },
        ...EXCL_PLATFORMS_TWO.map((position) => ({
          x: position[0],
          z: position[2],
          radius: 2.5,
        })),
        { x: EXCL_LEVER_THREE[0], z: EXCL_LEVER_THREE[2], radius: 3 },
        { x: EXCL_LIFT_BASE_THREE[0], z: EXCL_LIFT_BASE_THREE[2], radius: 3.5 },
        { x: EXCL_PLATE_FINAL[0], z: EXCL_PLATE_FINAL[2], radius: 3 },
        { x: EXCL_LEVER_FINAL[0], z: EXCL_LEVER_FINAL[2], radius: 3 },
        { x: EXCL_SPAWN_A.x, z: EXCL_SPAWN_A.z, radius: 6 },
        { x: EXCL_SPAWN_B.x, z: EXCL_SPAWN_B.z, radius: 6 },
      ]),
    []
  );

  // Natural forest clumps for the tree layer — "believable clusters,
  // avoid uniform spacing, mix open areas with dense forest" — rather
  // than the uniform scatterVegetation every other layer still
  // deliberately uses (grass/flowers reading as uniformly scattered
  // undergrowth is correct; trees reading as uniformly scattered is
  // the "obviously procedural" look this milestone asks to avoid).
  // Edge-aligned cluster centers, not randomly distributed across the
  // whole area — trees should frame the world's perimeter and the
  // paths through it, not fill the open ground grass is meant to
  // dominate. Hand-placed along both long edges of Trust's 100-wide,
  // 320-deep world, spread across its full depth.
  const treeClusterCenters = useMemo(
    () => [
      { x: -38, z: 120, weight: 1, radius: 10 },
      { x: 38, z: 90, weight: 1, radius: 9 },
      { x: -40, z: 40, weight: 1, radius: 11 },
      { x: 36, z: 0, weight: 1, radius: 9 },
      { x: -36, z: -50, weight: 1, radius: 10 },
      { x: 38, z: -100, weight: 1, radius: 9 },
    ],
    []
  );

  const treePoints = useMemo(
    () =>
      generateClusteredPoints({
        seed: 42,
        count: Math.round(26 * qualityPreset.foliageDensityMultiplier),
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
  const terrainColor = lerpColor(FOGGY_TERRAIN_RGB, LUSH_TERRAIN_RGB, restorationLevel);
  const terrainLayerColors = {
    grass: terrainColor,
    dirt: "rgb(90, 76, 56)",
    stone: "rgb(108, 106, 100)",
    cliff: "rgb(82, 80, 76)",
  };
  const fogDensity = Math.max(15, 60 - restorationLevel * 45);

  return (
    <>
      <Sky sunPosition={[6, 10 + restorationLevel * 10, -10]} turbidity={8} rayleigh={0.6} />
      <fogExp2 attach="fog" args={["#9aa294", 1.1 / (fogDensity * 3)]} />
      <directionalLight
        castShadow
        intensity={1.2 + restorationLevel * 1.6}
        color={restorationLevel > 0.5 ? "#fff6e0" : "#c8ccc0"}
        shadow-mapSize={[qualityPreset.shadowMapSize, qualityPreset.shadowMapSize]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
        shadow-camera-left={-WORLD_WIDTH / 2 - 10}
        shadow-camera-right={WORLD_WIDTH / 2 + 10}
        shadow-camera-top={WORLD_DEPTH / 2 + 10}
        shadow-camera-bottom={-WORLD_DEPTH / 2 - 10}
        shadow-camera-near={1}
        shadow-camera-far={120}
        position={[6, 16, -10]}
      />
      <ambientLight intensity={0.35 + restorationLevel * 0.25} color="#c0c8b8" />
      <hemisphereLight args={["#c8d0c0", "#3a4a30", 0.4 + restorationLevel * 0.3]} />
      <Environment preset="forest" background={false} />

      <TerrainMesh
        width={WORLD_WIDTH}
        depth={WORLD_DEPTH}
        onHeightFunctionReady={handleHeightFunctionReady}
        layerColors={terrainLayerColors}
        roughness={0.95}
      />

      {heightFunction && treeProp.scene && (
        <EnvironmentPropField
          scene={treeProp.scene}
          baseScale={propScale(ENVIRONMENT_PROP_IDS.TREE)}
          seed={41}
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
          seed={57}
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
          seed={68}
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
          seed={79}
          count={Math.round(8500 * qualityPreset.foliageDensityMultiplier)}
          areaWidth={WORLD_WIDTH}
          areaDepth={WORLD_DEPTH}
          heightFunction={heightFunction}
          isExcluded={puzzleExclusion}
          geometry={grassBladeGeometry}
          color="#3f6e3a"
          minScale={0.6}
          maxScale={1.3}
          maxLeanRadians={0.35}
          windStrength={0.25}
          castShadow={false}
        />
      )}
      {heightFunction && (
        <VegetationField
          seed={90}
          count={Math.round(34 * qualityPreset.foliageDensityMultiplier)}
          areaWidth={WORLD_WIDTH}
          areaDepth={WORLD_DEPTH}
          heightFunction={heightFunction}
          isExcluded={puzzleExclusion}
          geometry={flowerGeometry}
          color="#e0e8f0"
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
          seed={92}
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
          seed={94}
          count={Math.round(30 * qualityPreset.foliageDensityMultiplier)}
          areaWidth={WORLD_WIDTH}
          areaDepth={WORLD_DEPTH}
          heightFunction={heightFunction}
          isExcluded={puzzleExclusion}
          minScaleVariation={0.8}
          maxScaleVariation={1.2}
          castShadow={false}
        />
      )}
      <Waterfall position={[-30, 0, -40]} height={9} width={5} />

      <HiddenBridgePuzzle
        platePosition={PUZZLE_ONE_PLATE_POSITION}
        bridgePosition={PUZZLE_ONE_BRIDGE_POSITION}
        bridgeLength={PUZZLE_ONE_BRIDGE_LENGTH}
        goalPosition={PUZZLE_ONE_GOAL_POSITION}
        objectiveId={OBJECTIVE_HIDDEN_BRIDGE}
        playerAEntity={playerAEntity}
        playerBEntity={playerBEntity}
        puzzleManager={puzzleManager}
        isActiveStage={isHiddenBridgeStageActive}
        onStageProgressChanged={onStageProgressChanged}
      />

      <InvisiblePlatformPuzzle
        platformPositions={PUZZLE_TWO_PLATFORM_POSITIONS}
        respawnPosition={PUZZLE_TWO_PLAYER_B_RESPAWN_POSITION}
        fallYThreshold={PUZZLE_TWO_FALL_Y_THRESHOLD}
        goalPosition={PUZZLE_TWO_GOAL_POSITION}
        objectiveId={OBJECTIVE_INVISIBLE_PLATFORMS}
        playerBEntity={playerBEntity}
        playerBTeleportRequestRef={playerBTeleportRequestRef}
        puzzleManager={puzzleManager}
        isActiveStage={isInvisiblePlatformsStageActive}
        onStageProgressChanged={onStageProgressChanged}
        onPlayerBFell={onPlayerBFell}
      />

      <FaithLiftPuzzle
        leverPosition={PUZZLE_THREE_LEVER_POSITION}
        liftBasePosition={PUZZLE_THREE_LIFT_BASE_POSITION}
        liftTopY={PUZZLE_THREE_LIFT_TOP_Y}
        liftTravelSeconds={PUZZLE_THREE_LIFT_TRAVEL_SECONDS}
        destinationPosition={PUZZLE_THREE_DESTINATION_POSITION}
        playerBReadyRadius={PUZZLE_THREE_PLAYER_B_READY_RADIUS}
        goalPosition={PUZZLE_THREE_GOAL_POSITION}
        goalRadius={PUZZLE_THREE_GOAL_RADIUS}
        objectiveId={OBJECTIVE_FAITH_LIFT}
        playerBEntity={playerBEntity}
        playerBTeleportRequestRef={playerBTeleportRequestRef}
        puzzleManager={puzzleManager}
        isActiveStage={isFaithLiftStageActive}
        onStageProgressChanged={onStageProgressChanged}
      />

      <WindCrossingPuzzle
        zoneStartZ={PUZZLE_FOUR_ZONE_START_Z}
        zoneEndZ={PUZZLE_FOUR_ZONE_END_Z}
        togetherDistance={PUZZLE_FOUR_TOGETHER_DISTANCE}
        maxWindSpeed={PUZZLE_FOUR_MAX_WIND_SPEED}
        goalPosition={PUZZLE_FOUR_GOAL_POSITION}
        goalRadius={PUZZLE_FOUR_GOAL_RADIUS}
        objectiveId={OBJECTIVE_WIND_CROSSING}
        playerAEntity={playerAEntity}
        playerBEntity={playerBEntity}
        playerAExternalVelocityRef={playerAExternalVelocityRef}
        playerBExternalVelocityRef={playerBExternalVelocityRef}
        puzzleManager={puzzleManager}
        isActiveStage={isWindCrossingStageActive}
        onStageProgressChanged={onStageProgressChanged}
      />
      {isWindCrossingStageActive && (
        <AmbientParticles
          kind="dust"
          position={[
            0,
            2,
            (PUZZLE_FOUR_ZONE_START_Z + PUZZLE_FOUR_ZONE_END_Z) / 2,
          ]}
          area={[16, 4, Math.abs(PUZZLE_FOUR_ZONE_START_Z - PUZZLE_FOUR_ZONE_END_Z)]}
          count={Math.round(50 * qualityPreset.particleCountMultiplier)}
        />
      )}

      <TrustFinalPuzzle
        platePosition={FINAL_PUZZLE_PLATE_POSITION}
        bridgePosition={FINAL_PUZZLE_BRIDGE_POSITION}
        bridgeLength={FINAL_PUZZLE_BRIDGE_LENGTH}
        playerBTeleportRequestRef={playerBTeleportRequestRef}
        windZoneStartZ={FINAL_PUZZLE_WIND_ZONE_START_Z}
        windZoneEndZ={FINAL_PUZZLE_WIND_ZONE_END_Z}
        togetherDistance={FINAL_PUZZLE_TOGETHER_DISTANCE}
        maxWindSpeed={FINAL_PUZZLE_MAX_WIND_SPEED}
        goalPosition={FINAL_PUZZLE_GOAL_POSITION}
        goalRadius={FINAL_PUZZLE_GOAL_RADIUS}
        objectiveId={OBJECTIVE_FINAL}
        playerAEntity={playerAEntity}
        playerBEntity={playerBEntity}
        playerAExternalVelocityRef={playerAExternalVelocityRef}
        playerBExternalVelocityRef={playerBExternalVelocityRef}
        puzzleManager={puzzleManager}
        isActiveStage={isFinalStageActive}
        onStageProgressChanged={onStageProgressChanged}
        onTimeRemainingChanged={onFinalTimeRemainingChanged}
      />
      {isFinalStageActive && (
        <AmbientParticles
          kind="dust"
          position={[
            0,
            2,
            (FINAL_PUZZLE_WIND_ZONE_START_Z + FINAL_PUZZLE_WIND_ZONE_END_Z) / 2,
          ]}
          area={[16, 4, Math.abs(FINAL_PUZZLE_WIND_ZONE_START_Z - FINAL_PUZZLE_WIND_ZONE_END_Z)]}
          count={Math.round(60 * qualityPreset.particleCountMultiplier)}
        />
      )}

      {restoration.particleDensity > 0.1 && (
        <AmbientParticles
          kind="dust"
          position={[0, 3, 0]}
          area={[WORLD_WIDTH, 8, WORLD_DEPTH]}
          count={Math.round(
            30 * restoration.particleDensity * qualityPreset.particleCountMultiplier
          )}
        />
      )}
      {restoration.animalPresence > 0.2 && (
        <FlyingCreatures kind="bird" center={[0, 14, -20]} count={3} radius={30} />
      )}
    </>
  );
}

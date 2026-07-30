import { useMemo, useRef, useState } from "react";
import { Sky, Environment } from "@react-three/drei";
import type { DirectionalLight } from "three";
import { TerrainMesh } from "./TerrainMesh";
import { VegetationField } from "./VegetationField";
import { RiverWater } from "./RiverWater";
import { Waterfall } from "./Waterfall";
import { WoodenBridge } from "./WoodenBridge";
import { Bench } from "./Bench";
import { Fence } from "./Fence";
import { Planter } from "./Planter";
import { PostProcessingStack } from "./PostProcessingStack";
import { DayNightCycleController } from "./DayNightCycleController";
import { AmbientParticles } from "./AmbientParticles";
import { FlyingCreatures } from "./FlyingCreatures";
import {
  createBushGeometry,
  createFlowerGeometry,
  createGrassBladeGeometry,
  createLowPolyTreeGeometry,
  createRockGeometry,
} from "@/infrastructure/world/vegetation/ProceduralVegetationGeometry";
import { SCRIPTURE_STONES } from "../gardenOfBeginningsContent";
import { InteractableObject } from "@/presentation/gameplay/components/InteractableObject";
import type { GraphicsQualityPreset } from "@/domain/engine/config/GraphicsQualityPreset";

const WORLD_WIDTH = 120;
const WORLD_DEPTH = 120;
const RIVER_HALF_WIDTH = 4;
const BASE_GRASS_COUNT = 2500;
const BASE_FLOWER_COUNT = 60;
const BASE_TREE_COUNT = 90;
const BASE_BUSH_COUNT = 40;
const BASE_ROCK_COUNT = 35;
const BASE_POLLEN_COUNT = 80;
const BASE_DUST_COUNT = 40;

export interface GardenOfBeginningsSceneProps {
  readonly onGroundHeightReady: (heightFunction: (x: number, z: number) => number) => void;
  readonly onStoneInteract: (stoneId: string) => void;
  readonly qualityPreset: GraphicsQualityPreset;
}

/** The river runs roughly along a diagonal band through the world — used both to render water and to exclude vegetation from growing in it. */
function isInRiver(x: number, z: number): boolean {
  const bandCenter = x * 0.3 - 10;
  return Math.abs(z - bandCenter) < RIVER_HALF_WIDTH;
}

export function GardenOfBeginningsScene({
  onGroundHeightReady,
  onStoneInteract,
  qualityPreset,
}: GardenOfBeginningsSceneProps) {
  const sunRef = useRef<DirectionalLight>(null);
  const moonRef = useRef<DirectionalLight>(null);
  const [heightFunction, setHeightFunction] = useState<((x: number, z: number) => number) | null>(
    null
  );

  const treeGeometry = useMemo(() => createLowPolyTreeGeometry(), []);
  const bushGeometry = useMemo(() => createBushGeometry(), []);
  const rockGeometry = useMemo(() => createRockGeometry(), []);
  const grassGeometry = useMemo(() => createGrassBladeGeometry(), []);
  const flowerGeometry = useMemo(() => createFlowerGeometry(), []);

  const handleHeightFunctionReady = (fn: (x: number, z: number) => number) => {
    setHeightFunction(() => fn);
    onGroundHeightReady(fn);
  };

  return (
    <>
      {/* Sky's sunPosition is cosmetic-only (drives the procedural gradient); it does not track the animated
          directional light every frame — updating it reactively would cost a re-render per frame for a
          purely visual gradient shift. Known limitation, documented in the Milestone 5 report. */}
      <Sky sunPosition={[10, 20, 10]} turbidity={6} rayleigh={1.2} />
      <fog attach="fog" args={["#bcd4e6", 30, qualityPreset.drawDistance]} />

      <directionalLight
        ref={sunRef}
        castShadow
        intensity={3}
        color="#fff6e0"
        shadow-mapSize={[qualityPreset.shadowMapSize, qualityPreset.shadowMapSize]}
      />
      <directionalLight ref={moonRef} intensity={0} color="#8fa6c9" />
      <ambientLight intensity={0.4} color="#8fa6c9" />
      {/* Hemisphere light softens the flat look pure ambient light gives —
          sky-color from above, ground-color bounce from below, standard
          practice for outdoor daylight scenes. */}
      <hemisphereLight args={["#bcd4e6", "#4a5a3a", 0.6]} />
      {/* Procedural sky-derived environment map for ambient reflections on
          PBR materials (water, metal accents) — no HDRI asset was provided,
          so this generates one from the sky preset rather than using a flat
          placeholder cube. */}
      <Environment preset="park" background={false} />
      <DayNightCycleController sunRef={sunRef} moonRef={moonRef} />

      <TerrainMesh
        width={WORLD_WIDTH}
        depth={WORLD_DEPTH}
        onHeightFunctionReady={handleHeightFunctionReady}
      />

      {heightFunction && (
        <>
          <VegetationField
            seed={1}
            count={Math.round(BASE_GRASS_COUNT * qualityPreset.foliageDensityMultiplier)}
            areaWidth={WORLD_WIDTH}
            areaDepth={WORLD_DEPTH}
            heightFunction={heightFunction}
            isExcluded={isInRiver}
            geometry={grassGeometry}
            color="#5a9142"
            minScale={0.7}
            maxScale={1.4}
            windStrength={0.12}
            castShadow={false}
          />
          <VegetationField
            seed={2}
            count={Math.round(BASE_FLOWER_COUNT * qualityPreset.foliageDensityMultiplier)}
            areaWidth={WORLD_WIDTH}
            areaDepth={WORLD_DEPTH}
            heightFunction={heightFunction}
            isExcluded={isInRiver}
            geometry={flowerGeometry}
            color="#e08fb0"
            minScale={0.8}
            maxScale={1.2}
            windStrength={0.08}
            castShadow={false}
          />
          <VegetationField
            seed={3}
            count={Math.round(BASE_TREE_COUNT * qualityPreset.foliageDensityMultiplier)}
            areaWidth={WORLD_WIDTH}
            areaDepth={WORLD_DEPTH}
            heightFunction={heightFunction}
            isExcluded={isInRiver}
            geometry={treeGeometry}
            color="#2f5a2b"
            minScale={0.8}
            maxScale={1.5}
            windStrength={0.04}
            collisionRadius={0.35}
            collisionHeight={2.2}
          />
          <VegetationField
            seed={4}
            count={Math.round(BASE_BUSH_COUNT * qualityPreset.foliageDensityMultiplier)}
            areaWidth={WORLD_WIDTH}
            areaDepth={WORLD_DEPTH}
            heightFunction={heightFunction}
            isExcluded={isInRiver}
            geometry={bushGeometry}
            color="#3c6b34"
            minScale={0.9}
            maxScale={1.3}
            windStrength={0.06}
          />
          <VegetationField
            seed={5}
            count={Math.round(BASE_ROCK_COUNT * qualityPreset.foliageDensityMultiplier)}
            areaWidth={WORLD_WIDTH}
            areaDepth={WORLD_DEPTH}
            heightFunction={heightFunction}
            geometry={rockGeometry}
            color="#8a8a82"
            minScale={0.6}
            maxScale={2}
            windStrength={0}
            collisionRadius={0.5}
            collisionHeight={0.8}
          />
        </>
      )}

      <RiverWater
        position={[-10, 0.05, 0]}
        width={10}
        length={WORLD_DEPTH}
        rotationY={Math.atan2(0.3, 1)}
      />

      {/* Feeds the river at its far (northern) end. */}
      <Waterfall position={[-24, 0, -55]} height={8} width={5} />

      {/* A still pond, distinct from the flowing river — reuses RiverWater's
          reflective-water material rather than duplicating water-rendering
          logic for a second body of water. */}
      <RiverWater position={[24, 0.05, -30]} width={9} length={7} rotationY={0.3} />

      <WoodenBridge position={[-10, 0.55, 15]} rotationY={Math.atan2(0.3, 1) + Math.PI / 2} length={6} />

      <Bench position={[6, heightFunction ? heightFunction(6, 8) : 0, 8]} rotationY={Math.PI * 0.15} />
      <Bench position={[-4, heightFunction ? heightFunction(-4, -18) : 0, -18]} rotationY={-Math.PI * 0.4} />

      <Fence
        points={[
          [18, heightFunction ? heightFunction(18, -34) : 0, -34],
          [22, heightFunction ? heightFunction(22, -30) : 0, -30],
          [26, heightFunction ? heightFunction(26, -26) : 0, -26],
          [30, heightFunction ? heightFunction(30, -24) : 0, -24],
        ]}
      />

      <Planter position={[2, heightFunction ? heightFunction(2, 6) : 0, 6]} />
      <Planter position={[8, heightFunction ? heightFunction(8, 7) : 0, 7]} rotationY={0.8} />
      <Planter position={[-2, heightFunction ? heightFunction(-2, -16) : 0, -16]} rotationY={2.1} />

      <AmbientParticles
        kind="pollen"
        position={[0, 2, -22]}
        area={[15, 4, 15]}
        count={Math.round(BASE_POLLEN_COUNT * qualityPreset.particleCountMultiplier)}
      />
      <AmbientParticles
        kind="dust"
        position={[0, 3, 0]}
        area={[WORLD_WIDTH, 6, WORLD_DEPTH]}
        count={Math.round(BASE_DUST_COUNT * qualityPreset.particleCountMultiplier)}
      />
      <FlyingCreatures kind="bird" center={[0, 12, 0]} count={5} radius={20} />
      <FlyingCreatures kind="butterfly" center={[6, 2, 2]} count={6} radius={3} />

      {SCRIPTURE_STONES.map((stone) => (
        <InteractableObject
          key={stone.id}
          id={stone.id}
          position={stone.position}
          promptText={stone.promptText}
          color="#c9a84c"
          onInteract={() => {
            onStoneInteract(stone.id);
          }}
        />
      ))}

      {qualityPreset.postProcessingEnabled && <PostProcessingStack />}
    </>
  );
}

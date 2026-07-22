import { useMemo, useRef, useState } from "react";
import { Sky } from "@react-three/drei";
import type { DirectionalLight } from "three";
import { TerrainMesh } from "./TerrainMesh";
import { VegetationField } from "./VegetationField";
import { RiverWater } from "./RiverWater";
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

const WORLD_WIDTH = 120;
const WORLD_DEPTH = 120;
const RIVER_HALF_WIDTH = 4;

export interface GardenOfBeginningsSceneProps {
  readonly onGroundHeightReady: (heightFunction: (x: number, z: number) => number) => void;
  readonly onStoneInteract: (stoneId: string) => void;
}

/** The river runs roughly along a diagonal band through the world — used both to render water and to exclude vegetation from growing in it. */
function isInRiver(x: number, z: number): boolean {
  const bandCenter = x * 0.3 - 10;
  return Math.abs(z - bandCenter) < RIVER_HALF_WIDTH;
}

export function GardenOfBeginningsScene({
  onGroundHeightReady,
  onStoneInteract,
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
      <fog attach="fog" args={["#bcd4e6", 30, 140]} />

      <directionalLight
        ref={sunRef}
        castShadow
        intensity={3}
        color="#fff6e0"
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight ref={moonRef} intensity={0} color="#8fa6c9" />
      <ambientLight intensity={0.4} color="#8fa6c9" />
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
            count={2500}
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
            count={60}
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
            count={90}
            areaWidth={WORLD_WIDTH}
            areaDepth={WORLD_DEPTH}
            heightFunction={heightFunction}
            isExcluded={isInRiver}
            geometry={treeGeometry}
            color="#2f5a2b"
            minScale={0.8}
            maxScale={1.5}
            windStrength={0.04}
          />
          <VegetationField
            seed={4}
            count={40}
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
            count={35}
            areaWidth={WORLD_WIDTH}
            areaDepth={WORLD_DEPTH}
            heightFunction={heightFunction}
            geometry={rockGeometry}
            color="#8a8a82"
            minScale={0.6}
            maxScale={2}
            windStrength={0}
          />
        </>
      )}

      <RiverWater
        position={[-10, 0.05, 0]}
        width={10}
        length={WORLD_DEPTH}
        rotationY={Math.atan2(0.3, 1)}
      />

      <AmbientParticles kind="pollen" position={[0, 2, -22]} area={[15, 4, 15]} count={80} />
      <AmbientParticles kind="dust" position={[0, 3, 0]} area={[WORLD_WIDTH, 6, WORLD_DEPTH]} count={40} />
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

      <PostProcessingStack />
    </>
  );
}

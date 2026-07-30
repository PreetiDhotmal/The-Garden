import { useMemo, useRef, useState } from "react";
import { Sky, Environment, Cloud } from "@react-three/drei";
import type { DirectionalLight } from "three";
import { TerrainMesh } from "@/presentation/world/components/TerrainMesh";
import { VegetationField } from "@/presentation/world/components/VegetationField";
import { RiverWater } from "@/presentation/world/components/RiverWater";
import { DayNightCycleController } from "@/presentation/world/components/DayNightCycleController";
import { AmbientParticles } from "@/presentation/world/components/AmbientParticles";
import { FlyingCreatures } from "@/presentation/world/components/FlyingCreatures";
import {
  createBushGeometry,
  createFlowerGeometry,
  createGrassBladeGeometry,
  createLowPolyTreeGeometry,
  createRockGeometry,
} from "@/infrastructure/world/vegetation/ProceduralVegetationGeometry";

const WORLD_WIDTH = 120;
const WORLD_DEPTH = 120;
const RIVER_HALF_WIDTH = 4;

function isInRiver(x: number, z: number): boolean {
  const bandCenter = x * 0.3 - 10;
  return Math.abs(z - bandCenter) < RIVER_HALF_WIDTH;
}

/**
 * The visual environment slice of GardenOfBeginningsScene, without
 * anything gameplay-dependent (no NPCs, no InteractableObject/
 * scripture stones — both require GameplayProvider, which shouldn't
 * exist yet during the intro cutscene or main menu). Deliberately not
 * a modification of the real gameplay scene — a new, smaller,
 * complementary component for contexts that only need to *look at*
 * the Garden, not play in it. Lower vegetation counts than the real
 * scene since this only ever needs to look good from a distance
 * during a camera flythrough, not hold up to close inspection.
 */
export function CutsceneGardenBackdrop() {
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

  return (
    <>
      <Sky sunPosition={[10, 20, 10]} turbidity={6} rayleigh={1.2} />
      <fog attach="fog" args={["#bcd4e6", 30, 140]} />

      <Cloud position={[-20, 35, -30]} speed={0.15} opacity={0.5} segments={20} bounds={[20, 4, 20]} />
      <Cloud position={[25, 40, 10]} speed={0.1} opacity={0.4} segments={20} bounds={[25, 5, 25]} />
      <Cloud position={[0, 38, -50]} speed={0.12} opacity={0.35} segments={15} bounds={[18, 4, 18]} />

      <directionalLight ref={sunRef} castShadow intensity={3} color="#fff6e0" shadow-mapSize={[1024, 1024]} />
      <directionalLight ref={moonRef} intensity={0} color="#8fa6c9" />
      <ambientLight intensity={0.4} color="#8fa6c9" />
      <hemisphereLight args={["#bcd4e6", "#4a5a3a", 0.6]} />
      <Environment preset="park" background={false} />
      <DayNightCycleController sunRef={sunRef} moonRef={moonRef} />

      <TerrainMesh
        width={WORLD_WIDTH}
        depth={WORLD_DEPTH}
        onHeightFunctionReady={(fn) => {
          setHeightFunction(() => fn);
        }}
      />

      {heightFunction && (
        <>
          <VegetationField
            seed={1}
            count={900}
            areaWidth={WORLD_WIDTH}
            areaDepth={WORLD_DEPTH}
            heightFunction={heightFunction}
            isExcluded={isInRiver}
            geometry={grassGeometry}
            color="#5a9142"
            windStrength={0.12}
            castShadow={false}
          />
          <VegetationField
            seed={2}
            count={30}
            areaWidth={WORLD_WIDTH}
            areaDepth={WORLD_DEPTH}
            heightFunction={heightFunction}
            isExcluded={isInRiver}
            geometry={flowerGeometry}
            color="#e08fb0"
            windStrength={0.08}
            castShadow={false}
          />
          <VegetationField
            seed={3}
            count={60}
            areaWidth={WORLD_WIDTH}
            areaDepth={WORLD_DEPTH}
            heightFunction={heightFunction}
            isExcluded={isInRiver}
            geometry={treeGeometry}
            color="#2f5a2b"
            windStrength={0.04}
          />
          <VegetationField
            seed={4}
            count={25}
            areaWidth={WORLD_WIDTH}
            areaDepth={WORLD_DEPTH}
            heightFunction={heightFunction}
            isExcluded={isInRiver}
            geometry={bushGeometry}
            color="#3c6b34"
            windStrength={0.06}
          />
          <VegetationField
            seed={5}
            count={20}
            areaWidth={WORLD_WIDTH}
            areaDepth={WORLD_DEPTH}
            heightFunction={heightFunction}
            geometry={rockGeometry}
            color="#8a8a82"
            windStrength={0}
          />
        </>
      )}

      <RiverWater position={[-10, 0.05, 0]} width={10} length={WORLD_DEPTH} rotationY={Math.atan2(0.3, 1)} />
      <AmbientParticles kind="pollen" position={[0, 2, -22]} area={[15, 4, 15]} count={40} />
      <FlyingCreatures kind="bird" center={[0, 12, 0]} count={4} radius={20} />
    </>
  );
}

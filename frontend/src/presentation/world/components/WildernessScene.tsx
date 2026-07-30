import { useMemo, useRef, useState } from "react";
import { Sky, Environment } from "@react-three/drei";
import type { DirectionalLight } from "three";
import { TerrainMesh } from "./TerrainMesh";
import { VegetationField } from "./VegetationField";
import { RiverWater } from "./RiverWater";
import { AmbientParticles } from "./AmbientParticles";
import { FlyingCreatures } from "./FlyingCreatures";
import {
  createLowPolyTreeGeometry,
  createRockGeometry,
} from "@/infrastructure/world/vegetation/ProceduralVegetationGeometry";
import type { TerrainHeightmapConfig } from "@/infrastructure/world/terrain/TerrainHeightmap";
import { InteractableObject } from "@/presentation/gameplay/components/InteractableObject";
import { GlowingSeed } from "@/presentation/gameplay/components/GlowingSeed";
import type { GraphicsQualityPreset } from "@/domain/engine/config/GraphicsQualityPreset";
import {
  WORLD_WIDTH,
  WORLD_DEPTH,
  OASIS_POSITION,
  OASIS_INTERACTABLE_ID,
  TEMPTATION_STONE_ID,
  TEMPTATION_STONE_POSITION,
  MATTHEW_STONE_ID,
  MATTHEW_STONE_POSITION,
  MANNA_IDS,
  MANNA_POSITIONS,
} from "../wildernessContent";

const DUNE_HEIGHTMAP_CONFIG: TerrainHeightmapConfig = {
  seed: "the-wilderness",
  baseFrequency: 0.008,
  baseAmplitude: 6,
  octaves: 3,
  persistence: 0.55,
  lacunarity: 2.1,
};

const BASE_ROCK_COUNT = 55;
const BASE_DEAD_TREE_COUNT = 25;
const BASE_DUST_COUNT = 100;

export interface WildernessSceneProps {
  readonly onGroundHeightReady: (heightFunction: (x: number, z: number) => number) => void;
  readonly onOasisInteract: () => void;
  readonly onTemptationInteract: () => void;
  readonly onMatthewStoneInteract: () => void;
  readonly onMannaCollected: (mannaId: string) => void;
  readonly qualityPreset: GraphicsQualityPreset;
}

export function WildernessScene({
  onGroundHeightReady,
  onOasisInteract,
  onTemptationInteract,
  onMatthewStoneInteract,
  onMannaCollected,
  qualityPreset,
}: WildernessSceneProps) {
  const sunRef = useRef<DirectionalLight>(null);
  const [heightFunction, setHeightFunction] = useState<((x: number, z: number) => number) | null>(
    null
  );

  const rockGeometry = useMemo(() => createRockGeometry(), []);
  const deadTreeGeometry = useMemo(() => createLowPolyTreeGeometry(), []);

  const handleHeightFunctionReady = (fn: (x: number, z: number) => number) => {
    setHeightFunction(() => fn);
    onGroundHeightReady(fn);
  };

  return (
    <>
      {/* Warmer, hazier sky and heavier fog than the Garden — a hot,
          dust-hazed desert atmosphere rather than the Garden's clear
          blue. */}
      <Sky sunPosition={[15, 12, 5]} turbidity={12} rayleigh={0.4} mieCoefficient={0.02} />
      <fog attach="fog" args={["#d8b876", 20, qualityPreset.drawDistance * 0.75]} />

      <directionalLight
        ref={sunRef}
        castShadow
        intensity={3.4}
        color="#fff0d0"
        shadow-mapSize={[qualityPreset.shadowMapSize, qualityPreset.shadowMapSize]}
        position={[15, 12, 5]}
      />
      <ambientLight intensity={0.55} color="#e8c898" />
      <hemisphereLight args={["#f0d8a8", "#a8804a", 0.5]} />
      <Environment preset="sunset" background={false} />

      <TerrainMesh
        width={WORLD_WIDTH}
        depth={WORLD_DEPTH}
        heightmapConfig={DUNE_HEIGHTMAP_CONFIG}
        onHeightFunctionReady={handleHeightFunctionReady}
        color="#d2b076"
        roughness={1}
      />

      {heightFunction && (
        <>
          <VegetationField
            seed={11}
            count={Math.round(BASE_ROCK_COUNT * qualityPreset.foliageDensityMultiplier)}
            areaWidth={WORLD_WIDTH}
            areaDepth={WORLD_DEPTH}
            heightFunction={heightFunction}
            geometry={rockGeometry}
            color="#8a7458"
            minScale={0.6}
            maxScale={2.4}
            windStrength={0}
            collisionRadius={0.5}
            collisionHeight={0.9}
          />
          <VegetationField
            seed={12}
            count={Math.round(BASE_DEAD_TREE_COUNT * qualityPreset.foliageDensityMultiplier)}
            areaWidth={WORLD_WIDTH}
            areaDepth={WORLD_DEPTH}
            heightFunction={heightFunction}
            geometry={deadTreeGeometry}
            color="#5c4a35"
            minScale={0.6}
            maxScale={1.1}
            windStrength={0}
            collisionRadius={0.3}
            collisionHeight={2}
          />
        </>
      )}

      {/* Oasis — a small pool with a handful of green trees around it, the
          only green in the whole scene, deliberately, so it reads as a
          refuge at a glance. */}
      <RiverWater position={[OASIS_POSITION[0], 0.05, OASIS_POSITION[2]]} width={8} length={8} />
      <VegetationField
        seed={13}
        count={6}
        areaWidth={10}
        areaDepth={10}
        heightFunction={(x, z) =>
          heightFunction ? heightFunction(x + OASIS_POSITION[0], z + OASIS_POSITION[2]) : 0
        }
        geometry={deadTreeGeometry}
        color="#3f6b2f"
        minScale={0.9}
        maxScale={1.3}
        windStrength={0.05}
      />
      <InteractableObject
        id={OASIS_INTERACTABLE_ID}
        position={[OASIS_POSITION[0], OASIS_POSITION[1], OASIS_POSITION[2] + 3]}
        promptText="Drink from the Oasis"
        color="#4a90c4"
        radius={3}
        onInteract={onOasisInteract}
      />

      <InteractableObject
        id={TEMPTATION_STONE_ID}
        position={TEMPTATION_STONE_POSITION}
        promptText="Face the Weathered Stone"
        color="#a8785a"
        onInteract={onTemptationInteract}
      />
      <InteractableObject
        id={MATTHEW_STONE_ID}
        position={MATTHEW_STONE_POSITION}
        promptText="Read the Temptation Stone"
        color="#c9a84c"
        onInteract={onMatthewStoneInteract}
      />

      {MANNA_IDS.map((mannaId, index) => {
        const mannaPosition = MANNA_POSITIONS[index];
        if (!mannaPosition) {
          return null;
        }
        return (
          <GlowingSeed
            key={mannaId}
            id={mannaId}
            position={mannaPosition}
            onCollected={onMannaCollected}
          />
        );
      })}

      <AmbientParticles
        kind="dust"
        position={[0, 4, 0]}
        area={[WORLD_WIDTH, 8, WORLD_DEPTH]}
        count={Math.round(BASE_DUST_COUNT * qualityPreset.particleCountMultiplier)}
      />
      <FlyingCreatures kind="bird" center={[0, 15, -30]} count={3} radius={25} />
    </>
  );
}

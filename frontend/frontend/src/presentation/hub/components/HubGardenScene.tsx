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
import { InteractableObject } from "@/presentation/gameplay/components/InteractableObject";
import { Waterfall } from "@/presentation/world/components/Waterfall";
import { WoodenBridge } from "@/presentation/world/components/WoodenBridge";
import {
  createLowPolyTreeGeometry,
  createRockGeometry,
  createGrassBladeGeometry,
  createFlowerGeometry,
} from "@/infrastructure/world/vegetation/ProceduralVegetationGeometry";
import { createExclusionZones } from "@/infrastructure/world/vegetation/ExclusionZones";
import type { GraphicsQualityPreset } from "@/domain/engine/config/GraphicsQualityPreset";
import type { WorldProgressionQueryContext } from "@/domain/gameplay/progression/WorldUnlockCondition";
import { useGameFramework } from "@/presentation/game/hooks/useGameFramework";
import { CHAPTER_META_BY_ID } from "../chapterData";
import { ChapterGateStructure } from "./ChapterGateStructure";
import { HubSaveShrine } from "./HubSaveShrine";
import {
  HUB_WORLD_WIDTH,
  HUB_WORLD_DEPTH,
  HUB_GATE_RADIUS,
  HUB_FOUNTAIN_POSITION,
  HUB_SAVE_SHRINE_POSITION,
  HUB_CENTRAL_TREE_POSITION,
} from "../hubLayout";

export interface HubGardenSceneProps {
  readonly onGroundHeightReady: (heightFunction: (x: number, z: number) => number) => void;
  readonly onGateInteract: (chapterId: string) => void;
  readonly qualityPreset: GraphicsQualityPreset;
  readonly getProgressionContext: () => WorldProgressionQueryContext;
}

export function HubGardenScene({
  onGroundHeightReady,
  onGateInteract,
  qualityPreset,
  getProgressionContext,
}: HubGardenSceneProps) {
  const { chapterManager, gardenRestorationManager } = useGameFramework();
  const [heightFunction, setHeightFunction] = useState<((x: number, z: number) => number) | null>(
    null
  );

  const treeGeometry = useMemo(() => createLowPolyTreeGeometry(), []);
  const rockGeometry = useMemo(() => createRockGeometry(), []);
  const grassBladeGeometry = useMemo(() => createGrassBladeGeometry(), []);
  const flowerGeometry = useMemo(() => createFlowerGeometry(), []);

  const treeProp = useEnvironmentPropModel(ENVIRONMENT_PROP_IDS.TREE);
  const rockProp = useEnvironmentPropModel(ENVIRONMENT_PROP_IDS.ROCK);
  const bushProp = useEnvironmentPropModel(ENVIRONMENT_PROP_IDS.BUSH);
  const grassProp = useEnvironmentPropModel(ENVIRONMENT_PROP_IDS.GRASS);
  const flowerProp = useEnvironmentPropModel(ENVIRONMENT_PROP_IDS.FLOWER);

  const propScale = (assetId: string): number =>
    ENVIRONMENT_PROPS.find((prop) => prop.assetId === assetId)?.baseScale ?? 1;

  // Chapter gate positions are dynamic (they depend on how many
  // chapters are unlocked), always placed on a circle of radius
  // HUB_GATE_RADIUS around the origin - excluding a ring band around
  // that radius protects every gate regardless of how many exist or
  // exactly where each one lands, without needing their exact
  // positions. The central disc covers the fountain, save shrine,
  // central tree, and the bridge/waterfall/stream area.
  const hubExclusion = useMemo(() => {
    const centralDisc = createExclusionZones([
      { x: HUB_FOUNTAIN_POSITION[0], z: HUB_FOUNTAIN_POSITION[2], radius: 16 },
      { x: HUB_SAVE_SHRINE_POSITION[0], z: HUB_SAVE_SHRINE_POSITION[2], radius: 6 },
      { x: HUB_CENTRAL_TREE_POSITION[0], z: HUB_CENTRAL_TREE_POSITION[2], radius: 6 },
      { x: -18, z: -8, radius: 8 }, // stream/bridge area
    ]);
    const gateRing = (x: number, z: number) => {
      const distance = Math.hypot(x, z);
      return distance > HUB_GATE_RADIUS - 6 && distance < HUB_GATE_RADIUS + 6;
    };
    return (x: number, z: number) => centralDisc(x, z) || gateRing(x, z);
  }, []);

  const chapters = chapterManager.listInOrder(getProgressionContext());

  const handleHeightFunctionReady = (fn: (x: number, z: number) => number) => {
    setHeightFunction(() => fn);
    onGroundHeightReady(fn);
  };

  return (
    <>
      <Sky sunPosition={[10, 18, 8]} turbidity={4} rayleigh={1.2} />
      <fog attach="fog" args={["#cfe8d8", 30, qualityPreset.drawDistance]} />
      <directionalLight
        castShadow
        intensity={2.8}
        color="#fff6e0"
        shadow-mapSize={[qualityPreset.shadowMapSize, qualityPreset.shadowMapSize]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
        shadow-camera-left={-HUB_WORLD_WIDTH / 2 - 10}
        shadow-camera-right={HUB_WORLD_WIDTH / 2 + 10}
        shadow-camera-top={HUB_WORLD_DEPTH / 2 + 10}
        shadow-camera-bottom={-HUB_WORLD_DEPTH / 2 - 10}
        shadow-camera-near={1}
        shadow-camera-far={100}
        position={[10, 18, 8]}
      />
      <ambientLight intensity={0.6} color="#e8f0e0" />
      <hemisphereLight args={["#cfe8ff", "#6a9a5a", 0.6]} />
      <Environment preset="park" background={false} />

      <TerrainMesh
        width={HUB_WORLD_WIDTH}
        depth={HUB_WORLD_DEPTH}
        onHeightFunctionReady={handleHeightFunctionReady}
        color="#5a8f47"
      />

      {heightFunction && treeProp.scene && (
        <EnvironmentPropField
          scene={treeProp.scene}
          baseScale={propScale(ENVIRONMENT_PROP_IDS.TREE)}
          seed={20}
          count={Math.round(26 * qualityPreset.foliageDensityMultiplier)}
          areaWidth={HUB_WORLD_WIDTH}
          areaDepth={HUB_WORLD_DEPTH}
          heightFunction={heightFunction}
          isExcluded={hubExclusion}
          minScaleVariation={0.8}
          maxScaleVariation={1.4}
        />
      )}
      {heightFunction && rockProp.scene && (
        <EnvironmentPropField
          scene={rockProp.scene}
          baseScale={propScale(ENVIRONMENT_PROP_IDS.ROCK)}
          seed={21}
          count={Math.round(20 * qualityPreset.foliageDensityMultiplier)}
          areaWidth={HUB_WORLD_WIDTH}
          areaDepth={HUB_WORLD_DEPTH}
          heightFunction={heightFunction}
          isExcluded={hubExclusion}
          minScaleVariation={0.6}
          maxScaleVariation={1.5}
        />
      )}
      {heightFunction && bushProp.scene && (
        <EnvironmentPropField
          scene={bushProp.scene}
          baseScale={propScale(ENVIRONMENT_PROP_IDS.BUSH)}
          seed={22}
          count={Math.round(34 * qualityPreset.foliageDensityMultiplier)}
          areaWidth={HUB_WORLD_WIDTH}
          areaDepth={HUB_WORLD_DEPTH}
          heightFunction={heightFunction}
          isExcluded={hubExclusion}
          minScaleVariation={0.7}
          maxScaleVariation={1.6}
        />
      )}
      {heightFunction && (
        <VegetationField
          seed={23}
          count={Math.round(8500 * qualityPreset.foliageDensityMultiplier)}
          areaWidth={HUB_WORLD_WIDTH}
          areaDepth={HUB_WORLD_DEPTH}
          heightFunction={heightFunction}
          isExcluded={hubExclusion}
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
          seed={24}
          count={Math.round(50 * qualityPreset.foliageDensityMultiplier)}
          areaWidth={HUB_WORLD_WIDTH}
          areaDepth={HUB_WORLD_DEPTH}
          heightFunction={heightFunction}
          isExcluded={hubExclusion}
          geometry={flowerGeometry}
          color="#e8e0a0"
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
          seed={25}
          count={Math.round(6 * qualityPreset.foliageDensityMultiplier)}
          areaWidth={HUB_WORLD_WIDTH}
          areaDepth={HUB_WORLD_DEPTH}
          heightFunction={heightFunction}
          isExcluded={hubExclusion}
          minScaleVariation={0.8}
          maxScaleVariation={1.3}
          castShadow={false}
        />
      )}
      {heightFunction && flowerProp.scene && (
        <EnvironmentPropField
          scene={flowerProp.scene}
          baseScale={propScale(ENVIRONMENT_PROP_IDS.FLOWER)}
          seed={26}
          count={Math.round(30 * qualityPreset.foliageDensityMultiplier)}
          areaWidth={HUB_WORLD_WIDTH}
          areaDepth={HUB_WORLD_DEPTH}
          heightFunction={heightFunction}
          isExcluded={hubExclusion}
          minScaleVariation={0.8}
          maxScaleVariation={1.2}
          castShadow={false}
        />
      )}

      <mesh
        geometry={treeGeometry}
        position={HUB_CENTRAL_TREE_POSITION}
        scale={[4, 6, 4]}
        castShadow
      >
        <meshStandardMaterial color="#3f6b2f" roughness={0.9} />
      </mesh>

      <RiverWater position={HUB_FOUNTAIN_POSITION} width={7} length={7} />

      {/* Feeds a small stream toward the fountain from the west edge. */}
      <Waterfall position={[-30, 0, -14]} height={7} width={4} />
      <RiverWater position={[-18, 0.05, -8]} width={5} length={16} rotationY={0.5} />
      <WoodenBridge position={[-18, 0.4, -8]} rotationY={0.5 + Math.PI / 2} length={5} />

      {/* A pair of ancient statues flanking the fountain — reuses the rock geometry (Wilderness's ancient-ruins pattern) scaled tall, rather than a new sculpted asset. */}
      <mesh geometry={rockGeometry} position={[-4, 1.6, 4]} scale={[0.8, 3.2, 0.8]} castShadow>
        <meshStandardMaterial color="#9a9488" roughness={0.7} />
      </mesh>
      <mesh geometry={rockGeometry} position={[4, 1.6, 4]} scale={[0.8, 3.2, 0.8]} castShadow>
        <meshStandardMaterial color="#9a9488" roughness={0.7} />
      </mesh>

      {/* Fireflies — reuses the "pollen" particle kind (already warm-toned) at a smaller, more concentrated scale near the fountain, rather than a new particle system for a visually similar effect. */}
      <AmbientParticles kind="pollen" position={[0, 1.5, 4]} area={[10, 2, 10]} count={18} />

      {chapters.map((chapter, index) => {
        const meta = CHAPTER_META_BY_ID.get(chapter.definition.chapterId);
        if (!meta) {
          return null;
        }
        const angle = (index / chapters.length) * Math.PI * 2;
        const x = Math.sin(angle) * HUB_GATE_RADIUS;
        const z = Math.cos(angle) * HUB_GATE_RADIUS;
        const rotationY = angle + Math.PI;
        const groundY = heightFunction ? heightFunction(x, z) : 0;
        const restorationProfile = gardenRestorationManager.getZoneProfile(
          `hub-zone:${chapter.definition.chapterId}`
        );

        return (
          <group key={chapter.definition.chapterId}>
            <ChapterGateStructure
              position={[x, groundY, z]}
              rotationY={rotationY}
              status={chapter.status}
              restorationWarmth={restorationProfile.lightingWarmth}
            />
            <InteractableObject
              id={`interactable:gate:${chapter.definition.chapterId}`}
              position={[x, groundY + 1, z]}
              promptText={`View ${meta.displayName}`}
              radius={4}
              color="#c9a84c"
              onInteract={() => {
                onGateInteract(chapter.definition.chapterId);
              }}
            />
          </group>
        );
      })}

      <HubSaveShrine
        position={HUB_SAVE_SHRINE_POSITION}
        getProgressionContext={getProgressionContext}
      />

      <AmbientParticles
        kind="pollen"
        position={[0, 3, 0]}
        area={[HUB_WORLD_WIDTH, 6, HUB_WORLD_DEPTH]}
        count={Math.round(70 * qualityPreset.particleCountMultiplier)}
      />
      <FlyingCreatures kind="bird" center={[0, 12, -10]} count={4} radius={30} />
    </>
  );
}

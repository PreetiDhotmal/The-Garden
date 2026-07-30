import { useMemo } from "react";
import { createRockGeometry } from "@/infrastructure/world/vegetation/ProceduralVegetationGeometry";
import { WorldProgressionStatus } from "@/domain/gameplay/progression/WorldProgressionManager";

export interface ChapterGateStructureProps {
  readonly position: readonly [number, number, number];
  readonly rotationY: number;
  readonly status: WorldProgressionStatus;
  /** 0..1 — GardenRestorationManager's lightingWarmth for this gate's zone, driving the glow intensity smoothly rather than a hard on/off flip. */
  readonly restorationWarmth: number;
}

const LOCKED_COLOR = "#4a463f";
const UNLOCKED_COLOR = "#8a7458";
const COMPLETED_GLOW_COLOR = "#f0c96a";

/**
 * Locked gates are dark, dry stone with no glow at all. Unlocked-
 * but-not-completed gates are lit stone with a soft, steady glow.
 * Completed gates glow warm gold, intensity driven directly by
 * GardenRestorationManager's own restoration value rather than a
 * second "is it done" flag — visually correct even mid-restoration,
 * not just at the two endpoints.
 */
export function ChapterGateStructure({
  position,
  rotationY,
  status,
  restorationWarmth,
}: ChapterGateStructureProps) {
  const pillarGeometry = useMemo(() => createRockGeometry(), []);

  const isLocked = status === WorldProgressionStatus.LOCKED;
  const stoneColor = isLocked ? LOCKED_COLOR : UNLOCKED_COLOR;
  const glowColor = status === WorldProgressionStatus.COMPLETED ? COMPLETED_GLOW_COLOR : "#000000";
  const glowIntensity = isLocked ? 0 : restorationWarmth * 0.8;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={pillarGeometry} position={[-1.4, 1.6, 0]} scale={[1, 3.2, 1]} castShadow>
        <meshStandardMaterial
          color={stoneColor}
          emissive={glowColor}
          emissiveIntensity={glowIntensity}
          roughness={0.85}
        />
      </mesh>
      <mesh geometry={pillarGeometry} position={[1.4, 1.6, 0]} scale={[1, 3.2, 1]} castShadow>
        <meshStandardMaterial
          color={stoneColor}
          emissive={glowColor}
          emissiveIntensity={glowIntensity}
          roughness={0.85}
        />
      </mesh>
      <mesh geometry={pillarGeometry} position={[0, 3.4, 0]} scale={[3.4, 0.6, 0.6]} castShadow>
        <meshStandardMaterial
          color={stoneColor}
          emissive={glowColor}
          emissiveIntensity={glowIntensity}
          roughness={0.85}
        />
      </mesh>
      {!isLocked && (
        <pointLight
          position={[0, 2, 0.5]}
          color={status === WorldProgressionStatus.COMPLETED ? COMPLETED_GLOW_COLOR : "#f0e0b8"}
          intensity={restorationWarmth * 3}
          distance={8}
        />
      )}
    </group>
  );
}

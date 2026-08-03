import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import type { CharacterEntity } from "@/domain/character/CharacterEntity";

export interface PressurePlateProps {
  readonly position: readonly [number, number, number];
  readonly watchedEntity: CharacterEntity | null;
  readonly radius?: number;
  readonly isActive: boolean;
  readonly onActivated: () => void;
}

const PLATE_RADIUS_DEFAULT = 1.5;

/**
 * Purely presence-based — no interact key, matching how a pressure
 * plate actually works (weight/proximity, not a deliberate button
 * press). Activates once and stays active for the rest of this puzzle
 * attempt; onActivated only fires on the transition into range, never
 * repeatedly while standing on it.
 */
export function PressurePlate({
  position,
  watchedEntity,
  radius = PLATE_RADIUS_DEFAULT,
  isActive,
  onActivated,
}: PressurePlateProps) {
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    if (isActive || !watchedEntity) {
      return;
    }
    const entityPosition = watchedEntity.getPosition();
    const dx = entityPosition.x - position[0];
    const dz = entityPosition.z - position[2];
    if (Math.hypot(dx, dz) <= radius) {
      onActivated();
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <cylinderGeometry args={[radius, radius, 0.1, 16]} />
      <meshStandardMaterial
        color={isActive ? "#e0c060" : "#5a5040"}
        emissive={isActive ? "#e0c060" : "#000000"}
        emissiveIntensity={isActive ? 0.5 : 0}
        roughness={0.8}
      />
    </mesh>
  );
}

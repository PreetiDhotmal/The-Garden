import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

export interface FaithLiftProps {
  readonly basePosition: readonly [number, number, number];
  readonly topY: number;
  readonly travelSeconds: number;
  readonly isActivated: boolean;
}

/** Eases toward the target rather than moving linearly — a small polish touch that also makes the motion read clearly as "ancient mechanism," not a teleporting box. */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function FaithLift({ basePosition, topY, travelSeconds, isActivated }: FaithLiftProps) {
  const groupRef = useRef<Group>(null);
  const elapsedRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) {
      return;
    }
    if (isActivated) {
      elapsedRef.current = Math.min(travelSeconds, elapsedRef.current + delta);
    } else {
      elapsedRef.current = 0;
    }
    const t = easeInOutCubic(elapsedRef.current / travelSeconds);
    groupRef.current.position.y = basePosition[1] + (topY - basePosition[1]) * t;
  });

  return (
    <group ref={groupRef} position={[basePosition[0], basePosition[1], basePosition[2]]}>
      <mesh receiveShadow castShadow>
        <cylinderGeometry args={[2, 2.2, 0.4, 8]} />
        <meshStandardMaterial color="#7a6f5c" roughness={0.85} metalness={0.1} />
      </mesh>
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 2, 6]} />
        <meshStandardMaterial color="#5a5248" roughness={0.9} />
      </mesh>
    </group>
  );
}

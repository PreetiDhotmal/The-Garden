import { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import { createBenchGeometry } from "@/infrastructure/world/props/ProceduralPropGeometry";

export interface BenchProps {
  readonly position: readonly [number, number, number];
  readonly rotationY?: number;
}

export function Bench({ position, rotationY = 0 }: BenchProps) {
  const geometry = useMemo(() => createBenchGeometry(), []);

  return (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color="#5c4630" roughness={0.9} />
      </mesh>
    </RigidBody>
  );
}

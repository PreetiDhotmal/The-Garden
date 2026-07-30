import { useMemo } from "react";
import { createPlanterGeometry } from "@/infrastructure/world/props/ProceduralPropGeometry";

export interface PlanterProps {
  readonly position: readonly [number, number, number];
  readonly rotationY?: number;
}

export function Planter({ position, rotationY = 0 }: PlanterProps) {
  const geometry = useMemo(() => createPlanterGeometry(), []);

  return (
    <mesh geometry={geometry} position={position} rotation={[0, rotationY, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#9c5a3c" roughness={0.85} />
    </mesh>
  );
}

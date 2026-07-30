import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh, PointLight } from "three";
import { CRYSTAL_BASE_GEOMETRY, CRYSTAL_GEOMETRY } from "./puzzleGeometry";

export interface TargetCrystalProps {
  readonly position: readonly [number, number, number];
  readonly isActivated: boolean;
}

const DORMANT_COLOR = "#5a6b78";
const ACTIVE_COLOR = "#8fe0d0";

export function TargetCrystal({ position, isActivated }: TargetCrystalProps) {
  const meshRef = useRef<Mesh>(null);
  const lightRef = useRef<PointLight>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      const pulse = isActivated ? 1 + Math.sin(state.clock.elapsedTime * 3) * 0.08 : 1;
      meshRef.current.scale.setScalar(pulse);
      meshRef.current.rotation.y += (isActivated ? 0.6 : 0.15) * delta;
    }
    if (lightRef.current) {
      lightRef.current.intensity = isActivated ? 4 : 0;
    }
  });

  return (
    <group position={position}>
      <mesh geometry={CRYSTAL_BASE_GEOMETRY} position={[0, -0.9, 0]} castShadow>
        <meshStandardMaterial color="#6b5a42" roughness={0.9} />
      </mesh>
      <mesh ref={meshRef} geometry={CRYSTAL_GEOMETRY} castShadow>
        <meshStandardMaterial
          color={isActivated ? ACTIVE_COLOR : DORMANT_COLOR}
          emissive={isActivated ? ACTIVE_COLOR : "#000000"}
          emissiveIntensity={isActivated ? 0.8 : 0}
          metalness={0.3}
          roughness={0.2}
        />
      </mesh>
      <pointLight ref={lightRef} color={ACTIVE_COLOR} distance={10} intensity={0} />
    </group>
  );
}

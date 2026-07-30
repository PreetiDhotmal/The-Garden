import { RigidBody } from "@react-three/rapier";

export interface GlowingPlatformProps {
  readonly position: readonly [number, number, number];
  readonly size?: number;
}

export function GlowingPlatform({ position, size = 2 }: GlowingPlatformProps) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[size, 0.3, size]} />
        <meshStandardMaterial
          color="#8fd0c0"
          emissive="#8fd0c0"
          emissiveIntensity={0.5}
          roughness={0.6}
        />
      </mesh>
    </RigidBody>
  );
}

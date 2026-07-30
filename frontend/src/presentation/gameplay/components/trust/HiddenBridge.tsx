import { RigidBody } from "@react-three/rapier";

export interface HiddenBridgeProps {
  readonly position: readonly [number, number, number];
  readonly length: number;
  readonly width?: number;
  readonly isActive: boolean;
}

export function HiddenBridge({ position, length, width = 2, isActive }: HiddenBridgeProps) {
  if (!isActive) {
    return null;
  }

  return (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[width, 0.3, length]} />
        <meshStandardMaterial color="#8a7050" roughness={0.85} />
      </mesh>
    </RigidBody>
  );
}

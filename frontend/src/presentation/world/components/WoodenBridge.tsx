import { useMemo } from "react";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import {
  createBridgePlankSpanGeometry,
  createBridgeRailGeometry,
} from "@/infrastructure/world/props/ProceduralPropGeometry";

export interface WoodenBridgeProps {
  readonly position: readonly [number, number, number];
  readonly rotationY?: number;
  readonly length: number;
  readonly width?: number;
}

/**
 * Spans the river — the plank deck has a real fixed collider (a
 * simple box matching the deck footprint, not per-plank colliders,
 * since the player only ever needs to stand on top of it) so the
 * player can actually walk across rather than falling through.
 */
export function WoodenBridge({ position, rotationY = 0, length, width = 2 }: WoodenBridgeProps) {
  const deckGeometry = useMemo(() => createBridgePlankSpanGeometry(length, width), [length, width]);
  const railGeometry = useMemo(() => createBridgeRailGeometry(length), [length]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={deckGeometry} castShadow receiveShadow>
        <meshStandardMaterial color="#8a6642" roughness={0.9} />
      </mesh>
      <mesh geometry={railGeometry} position={[width / 2, 0.55, 0]} castShadow>
        <meshStandardMaterial color="#6b4d30" roughness={0.85} />
      </mesh>
      <mesh geometry={railGeometry} position={[-width / 2, 0.55, 0]} castShadow>
        <meshStandardMaterial color="#6b4d30" roughness={0.85} />
      </mesh>

      <RigidBody type="fixed" colliders={false} position={[0, 0, 0]}>
        <CuboidCollider args={[width / 2, 0.1, length / 2]} />
      </RigidBody>
    </group>
  );
}

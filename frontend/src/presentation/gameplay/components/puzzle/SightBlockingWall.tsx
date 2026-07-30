import { RigidBody } from "@react-three/rapier";

export interface SightBlockingWallProps {
  readonly position: readonly [number, number, number];
  readonly width?: number;
  readonly height?: number;
  /**
   * 0 (default) orients the wall's "width" along X, blocking Z-axis
   * (forward/back) sightlines — correct for players separated by
   * depth. Math.PI / 2 rotates it so "width" instead spans Z,
   * blocking X-axis (left/right) sightlines — correct for the
   * left/right player split every puzzle in this level actually
   * uses (Player A's content at negative X, Player B's at positive
   * X, same Z range), which the un-rotated default does NOT block.
   */
  readonly rotationY?: number;
}

export function SightBlockingWall({
  position,
  width = 14,
  height = 4,
  rotationY = 0,
}: SightBlockingWallProps) {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh position={position} rotation={[0, rotationY, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, 0.6]} />
        <meshStandardMaterial color="#7a6f5c" roughness={0.9} />
      </mesh>
    </RigidBody>
  );
}

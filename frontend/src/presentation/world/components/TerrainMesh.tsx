import { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import {
  createTerrainHeightFunction,
  type TerrainHeightmapConfig,
} from "@/infrastructure/world/terrain/TerrainHeightmap";
import { createTerrainGeometry } from "@/infrastructure/world/terrain/TerrainGeometry";

export interface TerrainMeshProps {
  readonly width: number;
  readonly depth: number;
  readonly segments?: number;
  readonly heightmapConfig?: TerrainHeightmapConfig;
  readonly onHeightFunctionReady?: (heightFunction: (x: number, z: number) => number) => void;
}

/**
 * Renders the ground plane for a world region: a displaced,
 * physically-based terrain mesh with a matching trimesh physics
 * collider (reusing Rapier via @react-three/rapier, already the
 * engine's physics integration since Milestone 2/3 — no new physics
 * dependency).
 */
export function TerrainMesh({
  width,
  depth,
  segments = 128,
  heightmapConfig,
  onHeightFunctionReady,
}: TerrainMeshProps) {
  const heightFunction = useMemo(() => {
    const fn = createTerrainHeightFunction(heightmapConfig);
    onHeightFunctionReady?.(fn);
    return fn;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heightmapConfig]);

  const geometry = useMemo(
    () =>
      createTerrainGeometry({
        width,
        depth,
        widthSegments: segments,
        depthSegments: segments,
        heightFunction,
      }),
    [width, depth, segments, heightFunction]
  );

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial color="#4a7c3f" roughness={0.95} metalness={0} />
      </mesh>
    </RigidBody>
  );
}

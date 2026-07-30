import { useEffect, useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import {
  createTerrainHeightFunction,
  type TerrainHeightmapConfig,
} from "@/infrastructure/world/terrain/TerrainHeightmap";
import { createTerrainGeometry } from "@/infrastructure/world/terrain/TerrainGeometry";
import {
  createLayeredTerrainMaterial,
  type TerrainLayerColors,
} from "@/infrastructure/world/terrain/LayeredTerrainMaterial";

export interface TerrainMeshProps {
  readonly width: number;
  readonly depth: number;
  readonly segments?: number;
  readonly heightmapConfig?: TerrainHeightmapConfig;
  readonly onHeightFunctionReady?: (heightFunction: (x: number, z: number) => number) => void;
  /** Defaults to the Garden's green — other worlds (e.g. desert) pass their own. Ignored if layerColors is provided. */
  readonly color?: string;
  readonly roughness?: number;
  /**
   * Opt-in slope/height-blended material (grass/dirt/stone/cliff) —
   * when provided, replaces the flat `color` entirely. Omit to keep
   * the existing single-color behavior exactly as before; this is
   * purely additive, not a replacement for every caller, so anything
   * not yet updated to pass this keeps rendering exactly as it did.
   */
  readonly layerColors?: TerrainLayerColors;
  readonly cliffHeightStart?: number;
  readonly cliffHeightEnd?: number;
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
  color = "#4a7c3f",
  roughness = 0.95,
  layerColors,
  cliffHeightStart,
  cliffHeightEnd,
}: TerrainMeshProps) {
  // Pure — computes the height function only, no side effects. Every
  // caller across this codebase (five of them) was affected by this
  // component previously calling onHeightFunctionReady synchronously
  // from inside this useMemo, which runs during TerrainMesh's own
  // render — invoking a parent's setState mid-render is exactly what
  // produces React's "Cannot update a component while rendering
  // <Other>" warning. Notifying the parent is now handled entirely by
  // the useEffect below.
  const heightFunction = useMemo(() => {
    return createTerrainHeightFunction(heightmapConfig);
  }, [heightmapConfig]);

  useEffect(() => {
    onHeightFunctionReady?.(heightFunction);
    // onHeightFunctionReady is intentionally excluded — every current
    // call site passes a fresh inline arrow function each render, so
    // including it would fire this effect (and the parent's setState)
    // on every single render instead of only when heightFunction
    // itself actually changes, defeating the fix's purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heightFunction]);

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

  // Depends on the individual color strings, not the layerColors
  // object reference — a caller passing a fresh object literal each
  // render (a common pattern, e.g. `layerColors={{ grass: ..., ... }}`
  // inline in JSX) would otherwise trigger a full shader recompilation
  // every single render, which is expensive and entirely avoidable.
  const layeredMaterial = useMemo(() => {
    if (!layerColors) {
      return null;
    }
    return createLayeredTerrainMaterial({
      colors: layerColors,
      roughness,
      ...(cliffHeightStart !== undefined ? { cliffHeightStart } : {}),
      ...(cliffHeightEnd !== undefined ? { cliffHeightEnd } : {}),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    layerColors?.grass,
    layerColors?.dirt,
    layerColors?.stone,
    layerColors?.cliff,
    roughness,
    cliffHeightStart,
    cliffHeightEnd,
  ]);

  return (
    <RigidBody type="fixed" colliders="trimesh">
      {layeredMaterial ? (
        <mesh geometry={geometry} material={layeredMaterial} receiveShadow />
      ) : (
        <mesh geometry={geometry} receiveShadow>
          <meshStandardMaterial color={color} roughness={roughness} metalness={0} />
        </mesh>
      )}
    </RigidBody>
  );
}

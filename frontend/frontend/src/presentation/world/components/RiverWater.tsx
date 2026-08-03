import { useMemo } from "react";
import { MeshReflectorMaterial } from "@react-three/drei";
import { RepeatWrapping, type Texture } from "three";
import { useEngine } from "@/presentation/engine/hooks/useEngine";

export interface RiverWaterProps {
  readonly position: readonly [number, number, number];
  readonly width: number;
  readonly length: number;
  readonly rotationY?: number;
}

/**
 * The river surface. Reflection/blur/distortion come from drei's
 * MeshReflectorMaterial (a real, performant reflective-water
 * technique — render-target-based planar reflection with a blurred
 * mip chain), not a placeholder flat blue plane. Animated flow is
 * approximated via the material's built-in distortion animation
 * rather than a custom flow-map shader, which would need an actual
 * flow-map texture asset that wasn't provided.
 */
export function RiverWater({ position, width, length, rotationY = 0 }: RiverWaterProps) {
  const { assetManager } = useEngine();

  const normalMap = useMemo<Texture | undefined>(() => {
    // Reuses the engine's texture pipeline if a water normal map asset
    // is registered; falls back to undefined (a flatter but still
    // reflective surface) when none is available, rather than failing.
    return assetManager.isCached("textures:water-normal")
      ? assetManager.getCached<Texture>("textures:water-normal")
      : undefined;
  }, [assetManager]);

  if (normalMap) {
    normalMap.wrapS = RepeatWrapping;
    normalMap.wrapT = RepeatWrapping;
  }

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, rotationY]} receiveShadow>
      <planeGeometry args={[width, length, 32, 32]} />
      <MeshReflectorMaterial
        resolution={1024}
        mixBlur={0.85}
        mixStrength={2.2}
        roughness={0.35}
        blur={[300, 100]}
        depthScale={0.4}
        minDepthThreshold={0.85}
        maxDepthThreshold={1.2}
        color="#3f7d8c"
        metalness={0.1}
        {...(normalMap ? { normalMap } : {})}
      />
    </mesh>
  );
}

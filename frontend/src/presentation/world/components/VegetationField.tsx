import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Instance, Instances } from "@react-three/drei";
import { RigidBody, CylinderCollider } from "@react-three/rapier";
import type { BufferGeometry, MeshStandardMaterial } from "three";
import {
  scatterVegetation,
  mulberry32,
  type VegetationInstanceTransform,
} from "@/infrastructure/world/vegetation/VegetationScattering";
import {
  applyWindSway,
  updateWindSwayTime,
  type WindSwayUniforms,
} from "@/infrastructure/world/vegetation/WindSway";

export interface VegetationFieldProps {
  readonly seed: number;
  readonly count: number;
  readonly areaWidth: number;
  readonly areaDepth: number;
  readonly heightFunction: (x: number, z: number) => number;
  readonly isExcluded?: (x: number, z: number) => boolean;
  readonly geometry: BufferGeometry;
  readonly color: string;
  readonly minScale?: number;
  readonly maxScale?: number;
  readonly castShadow?: boolean;
  /** 0 disables sway (rocks); grass/trees/flowers pass a value. */
  readonly windStrength?: number;
  /**
   * Base radius (in world units, before per-instance scale) for a
   * fixed cylinder collider at each instance's position. Omit for
   * anything the player should walk through (grass, flowers) — only
   * pass this for sparse, blocking vegetation (trees, rocks). A
   * separate RigidBody per instance is fine at these counts (tens,
   * not hundreds); at grass/flower counts it would not be.
   */
  readonly collisionRadius?: number;
  readonly collisionHeight?: number;
  /**
   * Bypasses this component's own internal scatterVegetation call
   * entirely — when provided, these exact (x, z) points are used
   * instead, still resting on `heightFunction` and still getting
   * random rotation/scale from `seed`. Lets a caller use a different
   * placement algorithm (e.g. ClusteredScattering's weighted clumps)
   * while reusing the exact same instanced rendering, wind sway, and
   * collision logic every other caller already relies on — nothing
   * about this component's existing callers changes when this prop is
   * omitted.
   */
  readonly preComputedPoints?: readonly { x: number; z: number }[];
}

/**
 * Renders `count` GPU-instanced copies of `geometry` scattered across
 * the area (deterministically — see VegetationScattering, or
 * ClusteredScattering via preComputedPoints). This one component is
 * reused for grass, bushes, trees, and rocks — only the
 * geometry/material/scatter parameters differ per call site, which is
 * what "no duplicate code" means for environment art at this scale.
 */
export function VegetationField({
  seed,
  count,
  areaWidth,
  areaDepth,
  heightFunction,
  isExcluded,
  geometry,
  color,
  minScale = 0.8,
  maxScale = 1.3,
  castShadow = true,
  windStrength = 0,
  collisionRadius,
  collisionHeight = 3,
  preComputedPoints,
}: VegetationFieldProps) {
  const windUniformsRef = useRef<WindSwayUniforms | null>(null);

  const instances = useMemo<readonly VegetationInstanceTransform[]>(() => {
    if (preComputedPoints) {
      // Same per-instance randomization (rotation, scale) as
      // scatterVegetation's own internal loop, seeded identically —
      // only the (x, z) source differs.
      const random = mulberry32(seed);
      return preComputedPoints.map((point) => ({
        x: point.x,
        y: heightFunction(point.x, point.z),
        z: point.z,
        rotationY: random() * Math.PI * 2,
        scale: minScale + random() * (maxScale - minScale),
      }));
    }
    return scatterVegetation({
      seed,
      count,
      areaWidth,
      areaDepth,
      heightFunction,
      ...(isExcluded ? { isExcluded } : {}),
      minScale,
      maxScale,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, count, areaWidth, areaDepth, minScale, maxScale, preComputedPoints]);

  useFrame((state) => {
    if (windUniformsRef.current) {
      updateWindSwayTime(windUniformsRef.current, state.clock.elapsedTime);
    }
  });

  return (
    <>
      <Instances limit={Math.max(1, instances.length)} range={instances.length} castShadow={castShadow}>
        <primitive object={geometry} attach="geometry" />
        <meshStandardMaterial
          ref={(material: MeshStandardMaterial | null) => {
            if (material && windStrength > 0 && !windUniformsRef.current) {
              windUniformsRef.current = applyWindSway(material, { strength: windStrength });
            }
          }}
          color={color}
          roughness={0.85}
        />
        {instances.map((instance, index) => (
          <Instance
            key={`${instance.x.toString()}-${instance.z.toString()}-${index.toString()}`}
            position={[instance.x, instance.y, instance.z]}
            rotation={[0, instance.rotationY, 0]}
            scale={instance.scale}
          />
        ))}
      </Instances>

      {collisionRadius !== undefined &&
        instances.map((instance, index) => (
          <RigidBody
            key={`collider-${instance.x.toString()}-${instance.z.toString()}-${index.toString()}`}
            type="fixed"
            position={[instance.x, instance.y + (collisionHeight * instance.scale) / 2, instance.z]}
            colliders={false}
          >
            <CylinderCollider
              args={[(collisionHeight * instance.scale) / 2, collisionRadius * instance.scale]}
            />
          </RigidBody>
        ))}
    </>
  );
}

import { useMemo } from "react";
import type { Object3D } from "three";
import {
  scatterVegetation,
  mulberry32,
  type VegetationInstanceTransform,
} from "@/infrastructure/world/vegetation/VegetationScattering";

export interface EnvironmentPropFieldProps {
  readonly scene: Object3D | null;
  readonly baseScale: number;
  readonly seed: number;
  readonly count: number;
  readonly areaWidth: number;
  readonly areaDepth: number;
  readonly heightFunction: (x: number, z: number) => number;
  readonly isExcluded?: (x: number, z: number) => boolean;
  /** Multiplied with baseScale per instance for natural size variation — same convention as VegetationField's minScale/maxScale. */
  readonly minScaleVariation?: number;
  readonly maxScaleVariation?: number;
  readonly castShadow?: boolean;
  readonly receiveShadow?: boolean;
  /** Bypasses internal scatterVegetation entirely when provided — same convention as VegetationField's own preComputedPoints, so an existing clustered layout (e.g. from ClusteredScattering) can be reused for the real asset instead of computing a fresh, different one. */
  readonly preComputedPoints?: readonly { x: number; z: number }[];
}

/**
 * Renders `count` scattered clones of a loaded multi-mesh GLTF prop —
 * the environment-art equivalent of VegetationField, for source assets
 * too complex (multiple meshes/materials, real textures) to reduce to
 * VegetationField's single-geometry-plus-tint-color model without
 * losing the actual artwork. Not true GPU instancing (each clone is
 * its own draw call, unlike VegetationField's Instances/Instance) —
 * appropriate for moderate counts (tens, not hundreds) of hero props
 * like trees, rocks, and bushes, not dense grass/flower fields.
 */
export function EnvironmentPropField({
  scene,
  baseScale,
  seed,
  count,
  areaWidth,
  areaDepth,
  heightFunction,
  isExcluded,
  minScaleVariation = 0.85,
  maxScaleVariation = 1.2,
  castShadow = true,
  receiveShadow = true,
  preComputedPoints,
}: EnvironmentPropFieldProps) {
  const instances = useMemo<readonly VegetationInstanceTransform[]>(() => {
    if (preComputedPoints) {
      const random = mulberry32(seed);
      const results: VegetationInstanceTransform[] = [];
      for (const point of preComputedPoints) {
        let y: number;
        try {
          y = heightFunction(point.x, point.z);
        } catch (error) {
          console.error(
            `[EnvironmentPropField] heightFunction threw for point (${point.x.toString()}, ${point.z.toString()}) - skipping this instance.`,
            error
          );
          continue;
        }
        if (!Number.isFinite(y)) {
          console.error(
            `[EnvironmentPropField] heightFunction returned a non-finite value for point (${point.x.toString()}, ${point.z.toString()}) - skipping this instance.`
          );
          continue;
        }
        results.push({
          x: point.x,
          y,
          z: point.z,
          rotationY: random() * Math.PI * 2,
          scale: minScaleVariation + random() * (maxScaleVariation - minScaleVariation),
          leanX: 0,
          leanZ: 0,
        });
      }
      return results;
    }
    return scatterVegetation({
      seed,
      count,
      areaWidth,
      areaDepth,
      heightFunction,
      ...(isExcluded ? { isExcluded } : {}),
      minScale: minScaleVariation,
      maxScale: maxScaleVariation,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, count, areaWidth, areaDepth, minScaleVariation, maxScaleVariation, preComputedPoints]);

  const clones = useMemo(() => {
    if (!scene) {
      return [];
    }
    const results: { instance: VegetationInstanceTransform; clone: Object3D }[] = [];
    for (const instance of instances) {
      try {
        const clone = scene.clone(true);
        clone.traverse((object) => {
          object.castShadow = castShadow;
          object.receiveShadow = receiveShadow;
        });
        results.push({ instance, clone });
      } catch (error) {
        console.error("[EnvironmentPropField] Failed to clone an instance - skipping it.", error);
      }
    }
    return results;
  }, [scene, instances, castShadow, receiveShadow]);

  if (!scene) {
    return null;
  }

  return (
    <>
      {clones.map(({ instance, clone }, index) => (
        <primitive
          key={`env-prop-${index.toString()}`}
          object={clone}
          position={[instance.x, instance.y, instance.z]}
          rotation={[0, instance.rotationY, 0]}
          scale={baseScale * instance.scale}
        />
      ))}
    </>
  );
}

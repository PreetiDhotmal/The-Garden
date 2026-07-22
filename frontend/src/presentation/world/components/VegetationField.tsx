import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Instance, Instances } from "@react-three/drei";
import type { BufferGeometry, MeshStandardMaterial } from "three";
import { scatterVegetation } from "@/infrastructure/world/vegetation/VegetationScattering";
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
}

/**
 * Renders `count` GPU-instanced copies of `geometry` scattered across
 * the area (deterministically — see VegetationScattering). This one
 * component is reused for grass, bushes, trees, and rocks — only the
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
}: VegetationFieldProps) {
  const windUniformsRef = useRef<WindSwayUniforms | null>(null);

  const instances = useMemo(
    () =>
      scatterVegetation({
        seed,
        count,
        areaWidth,
        areaDepth,
        heightFunction,
        ...(isExcluded ? { isExcluded } : {}),
        minScale,
        maxScale,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed, count, areaWidth, areaDepth, minScale, maxScale]
  );

  useFrame((state) => {
    if (windUniformsRef.current) {
      updateWindSwayTime(windUniformsRef.current, state.clock.elapsedTime);
    }
  });

  return (
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
  );
}

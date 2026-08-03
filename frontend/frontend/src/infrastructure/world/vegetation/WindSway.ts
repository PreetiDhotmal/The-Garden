import type { MeshStandardMaterial } from "three";

export interface WindSwayUniforms {
  readonly uTime: { value: number };
  readonly uWindStrength: { value: number };
  readonly uWindSpeed: { value: number };
}

export interface WindSwayOptions {
  readonly strength?: number;
  readonly speed?: number;
  /** Vertices below this local-space Y don't sway (keeps trunk bases/grass roots planted). */
  readonly anchorHeight?: number;
}

/**
 * Patches a MeshStandardMaterial to displace vertices horizontally by
 * a sine wave driven by per-instance position + time, increasing with
 * height above `anchorHeight` — the standard "wind sway" technique.
 * Requires the material to be used on an `InstancedMesh` (as produced
 * by drei's `<Instances>`) since it reads `instanceMatrix`, which
 * Three.js only defines when instancing is active — this is why grass,
 * trees, and flowers (all instanced) share this one implementation
 * rather than each writing their own sway shader.
 *
 * Call `updateWindSwayTime` each frame to animate it; this only
 * mutates a uniform value, it never re-triggers a shader recompile.
 */
export function applyWindSway(
  material: MeshStandardMaterial,
  options: WindSwayOptions = {}
): WindSwayUniforms {
  const strength = options.strength ?? 0.15;
  const speed = options.speed ?? 1.5;
  const anchorHeight = options.anchorHeight ?? 0;

  const uniforms: WindSwayUniforms = {
    uTime: { value: 0 },
    uWindStrength: { value: strength },
    uWindSpeed: { value: speed },
  };

  material.onBeforeCompile = (shader) => {
    shader.uniforms["uTime"] = uniforms.uTime;
    shader.uniforms["uWindStrength"] = uniforms.uWindStrength;
    shader.uniforms["uWindSpeed"] = uniforms.uWindSpeed;

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float uTime;
        uniform float uWindStrength;
        uniform float uWindSpeed;`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        float swayFactor = max(0.0, position.y - ${anchorHeight.toFixed(3)});
        float sway = sin(uTime * uWindSpeed + (instanceMatrix[3].x + instanceMatrix[3].z) * 0.5) * uWindStrength * swayFactor;
        transformed.x += sway;
        transformed.z += sway * 0.5;`
      );
  };
  material.needsUpdate = true;

  return uniforms;
}

export function updateWindSwayTime(uniforms: WindSwayUniforms, elapsedSeconds: number): void {
  uniforms.uTime.value = elapsedSeconds;
}

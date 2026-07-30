import { Color, MeshStandardMaterial } from "three";

export interface TerrainLayerColors {
  readonly grass: string;
  readonly dirt: string;
  readonly stone: string;
  readonly cliff: string;
}

export interface CreateLayeredTerrainMaterialOptions {
  readonly colors: TerrainLayerColors;
  readonly roughness?: number;
  /** World-space Y above which the stone/cliff layers begin blending in more heavily — e.g. rocky peaks vs. grassy lowlands. */
  readonly cliffHeightStart?: number;
  readonly cliffHeightEnd?: number;
}

/**
 * Blends four flat colors (grass, dirt, stone, cliff) purely from
 * per-vertex geometry data already present on every terrain mesh in
 * this project (position.y and the computed normal) — no new UVs, no
 * texture atlas, no change to TerrainGeometry at all. Slope comes
 * from the normal's Y component (flat ground has normal.y near 1;
 * steep cliffs approach 0); height comes directly from world-space Y.
 * Both are smoothstepped, not thresholded, so transitions are gradual
 * rather than sharp-edged banding.
 *
 * Chose onBeforeCompile over a bespoke ShaderMaterial specifically so
 * the terrain keeps receiving real PBR lighting, shadows, and
 * environment reflections for free — those already work correctly on
 * MeshStandardMaterial and reimplementing that lighting model from
 * scratch would be a large, error-prone undertaking with no visual
 * benefit over just extending the material Three.js already provides.
 */
export function createLayeredTerrainMaterial(
  options: CreateLayeredTerrainMaterialOptions
): MeshStandardMaterial {
  const { colors, roughness = 0.9, cliffHeightStart = 6, cliffHeightEnd = 14 } = options;

  const material = new MeshStandardMaterial({ roughness, metalness: 0 });

  material.onBeforeCompile = (shader) => {
    shader.uniforms["uGrassColor"] = { value: new Color(colors.grass) };
    shader.uniforms["uDirtColor"] = { value: new Color(colors.dirt) };
    shader.uniforms["uStoneColor"] = { value: new Color(colors.stone) };
    shader.uniforms["uCliffColor"] = { value: new Color(colors.cliff) };
    shader.uniforms["uCliffHeightStart"] = { value: cliffHeightStart };
    shader.uniforms["uCliffHeightEnd"] = { value: cliffHeightEnd };

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        varying float vSlope;
        varying float vWorldHeight;`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vSlope = 1.0 - clamp(normal.y, 0.0, 1.0);
        vWorldHeight = position.y;`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying float vSlope;
        varying float vWorldHeight;
        uniform vec3 uGrassColor;
        uniform vec3 uDirtColor;
        uniform vec3 uStoneColor;
        uniform vec3 uCliffColor;
        uniform float uCliffHeightStart;
        uniform float uCliffHeightEnd;`
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float grassToDirt = smoothstep(0.08, 0.35, vSlope);
        float dirtToStone = smoothstep(0.35, 0.6, vSlope);
        vec3 slopeBlended = mix(mix(uGrassColor, uDirtColor, grassToDirt), uStoneColor, dirtToStone);
        float heightBlend = smoothstep(uCliffHeightStart, uCliffHeightEnd, vWorldHeight);
        diffuseColor.rgb = mix(slopeBlended, uCliffColor, heightBlend * dirtToStone);`
      );
  };

  // Distinct cache key so Three.js doesn't reuse a compiled program
  // meant for a different color set — otherwise two TerrainMesh
  // instances with different color palettes could visually share
  // one another's shader by mistake.
  material.customProgramCacheKey = () =>
    `layered-terrain:${colors.grass}:${colors.dirt}:${colors.stone}:${colors.cliff}:${cliffHeightStart.toString()}:${cliffHeightEnd.toString()}`;

  return material;
}

import { DISCOVERED_ENVIRONMENT_PROPS } from "./environmentPropManifest.generated";

export interface EnvironmentPropDefinition {
  readonly assetId: string;
  readonly url: string;
  /**
   * Multiplies the model's raw scale to reach a sensible in-world
   * size. Computed automatically by scripts/generateEnvironmentAssetManifest.mjs
   * from each selected GLB's own measured bounding box - not
   * hardcoded here. Not visually verified in a live renderer -
   * computed from geometry data alone, stated honestly as an
   * estimate to refine after a real look.
   */
  readonly baseScale: number;
}

/**
 * One asset id per category, exactly matching the auto-discovered
 * manifest's category names. If a category folder wasn't found on
 * disk (or contained no .glb files) at generation time, that key is
 * simply absent here - callers must treat lookups as possibly
 * undefined, not assume every category always exists.
 */
export const ENVIRONMENT_PROP_IDS = {
  TREE: "models:environment:tree",
  ROCK: "models:environment:rock",
  BUSH: "models:environment:bush",
  GRASS: "models:environment:grass",
  FLOWER: "models:environment:flower",
} as const;

export const ENVIRONMENT_PROPS: readonly EnvironmentPropDefinition[] = DISCOVERED_ENVIRONMENT_PROPS.map(
  (prop) => ({
    assetId: prop.assetId,
    url: prop.url,
    baseScale: prop.baseScale,
  })
);

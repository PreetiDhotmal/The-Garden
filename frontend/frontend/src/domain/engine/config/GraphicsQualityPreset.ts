import type { GraphicsQuality } from "@/presentation/settings/settingsStore";

export interface GraphicsQualityPreset {
  readonly shadowMapSize: number;
  /** Fog "far" distance — how far the player can see before geometry fades into fog, i.e. draw distance. */
  readonly drawDistance: number;
  readonly antialias: boolean;
  readonly postProcessingEnabled: boolean;
  /** Multiplies every vegetation field's instance count (grass/flowers/trees/bushes/rocks). */
  readonly foliageDensityMultiplier: number;
  /** Multiplies ambient particle counts (pollen/dust). */
  readonly particleCountMultiplier: number;
}

export const GRAPHICS_QUALITY_PRESETS: Readonly<Record<GraphicsQuality, GraphicsQualityPreset>> = {
  low: {
    shadowMapSize: 512,
    drawDistance: 70,
    antialias: false,
    postProcessingEnabled: false,
    foliageDensityMultiplier: 0.25,
    particleCountMultiplier: 0.25,
  },
  medium: {
    shadowMapSize: 1024,
    drawDistance: 100,
    antialias: true,
    postProcessingEnabled: false,
    foliageDensityMultiplier: 0.5,
    particleCountMultiplier: 0.5,
  },
  high: {
    shadowMapSize: 2048,
    drawDistance: 140,
    antialias: true,
    postProcessingEnabled: true,
    foliageDensityMultiplier: 1,
    particleCountMultiplier: 1,
  },
  ultra: {
    shadowMapSize: 4096,
    drawDistance: 200,
    antialias: true,
    postProcessingEnabled: true,
    foliageDensityMultiplier: 1.5,
    particleCountMultiplier: 1.5,
  },
};

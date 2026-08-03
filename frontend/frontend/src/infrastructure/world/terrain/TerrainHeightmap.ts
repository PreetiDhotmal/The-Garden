import { createNoise2D, type NoiseFunction2D } from "simplex-noise";

export interface TerrainHeightmapConfig {
  readonly seed: string;
  readonly baseFrequency: number;
  readonly baseAmplitude: number;
  readonly octaves: number;
  readonly persistence: number;
  readonly lacunarity: number;
}

export const DEFAULT_TERRAIN_HEIGHTMAP_CONFIG: TerrainHeightmapConfig = {
  seed: "the-garden-of-beginnings",
  baseFrequency: 0.02,
  baseAmplitude: 2,
  octaves: 4,
  persistence: 0.5,
  lacunarity: 2,
};

/** Simple string -> 32-bit numeric seed. */
function hashSeedString(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

/**
 * A small seeded PRNG (mulberry32) producing a deterministic sequence
 * of [0, 1) values from a 32-bit seed — simplex-noise's `createNoise2D`
 * needs an actual varying random stream to build its permutation
 * table, not a single constant value.
 */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A deterministic multi-octave (fractal) noise heightmap function.
 * Same seed always produces the same terrain — important so the world
 * layout (Scripture Stone placement, path routing) can be authored
 * against a known, reproducible ground height.
 */
export function createTerrainHeightFunction(
  config: TerrainHeightmapConfig = DEFAULT_TERRAIN_HEIGHTMAP_CONFIG
): (x: number, z: number) => number {
  const noise2D: NoiseFunction2D = createNoise2D(mulberry32(hashSeedString(config.seed)));

  return (x: number, z: number): number => {
    let amplitude = config.baseAmplitude;
    let frequency = config.baseFrequency;
    let height = 0;

    for (let octave = 0; octave < config.octaves; octave += 1) {
      height += noise2D(x * frequency, z * frequency) * amplitude;
      amplitude *= config.persistence;
      frequency *= config.lacunarity;
    }

    return height;
  };
}

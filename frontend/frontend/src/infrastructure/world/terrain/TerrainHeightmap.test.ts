import { describe, expect, it } from "vitest";
import { createTerrainHeightFunction, DEFAULT_TERRAIN_HEIGHTMAP_CONFIG } from "./TerrainHeightmap";

describe("createTerrainHeightFunction", () => {
  it("is deterministic for the same seed", () => {
    const heightA = createTerrainHeightFunction({ ...DEFAULT_TERRAIN_HEIGHTMAP_CONFIG });
    const heightB = createTerrainHeightFunction({ ...DEFAULT_TERRAIN_HEIGHTMAP_CONFIG });

    expect(heightA(10, 20)).toBe(heightB(10, 20));
    expect(heightA(-5, 3.5)).toBe(heightB(-5, 3.5));
  });

  it("produces different terrain for different seeds", () => {
    const heightA = createTerrainHeightFunction({
      ...DEFAULT_TERRAIN_HEIGHTMAP_CONFIG,
      seed: "seed-a",
    });
    const heightB = createTerrainHeightFunction({
      ...DEFAULT_TERRAIN_HEIGHTMAP_CONFIG,
      seed: "seed-b",
    });

    expect(heightA(10, 20)).not.toBe(heightB(10, 20));
  });

  it("stays within a bounded range given the configured amplitude", () => {
    const heightFn = createTerrainHeightFunction(DEFAULT_TERRAIN_HEIGHTMAP_CONFIG);
    // Sum of amplitudes across octaves is an upper bound on |height|.
    let maxPossible = 0;
    let amplitude = DEFAULT_TERRAIN_HEIGHTMAP_CONFIG.baseAmplitude;
    for (let i = 0; i < DEFAULT_TERRAIN_HEIGHTMAP_CONFIG.octaves; i += 1) {
      maxPossible += amplitude;
      amplitude *= DEFAULT_TERRAIN_HEIGHTMAP_CONFIG.persistence;
    }

    for (let x = -50; x <= 50; x += 10) {
      for (let z = -50; z <= 50; z += 10) {
        expect(Math.abs(heightFn(x, z))).toBeLessThanOrEqual(maxPossible + 1e-9);
      }
    }
  });

  it("varies smoothly rather than jumping wildly between adjacent samples", () => {
    const heightFn = createTerrainHeightFunction(DEFAULT_TERRAIN_HEIGHTMAP_CONFIG);
    const a = heightFn(0, 0);
    const b = heightFn(0.5, 0);
    expect(Math.abs(a - b)).toBeLessThan(1);
  });
});

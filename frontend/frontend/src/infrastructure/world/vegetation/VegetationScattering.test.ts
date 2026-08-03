import { describe, expect, it } from "vitest";
import { scatterVegetation } from "./VegetationScattering";

const FLAT_HEIGHT = () => 0;

describe("scatterVegetation", () => {
  it("places the requested count when nothing is excluded", () => {
    const instances = scatterVegetation({
      seed: 1,
      count: 50,
      areaWidth: 100,
      areaDepth: 100,
      heightFunction: FLAT_HEIGHT,
    });
    expect(instances).toHaveLength(50);
  });

  it("is deterministic for the same seed", () => {
    const a = scatterVegetation({
      seed: 42,
      count: 10,
      areaWidth: 50,
      areaDepth: 50,
      heightFunction: FLAT_HEIGHT,
    });
    const b = scatterVegetation({
      seed: 42,
      count: 10,
      areaWidth: 50,
      areaDepth: 50,
      heightFunction: FLAT_HEIGHT,
    });
    expect(a).toEqual(b);
  });

  it("produces different layouts for different seeds", () => {
    const a = scatterVegetation({
      seed: 1,
      count: 10,
      areaWidth: 50,
      areaDepth: 50,
      heightFunction: FLAT_HEIGHT,
    });
    const b = scatterVegetation({
      seed: 2,
      count: 10,
      areaWidth: 50,
      areaDepth: 50,
      heightFunction: FLAT_HEIGHT,
    });
    expect(a).not.toEqual(b);
  });

  it("respects the exclusion predicate", () => {
    const instances = scatterVegetation({
      seed: 1,
      count: 20,
      areaWidth: 100,
      areaDepth: 100,
      heightFunction: FLAT_HEIGHT,
      isExcluded: (x) => x > 0, // exclude the entire right half
    });

    expect(instances.every((instance) => instance.x <= 0)).toBe(true);
  });

  it("samples height from the provided height function", () => {
    const instances = scatterVegetation({
      seed: 1,
      count: 5,
      areaWidth: 10,
      areaDepth: 10,
      heightFunction: (x, z) => x + z,
    });

    for (const instance of instances) {
      expect(instance.y).toBeCloseTo(instance.x + instance.z, 5);
    }
  });

  it("keeps scale within the configured range", () => {
    const instances = scatterVegetation({
      seed: 1,
      count: 30,
      areaWidth: 50,
      areaDepth: 50,
      heightFunction: FLAT_HEIGHT,
      minScale: 0.5,
      maxScale: 0.9,
    });

    for (const instance of instances) {
      expect(instance.scale).toBeGreaterThanOrEqual(0.5);
      expect(instance.scale).toBeLessThanOrEqual(0.9);
    }
  });

  it("may place fewer than count when exclusion is very dense", () => {
    const instances = scatterVegetation({
      seed: 1,
      count: 20,
      areaWidth: 100,
      areaDepth: 100,
      heightFunction: FLAT_HEIGHT,
      isExcluded: () => true,
      maxAttemptsPerInstance: 3,
    });

    expect(instances).toHaveLength(0);
  });
});

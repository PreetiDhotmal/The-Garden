import { describe, expect, it } from "vitest";
import { generateClusterCenters, generateClusteredPoints } from "./ClusteredScattering";

describe("generateClusterCenters", () => {
  it("is deterministic for the same seed", () => {
    const a = generateClusterCenters({ seed: 7, count: 5, areaWidth: 100, areaDepth: 100 });
    const b = generateClusterCenters({ seed: 7, count: 5, areaWidth: 100, areaDepth: 100 });
    expect(a).toEqual(b);
  });

  it("produces different layouts for different seeds", () => {
    const a = generateClusterCenters({ seed: 1, count: 5, areaWidth: 100, areaDepth: 100 });
    const b = generateClusterCenters({ seed: 2, count: 5, areaWidth: 100, areaDepth: 100 });
    expect(a).not.toEqual(b);
  });

  it("produces exactly `count` centers", () => {
    const centers = generateClusterCenters({ seed: 3, count: 8, areaWidth: 50, areaDepth: 50 });
    expect(centers).toHaveLength(8);
  });

  it("keeps every center's radius within the requested min/max range", () => {
    const centers = generateClusterCenters({
      seed: 4,
      count: 20,
      areaWidth: 100,
      areaDepth: 100,
      minRadius: 3,
      maxRadius: 6,
    });
    for (const center of centers) {
      expect(center.radius).toBeGreaterThanOrEqual(3);
      expect(center.radius).toBeLessThanOrEqual(6);
    }
  });
});

describe("generateClusteredPoints", () => {
  it("is deterministic for the same seed", () => {
    const centers = generateClusterCenters({ seed: 7, count: 3, areaWidth: 80, areaDepth: 80 });
    const a = generateClusteredPoints({ seed: 11, count: 50, areaWidth: 80, areaDepth: 80, centers });
    const b = generateClusteredPoints({ seed: 11, count: 50, areaWidth: 80, areaDepth: 80, centers });
    expect(a).toEqual(b);
  });

  it("never places a point where isExcluded returns true", () => {
    const centers = generateClusterCenters({ seed: 5, count: 3, areaWidth: 60, areaDepth: 60 });
    const points = generateClusteredPoints({
      seed: 22,
      count: 100,
      areaWidth: 60,
      areaDepth: 60,
      centers,
      isExcluded: (x) => x > 0, // exclude the entire right half
    });
    expect(points.every((point) => point.x <= 0)).toBe(true);
  });

  it("keeps every point within the area bounds", () => {
    const centers = generateClusterCenters({ seed: 9, count: 4, areaWidth: 40, areaDepth: 40 });
    const points = generateClusteredPoints({
      seed: 33,
      count: 80,
      areaWidth: 40,
      areaDepth: 40,
      centers,
    });
    for (const point of points) {
      expect(Math.abs(point.x)).toBeLessThanOrEqual(20);
      expect(Math.abs(point.z)).toBeLessThanOrEqual(20);
    }
  });

  it("clusters points near cluster centers rather than spreading them uniformly", () => {
    // A single, small-radius, high-weight cluster far from the area
    // center — if clustering genuinely works, points should land near
    // it, not spread evenly across the whole area.
    const centers = [{ x: 30, z: 30, weight: 1, radius: 3 }];
    const points = generateClusteredPoints({
      seed: 44,
      count: 200,
      areaWidth: 100,
      areaDepth: 100,
      centers,
      scatterFraction: 0,
    });
    const averageDistance =
      points.reduce((sum, point) => sum + Math.hypot(point.x - 30, point.z - 30), 0) /
      points.length;
    // Well within the cluster's radius on average — a uniform
    // distribution across the full 100x100 area would average roughly
    // 30-40 units from this off-center point, not a handful.
    expect(averageDistance).toBeLessThan(5);
  });

  it("with scatterFraction=1, ignores clusters entirely and spreads uniformly", () => {
    const centers = [{ x: 30, z: 30, weight: 1, radius: 2 }];
    const points = generateClusteredPoints({
      seed: 55,
      count: 200,
      areaWidth: 100,
      areaDepth: 100,
      centers,
      scatterFraction: 1,
    });
    const averageDistance =
      points.reduce((sum, point) => sum + Math.hypot(point.x - 30, point.z - 30), 0) /
      points.length;
    expect(averageDistance).toBeGreaterThan(20);
  });
});

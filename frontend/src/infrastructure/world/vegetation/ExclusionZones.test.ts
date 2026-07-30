import { describe, expect, it } from "vitest";
import { combineExclusions, createExclusionZones } from "./ExclusionZones";

describe("createExclusionZones", () => {
  it("excludes a point inside a zone's radius", () => {
    const exclusion = createExclusionZones([{ x: 10, z: 10, radius: 3 }]);
    expect(exclusion(11, 11)).toBe(true);
  });

  it("does not exclude a point outside every zone's radius", () => {
    const exclusion = createExclusionZones([{ x: 10, z: 10, radius: 3 }]);
    expect(exclusion(50, 50)).toBe(false);
  });

  it("excludes a point exactly on a zone's boundary (inclusive)", () => {
    const exclusion = createExclusionZones([{ x: 0, z: 0, radius: 5 }]);
    expect(exclusion(5, 0)).toBe(true);
  });

  it("checks every zone, not just the first", () => {
    const exclusion = createExclusionZones([
      { x: 0, z: 0, radius: 2 },
      { x: 100, z: 100, radius: 2 },
    ]);
    expect(exclusion(100, 100)).toBe(true);
  });

  it("with an empty zone list, never excludes anything", () => {
    const exclusion = createExclusionZones([]);
    expect(exclusion(0, 0)).toBe(false);
    expect(exclusion(1000, -1000)).toBe(false);
  });
});

describe("combineExclusions", () => {
  it("excludes a point if any one predicate excludes it", () => {
    const alwaysFalse = () => false;
    const excludesPositiveX = (x: number) => x > 0;
    const combined = combineExclusions(alwaysFalse, excludesPositiveX);
    expect(combined(5, 0)).toBe(true);
  });

  it("does not exclude a point that every predicate allows", () => {
    const alwaysFalse = () => false;
    const combined = combineExclusions(alwaysFalse, alwaysFalse);
    expect(combined(0, 0)).toBe(false);
  });

  it("with zero predicates, never excludes anything", () => {
    const combined = combineExclusions();
    expect(combined(0, 0)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  boundingBoxCenter,
  boundingBoxContains,
  createBoundingBox,
  distanceToBoundingBox,
} from "./BoundingBox";

describe("createBoundingBox", () => {
  it("builds min/max from center and half-extents", () => {
    const box = createBoundingBox({ x: 0, y: 0, z: 0 }, { x: 5, y: 2, z: 5 });
    expect(box.min).toEqual({ x: -5, y: -2, z: -5 });
    expect(box.max).toEqual({ x: 5, y: 2, z: 5 });
  });
});

describe("boundingBoxContains", () => {
  const box = createBoundingBox({ x: 0, y: 0, z: 0 }, { x: 5, y: 5, z: 5 });

  it("returns true for a point inside", () => {
    expect(boundingBoxContains(box, { x: 1, y: 1, z: 1 })).toBe(true);
  });

  it("returns true for a point exactly on the boundary", () => {
    expect(boundingBoxContains(box, { x: 5, y: 0, z: 0 })).toBe(true);
  });

  it("returns false for a point outside", () => {
    expect(boundingBoxContains(box, { x: 10, y: 0, z: 0 })).toBe(false);
  });
});

describe("boundingBoxCenter", () => {
  it("computes the midpoint", () => {
    const box = createBoundingBox({ x: 3, y: 4, z: 5 }, { x: 1, y: 1, z: 1 });
    expect(boundingBoxCenter(box)).toEqual({ x: 3, y: 4, z: 5 });
  });
});

describe("distanceToBoundingBox", () => {
  const box = createBoundingBox({ x: 0, y: 0, z: 0 }, { x: 5, y: 5, z: 5 });

  it("returns zero for a point inside", () => {
    expect(distanceToBoundingBox(box, { x: 1, y: 1, z: 1 })).toBe(0);
  });

  it("returns the correct distance for a point outside", () => {
    expect(distanceToBoundingBox(box, { x: 10, y: 0, z: 0 })).toBeCloseTo(5, 5);
  });

  it("computes diagonal distance correctly", () => {
    expect(distanceToBoundingBox(box, { x: 8, y: 9, z: 0 })).toBeCloseTo(5, 5);
  });
});

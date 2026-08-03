import { describe, expect, it } from "vitest";
import { computeFlightPosition, type FlightPathParams } from "./FlightPath";

const BASE_PARAMS: FlightPathParams = {
  centerX: 0,
  centerY: 5,
  centerZ: 0,
  radius: 3,
  speed: 1,
  bobHeight: 0.5,
  bobSpeed: 2,
  phaseOffset: 0,
};

describe("computeFlightPosition", () => {
  it("stays at the configured radius from the center on the XZ plane", () => {
    const position = computeFlightPosition(BASE_PARAMS, 1.234);
    const distance = Math.hypot(position.x - BASE_PARAMS.centerX, position.z - BASE_PARAMS.centerZ);
    expect(distance).toBeCloseTo(BASE_PARAMS.radius, 5);
  });

  it("oscillates vertically around centerY within bobHeight", () => {
    const samples = Array.from({ length: 20 }, (_, i) => computeFlightPosition(BASE_PARAMS, i * 0.3).y);
    for (const y of samples) {
      expect(y).toBeGreaterThanOrEqual(BASE_PARAMS.centerY - BASE_PARAMS.bobHeight - 1e-9);
      expect(y).toBeLessThanOrEqual(BASE_PARAMS.centerY + BASE_PARAMS.bobHeight + 1e-9);
    }
  });

  it("is deterministic for the same time", () => {
    const a = computeFlightPosition(BASE_PARAMS, 5);
    const b = computeFlightPosition(BASE_PARAMS, 5);
    expect(a).toEqual(b);
  });

  it("phase offset shifts the position at a given time", () => {
    const withoutOffset = computeFlightPosition(BASE_PARAMS, 0);
    const withOffset = computeFlightPosition({ ...BASE_PARAMS, phaseOffset: Math.PI }, 0);
    expect(withoutOffset.x).not.toBeCloseTo(withOffset.x, 2);
  });
});

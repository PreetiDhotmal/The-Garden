import { describe, expect, it } from "vitest";
import { createSlopeExclusion, sampleSlope } from "./SlopeSampling";

describe("sampleSlope", () => {
  it("reports near-zero slope on perfectly flat terrain", () => {
    const flat = () => 5; // constant height everywhere
    expect(sampleSlope(flat, 0, 0)).toBeCloseTo(0, 5);
    expect(sampleSlope(flat, 10, -10)).toBeCloseTo(0, 5);
  });

  it("reports higher slope on a steep ramp than a gentle one", () => {
    const gentleRamp = (x: number) => x * 0.1;
    const steepRamp = (x: number) => x * 3;
    const gentleSlope = sampleSlope(gentleRamp, 0, 0);
    const steepSlope = sampleSlope(steepRamp, 0, 0);
    expect(steepSlope).toBeGreaterThan(gentleSlope);
  });

  it("approaches 1 for a near-vertical surface", () => {
    const nearVertical = (x: number) => x * 1000;
    expect(sampleSlope(nearVertical, 0, 0)).toBeGreaterThan(0.99);
  });

  it("is symmetric — slope doesn't depend on which direction the ramp rises", () => {
    const risingRight = (x: number) => x * 2;
    const risingLeft = (x: number) => -x * 2;
    expect(sampleSlope(risingRight, 0, 0)).toBeCloseTo(sampleSlope(risingLeft, 0, 0), 5);
  });
});

describe("createSlopeExclusion", () => {
  it("excludes flat terrain when minSlope is set above zero", () => {
    const flat = () => 5;
    const exclusion = createSlopeExclusion({ heightFunction: flat, minSlope: 0.2 });
    expect(exclusion(0, 0)).toBe(true);
  });

  it("does not exclude terrain within the requested slope range", () => {
    const gentleRamp = (x: number) => x * 0.1;
    const exclusion = createSlopeExclusion({
      heightFunction: gentleRamp,
      minSlope: 0,
      maxSlope: 1,
    });
    expect(exclusion(0, 0)).toBe(false);
  });

  it("excludes terrain steeper than maxSlope", () => {
    const steepRamp = (x: number) => x * 10;
    const exclusion = createSlopeExclusion({ heightFunction: steepRamp, maxSlope: 0.3 });
    expect(exclusion(0, 0)).toBe(true);
  });
});

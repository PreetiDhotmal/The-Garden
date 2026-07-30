import { describe, expect, it } from "vitest";
import { computeFootPositionY } from "./FootPosition";

describe("computeFootPositionY", () => {
  it("subtracts half the capsule height from the body origin", () => {
    expect(computeFootPositionY(10, 1.8)).toBeCloseTo(10 - 0.9, 10);
  });

  it("with the default capsule height (1.8), a body resting with its feet at y=0 has its origin at y=0.9", () => {
    // The inverse relationship: if the character is standing with
    // feet exactly on the ground (y=0), the rigid body's origin
    // (capsule center) must be at capsuleHeight/2 above that.
    const bodyOriginY = 0.9;
    expect(computeFootPositionY(bodyOriginY, 1.8)).toBeCloseTo(0, 10);
  });

  it("does NOT equal bodyOriginY minus a small tuning value like groundCheckDistance — the exact bug this replaced", () => {
    const bodyOriginY = 10;
    const capsuleHeight = 1.8;
    const groundCheckDistance = 0.15;
    const buggyResult = bodyOriginY - groundCheckDistance;
    const correctResult = computeFootPositionY(bodyOriginY, capsuleHeight);
    expect(correctResult).not.toBeCloseTo(buggyResult, 1);
  });

  it("scales correctly with different capsule heights", () => {
    expect(computeFootPositionY(5, 2.0)).toBeCloseTo(4, 10);
    expect(computeFootPositionY(5, 1.0)).toBeCloseTo(4.5, 10);
  });
});

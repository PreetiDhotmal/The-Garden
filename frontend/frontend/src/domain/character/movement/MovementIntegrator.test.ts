import { describe, expect, it } from "vitest";
import { createMovementTuning } from "./MovementTuning";
import { integrateHorizontalVelocity, integrateVerticalVelocity } from "./MovementIntegrator";

describe("integrateHorizontalVelocity", () => {
  const tuning = createMovementTuning({ acceleration: 10, deceleration: 20 });

  it("accelerates toward the target velocity, capped by the acceleration rate", () => {
    const result = integrateHorizontalVelocity(
      { x: 0, z: 0 },
      { x: 0, z: 1 },
      5,
      tuning,
      0.1 // 0.1s * 10 accel = max delta 1
    );
    expect(result.z).toBeCloseTo(1, 5);
    expect(result.x).toBeCloseTo(0, 5);
  });

  it("reaches the target velocity exactly without overshooting", () => {
    const result = integrateHorizontalVelocity({ x: 0, z: 0 }, { x: 0, z: 1 }, 0.5, tuning, 1);
    expect(result.z).toBeCloseTo(0.5, 5);
  });

  it("decelerates toward zero when there is no input direction", () => {
    const result = integrateHorizontalVelocity(
      { x: 0, z: 5 },
      { x: 0, z: 0 },
      5,
      tuning,
      0.1 // 0.1s * 20 decel = max delta 2
    );
    expect(result.z).toBeCloseTo(3, 5);
  });

  it("uses the deceleration rate (not acceleration) when slowing down", () => {
    const fastAccelSlowDecel = createMovementTuning({ acceleration: 100, deceleration: 1 });
    const result = integrateHorizontalVelocity(
      { x: 0, z: 5 },
      { x: 0, z: 0 },
      5,
      fastAccelSlowDecel,
      0.1
    );
    // deceleration=1 * 0.1s = max delta 0.1, so it should barely have slowed.
    expect(result.z).toBeCloseTo(4.9, 5);
  });
});

describe("integrateVerticalVelocity", () => {
  const tuning = createMovementTuning({ gravity: -10, jumpForce: 6 });

  it("applies a jump impulse when grounded and jump is requested", () => {
    const result = integrateVerticalVelocity(0, true, true, tuning, 0.016);
    expect(result.velocityY).toBe(6);
    expect(result.didJump).toBe(true);
  });

  it("stays at zero velocity while grounded and not jumping", () => {
    const result = integrateVerticalVelocity(0, true, false, tuning, 0.016);
    expect(result.velocityY).toBe(0);
    expect(result.didJump).toBe(false);
  });

  it("applies gravity while airborne", () => {
    const result = integrateVerticalVelocity(0, false, false, tuning, 0.1);
    expect(result.velocityY).toBeCloseTo(-1, 5);
  });

  it("does not jump if not grounded, even if jump is requested", () => {
    const result = integrateVerticalVelocity(-2, false, true, tuning, 0.1);
    expect(result.didJump).toBe(false);
    expect(result.velocityY).toBeCloseTo(-3, 5);
  });
});

import type { MovementTuning } from "./MovementTuning";

export interface HorizontalVelocity {
  readonly x: number;
  readonly z: number;
}

const ZERO_HORIZONTAL: HorizontalVelocity = { x: 0, z: 0 };

/**
 * Moves `current` velocity toward `desiredDirection * targetSpeed`,
 * using `tuning.acceleration` when speeding up and
 * `tuning.deceleration` when slowing down — the standard "smoothed"
 * character controller feel, as opposed to instantaneous velocity
 * snapping.
 *
 * @param desiredDirection A normalized (or zero) direction vector,
 *   already camera-relative — this function does no camera math.
 */
export function integrateHorizontalVelocity(
  current: HorizontalVelocity,
  desiredDirection: HorizontalVelocity,
  targetSpeed: number,
  tuning: MovementTuning,
  deltaSeconds: number
): HorizontalVelocity {
  const target: HorizontalVelocity = {
    x: desiredDirection.x * targetSpeed,
    z: desiredDirection.z * targetSpeed,
  };

  const isAccelerating = Math.hypot(target.x, target.z) > Math.hypot(current.x, current.z);
  const rate = isAccelerating ? tuning.acceleration : tuning.deceleration;
  const maxDelta = rate * deltaSeconds;

  return {
    x: moveToward(current.x, target.x, maxDelta),
    z: moveToward(current.z, target.z, maxDelta),
  };
}

function moveToward(current: number, target: number, maxDelta: number): number {
  const difference = target - current;
  if (Math.abs(difference) <= maxDelta) {
    return target;
  }
  return current + Math.sign(difference) * maxDelta;
}

export interface VerticalIntegrationResult {
  readonly velocityY: number;
  readonly didJump: boolean;
}

/**
 * Integrates vertical velocity for one frame: applies gravity, and
 * applies a jump impulse if `jumpRequested` and `isGrounded`. Landing
 * (zeroing velocityY, clearing fall state) is the caller's
 * responsibility once the physics engine reports a ground collision —
 * this function only ever adds velocity, it never reads collision
 * state beyond the `isGrounded` flag passed in.
 */
export function integrateVerticalVelocity(
  currentVelocityY: number,
  isGrounded: boolean,
  jumpRequested: boolean,
  tuning: MovementTuning,
  deltaSeconds: number
): VerticalIntegrationResult {
  if (isGrounded && jumpRequested) {
    return { velocityY: tuning.jumpForce, didJump: true };
  }
  if (isGrounded && currentVelocityY <= 0) {
    return { velocityY: 0, didJump: false };
  }
  return { velocityY: currentVelocityY + tuning.gravity * deltaSeconds, didJump: false };
}

export function zeroHorizontalVelocity(): HorizontalVelocity {
  return ZERO_HORIZONTAL;
}

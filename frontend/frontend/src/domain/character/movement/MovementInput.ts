/**
 * The abstract, per-frame movement input a character controller
 * consumes — produced by InputSystem (infrastructure) from whichever
 * concrete device(s) are active. Nothing downstream of this type knows
 * or cares whether it came from a keyboard, gamepad, or touch stick.
 */
export interface MovementInput {
  /** -1 (left) to 1 (right), camera-relative. */
  readonly moveX: number;
  /** -1 (backward) to 1 (forward), camera-relative. */
  readonly moveZ: number;
  readonly sprintHeld: boolean;
  readonly jumpPressed: boolean;
}

export const ZERO_MOVEMENT_INPUT: MovementInput = {
  moveX: 0,
  moveZ: 0,
  sprintHeld: false,
  jumpPressed: false,
};

export function hasMovementIntent(input: MovementInput): boolean {
  return input.moveX !== 0 || input.moveZ !== 0;
}

/** Magnitude of the move vector, clamped to 1 (prevents diagonal movement from exceeding normal speed). */
export function movementMagnitude(input: MovementInput): number {
  return Math.min(1, Math.hypot(input.moveX, input.moveZ));
}

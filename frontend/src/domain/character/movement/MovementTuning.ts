export interface MovementTuning {
  readonly walkSpeed: number;
  readonly runSpeed: number;
  readonly sprintSpeed: number;
  readonly acceleration: number;
  readonly deceleration: number;
  readonly rotationSpeedRadiansPerSecond: number;
  readonly jumpForce: number;
  readonly gravity: number;
  readonly groundCheckDistance: number;
  readonly slopeLimitDegrees: number;
  readonly stepOffset: number;
  /** Below this speed the character is considered IDLE rather than WALKING. */
  readonly idleSpeedThreshold: number;
  /** Above this speed WALKING becomes RUNNING (independent of sprint input). */
  readonly runSpeedThreshold: number;
}

export const DEFAULT_MOVEMENT_TUNING: MovementTuning = {
  walkSpeed: 2.2,
  runSpeed: 4.5,
  sprintSpeed: 7,
  acceleration: 20,
  deceleration: 25,
  rotationSpeedRadiansPerSecond: 12,
  jumpForce: 6,
  gravity: -18,
  groundCheckDistance: 0.15,
  slopeLimitDegrees: 50,
  stepOffset: 0.3,
  idleSpeedThreshold: 0.1,
  runSpeedThreshold: 3.5,
};

export class InvalidMovementTuningError extends Error {
  constructor(reason: string) {
    super(`Invalid movement tuning: ${reason}`);
    this.name = "InvalidMovementTuningError";
  }
}

export function createMovementTuning(overrides: Partial<MovementTuning> = {}): MovementTuning {
  const tuning: MovementTuning = { ...DEFAULT_MOVEMENT_TUNING, ...overrides };

  if (tuning.walkSpeed <= 0) {
    throw new InvalidMovementTuningError("walkSpeed must be greater than zero");
  }
  if (tuning.runSpeed < tuning.walkSpeed) {
    throw new InvalidMovementTuningError("runSpeed must be greater than or equal to walkSpeed");
  }
  if (tuning.sprintSpeed < tuning.runSpeed) {
    throw new InvalidMovementTuningError("sprintSpeed must be greater than or equal to runSpeed");
  }
  if (tuning.acceleration <= 0 || tuning.deceleration <= 0) {
    throw new InvalidMovementTuningError("acceleration and deceleration must be greater than zero");
  }
  if (tuning.jumpForce <= 0) {
    throw new InvalidMovementTuningError("jumpForce must be greater than zero");
  }
  if (tuning.gravity >= 0) {
    throw new InvalidMovementTuningError("gravity must be negative");
  }
  if (tuning.slopeLimitDegrees <= 0 || tuning.slopeLimitDegrees >= 90) {
    throw new InvalidMovementTuningError("slopeLimitDegrees must be between 0 and 90 (exclusive)");
  }
  if (tuning.runSpeedThreshold <= tuning.idleSpeedThreshold) {
    throw new InvalidMovementTuningError("runSpeedThreshold must be greater than idleSpeedThreshold");
  }

  return tuning;
}

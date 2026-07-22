export interface ThirdPersonCameraConfig {
  readonly minDistance: number;
  readonly maxDistance: number;
  readonly minPitchRadians: number;
  readonly maxPitchRadians: number;
  readonly rotationSmoothing: number;
  readonly zoomSmoothing: number;
  /** Camera-space offset from the target's pivot (over-the-shoulder framing), in meters. */
  readonly shoulderOffsetX: number;
  readonly shoulderOffsetY: number;
}

export const DEFAULT_THIRD_PERSON_CAMERA_CONFIG: ThirdPersonCameraConfig = {
  minDistance: 2.5,
  maxDistance: 8,
  minPitchRadians: -Math.PI / 6,
  maxPitchRadians: Math.PI / 3,
  rotationSmoothing: 12,
  zoomSmoothing: 8,
  shoulderOffsetX: 0.5,
  shoulderOffsetY: 1.6,
};

export class InvalidCameraConfigError extends Error {
  constructor(reason: string) {
    super(`Invalid third-person camera config: ${reason}`);
    this.name = "InvalidCameraConfigError";
  }
}

export function createThirdPersonCameraConfig(
  overrides: Partial<ThirdPersonCameraConfig> = {}
): ThirdPersonCameraConfig {
  const config: ThirdPersonCameraConfig = { ...DEFAULT_THIRD_PERSON_CAMERA_CONFIG, ...overrides };

  if (config.minDistance <= 0) {
    throw new InvalidCameraConfigError("minDistance must be greater than zero");
  }
  if (config.maxDistance <= config.minDistance) {
    throw new InvalidCameraConfigError("maxDistance must be greater than minDistance");
  }
  if (config.minPitchRadians >= config.maxPitchRadians) {
    throw new InvalidCameraConfigError("minPitchRadians must be less than maxPitchRadians");
  }
  return config;
}

export interface OrbitSnapshot {
  readonly yaw: number;
  readonly pitch: number;
  readonly distance: number;
}

const TWO_PI = Math.PI * 2;

function wrapAngle(radians: number): number {
  const wrapped = radians % TWO_PI;
  return wrapped < 0 ? wrapped + TWO_PI : wrapped;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Exponential frame-rate-independent smoothing toward `target`, at `speed` (higher = snappier). */
function approach(current: number, target: number, speed: number, deltaSeconds: number): number {
  const t = 1 - Math.exp(-speed * deltaSeconds);
  return current + (target - current) * t;
}

/**
 * Tracks the camera's desired orbit (yaw/pitch/distance) and its
 * currently-smoothed values separately, so look/zoom input can be
 * applied instantly to the *target* while the actual camera eases
 * toward it each tick — this is what gives third-person cameras their
 * characteristic smooth-follow feel rather than snapping.
 */
export class CameraOrbitState {
  private targetYaw = 0;
  private targetPitch = 0;
  private targetDistance: number;

  private currentYaw = 0;
  private currentPitch = 0;
  private currentDistance: number;

  constructor(private readonly config: ThirdPersonCameraConfig) {
    this.targetDistance = config.maxDistance;
    this.currentDistance = config.maxDistance;
  }

  /** Applies raw look input (radians) to the target orbit, clamping pitch. */
  applyLookDelta(deltaYaw: number, deltaPitch: number): void {
    this.targetYaw = wrapAngle(this.targetYaw + deltaYaw);
    this.targetPitch = clamp(
      this.targetPitch + deltaPitch,
      this.config.minPitchRadians,
      this.config.maxPitchRadians
    );
  }

  applyZoomDelta(delta: number): void {
    this.targetDistance = clamp(this.targetDistance + delta, this.config.minDistance, this.config.maxDistance);
  }

  /**
   * Advances the smoothed orbit toward its target. `obstructionDistance`
   * (from a physics raycast behind the target, done in infrastructure)
   * further clamps the *smoothed* distance so the camera never clips
   * through geometry — collision avoidance always wins over the
   * player's desired zoom.
   */
  tick(deltaSeconds: number, obstructionDistance: number | null): OrbitSnapshot {
    this.currentYaw = approach(this.currentYaw, this.targetYaw, this.config.rotationSmoothing, deltaSeconds);
    this.currentPitch = approach(
      this.currentPitch,
      this.targetPitch,
      this.config.rotationSmoothing,
      deltaSeconds
    );
    this.currentDistance = approach(
      this.currentDistance,
      this.targetDistance,
      this.config.zoomSmoothing,
      deltaSeconds
    );

    const effectiveDistance =
      obstructionDistance !== null
        ? Math.min(this.currentDistance, obstructionDistance)
        : this.currentDistance;

    return { yaw: this.currentYaw, pitch: this.currentPitch, distance: effectiveDistance };
  }

  getConfig(): ThirdPersonCameraConfig {
    return this.config;
  }
}

export interface FootstepCadence {
  readonly walkStrideMeters: number;
  readonly runStrideMeters: number;
}

export const DEFAULT_FOOTSTEP_CADENCE: FootstepCadence = {
  walkStrideMeters: 1.1,
  runStrideMeters: 1.6,
};

/**
 * Distance-based, not time-based — a footstep triggers every
 * `strideMeters` of horizontal ground distance covered, so cadence
 * naturally scales with actual movement speed without needing to
 * know it explicitly. Silent while airborne or standing still.
 */
export class FootstepDetector {
  private distanceSinceLastStep = 0;

  constructor(private readonly cadence: FootstepCadence = DEFAULT_FOOTSTEP_CADENCE) {}

  /**
   * Call once per frame with horizontal distance moved this frame,
   * whether the character is grounded, and whether it's sprinting
   * (walk vs run stride). Returns true on the frame a footstep should
   * fire.
   */
  update(horizontalDistanceThisFrame: number, isGrounded: boolean, isRunning: boolean): boolean {
    if (!isGrounded || horizontalDistanceThisFrame <= 0) {
      this.distanceSinceLastStep = 0;
      return false;
    }

    this.distanceSinceLastStep += horizontalDistanceThisFrame;
    const stride = isRunning ? this.cadence.runStrideMeters : this.cadence.walkStrideMeters;

    if (this.distanceSinceLastStep >= stride) {
      this.distanceSinceLastStep -= stride;
      return true;
    }
    return false;
  }

  reset(): void {
    this.distanceSinceLastStep = 0;
  }
}

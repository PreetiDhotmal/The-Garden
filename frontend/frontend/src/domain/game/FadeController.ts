export type FadeDirection = "IN" | "OUT";

export interface FadeState {
  readonly progress: number;
  readonly isComplete: boolean;
}

/**
 * Pure time-driven progress controller — no rendering, no audio, no
 * React. A screen fade, an audio-volume fade, and a camera-blend's
 * easing are all the same underlying "0..1 over a duration" shape;
 * this is the one implementation of that shape, reused rather than
 * reimplemented per use site.
 */
export class FadeController {
  private elapsedSeconds = 0;

  constructor(
    private readonly durationSeconds: number,
    private direction: FadeDirection
  ) {
    if (durationSeconds <= 0) {
      throw new RangeError("FadeController durationSeconds must be greater than zero.");
    }
  }

  update(deltaSeconds: number): FadeState {
    this.elapsedSeconds = Math.min(this.durationSeconds, this.elapsedSeconds + deltaSeconds);
    return this.getState();
  }

  getState(): FadeState {
    const rawProgress = this.elapsedSeconds / this.durationSeconds;
    const progress = this.direction === "IN" ? rawProgress : 1 - rawProgress;
    return { progress, isComplete: this.elapsedSeconds >= this.durationSeconds };
  }

  reverse(): void {
    // Preserve visual continuity: reversing direction from partway through should not jump.
    this.elapsedSeconds = this.durationSeconds - this.elapsedSeconds;
    this.direction = this.direction === "IN" ? "OUT" : "IN";
  }

  reset(direction: FadeDirection): void {
    this.elapsedSeconds = 0;
    this.direction = direction;
  }
}

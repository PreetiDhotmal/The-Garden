export interface TimeSnapshot {
  readonly deltaSeconds: number;
  readonly elapsedSeconds: number;
  readonly isPaused: boolean;
  readonly timeScale: number;
}

/**
 * Tracks frame delta and elapsed time. This class does not read the
 * clock itself and is not tied to `requestAnimationFrame` or R3F's
 * `useFrame` — the caller (a presentation-layer hook, in this engine)
 * passes in the raw delta each tick. That keeps this class pure and
 * trivially testable, and reusable for non-realtime contexts (e.g.
 * deterministic replay/tests) if ever needed.
 */
export class TimeSystem {
  private deltaSeconds = 0;
  private elapsedSeconds = 0;
  private paused = false;
  private timeScale = 1;

  /**
   * Advances the clock by `rawDeltaSeconds` (the real, wall-clock time
   * since the last tick). Returns a snapshot of the resulting state.
   * When paused, elapsed time does not advance and the reported delta
   * is 0, regardless of the raw input — callers can rely on
   * `snapshot().deltaSeconds === 0` to skip simulation work.
   */
  tick(rawDeltaSeconds: number): TimeSnapshot {
    if (rawDeltaSeconds < 0) {
      throw new RangeError("rawDeltaSeconds must not be negative.");
    }

    if (this.paused) {
      this.deltaSeconds = 0;
      return this.snapshot();
    }

    this.deltaSeconds = rawDeltaSeconds * this.timeScale;
    this.elapsedSeconds += this.deltaSeconds;
    return this.snapshot();
  }

  pause(): void {
    this.paused = true;
    this.deltaSeconds = 0;
  }

  resume(): void {
    this.paused = false;
  }

  setTimeScale(scale: number): void {
    if (scale < 0) {
      throw new RangeError("timeScale must not be negative.");
    }
    this.timeScale = scale;
  }

  reset(): void {
    this.deltaSeconds = 0;
    this.elapsedSeconds = 0;
    this.paused = false;
    this.timeScale = 1;
  }

  snapshot(): TimeSnapshot {
    return {
      deltaSeconds: this.deltaSeconds,
      elapsedSeconds: this.elapsedSeconds,
      isPaused: this.paused,
      timeScale: this.timeScale,
    };
  }
}

export type TransitionPhase = "idle" | "fading-out" | "fading-in";

export interface TransitionSnapshot {
  readonly phase: TransitionPhase;
  /** 0 = fully visible scene, 1 = fully obscured (e.g. by a black overlay). */
  readonly opacity: number;
}

/**
 * A pure fade-out/fade-in timing state machine for scene transitions.
 * It does not touch the DOM or Three.js — a presentation-layer
 * component reads `snapshot().opacity` each frame to drive an overlay,
 * and calls `tick(deltaSeconds)` from the render loop.
 */
export class SceneTransitionController {
  private phase: TransitionPhase = "idle";
  private opacity = 0;
  private elapsedInPhase = 0;
  private onMidpoint: (() => void) | null = null;

  constructor(private readonly fadeDurationSeconds = 0.6) {
    if (fadeDurationSeconds <= 0) {
      throw new RangeError("fadeDurationSeconds must be greater than zero.");
    }
  }

  /** Begins a fade-out; `onMidpoint` fires once the screen is fully obscured (the moment to swap scenes). */
  start(onMidpoint: () => void): void {
    this.phase = "fading-out";
    this.elapsedInPhase = 0;
    this.onMidpoint = onMidpoint;
  }

  isTransitioning(): boolean {
    return this.phase !== "idle";
  }

  tick(deltaSeconds: number): TransitionSnapshot {
    if (this.phase === "idle") {
      return this.snapshot();
    }

    this.elapsedInPhase += deltaSeconds;
    const progress = Math.min(this.elapsedInPhase / this.fadeDurationSeconds, 1);

    if (this.phase === "fading-out") {
      this.opacity = progress;
      if (progress >= 1) {
        this.onMidpoint?.();
        this.onMidpoint = null;
        this.phase = "fading-in";
        this.elapsedInPhase = 0;
      }
    } else {
      this.opacity = 1 - progress;
      if (progress >= 1) {
        this.phase = "idle";
        this.opacity = 0;
      }
    }

    return this.snapshot();
  }

  snapshot(): TransitionSnapshot {
    return { phase: this.phase, opacity: this.opacity };
  }
}

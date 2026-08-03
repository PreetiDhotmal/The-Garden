import type { GameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import { FadeController } from "./FadeController";

export type TransitionPhase = "IDLE" | "FADING_OUT" | "LOADING" | "FADING_IN";

const DEFAULT_FADE_DURATION_SECONDS = 0.6;

/**
 * The standard "no abrupt changes" sequence: fade to black, do the
 * actual work (scene streaming via WorldLoader, asset preloading via
 * useAssetPreloader — both already built, this class never touches
 * them directly, it only tracks the phase around whatever the caller
 * is doing), fade back in. Deliberately does not guess a loading
 * duration — LOADING holds indefinitely until the caller calls
 * markLoadingComplete() once the real async work resolves, which is
 * the only honest way to represent "we don't know how long streaming
 * will take" rather than picking an arbitrary fixed number and
 * hoping it's long enough.
 *
 * getScreenOpacity() always returns 0 (fully visible) to 1 (fully
 * black) regardless of phase — internally, FADING_OUT uses a
 * FadeController counting progress up (0->1, i.e. toward black) and
 * FADING_IN uses one counting down (1->0, i.e. back toward visible);
 * both are just FadeController's generic progress value reused as
 * this specific opacity meaning, not two different concepts.
 */
export class TransitionManager {
  private phase: TransitionPhase = "IDLE";
  private fadeController: FadeController | null = null;

  constructor(
    private readonly eventBus: GameplayEventBus,
    private readonly fadeDurationSeconds: number = DEFAULT_FADE_DURATION_SECONDS
  ) {}

  getPhase(): TransitionPhase {
    return this.phase;
  }

  getScreenOpacity(): number {
    if (this.phase === "IDLE") {
      return 0;
    }
    if (this.phase === "LOADING") {
      return 1;
    }
    return this.fadeController?.getState().progress ?? 0;
  }

  beginTransition(): void {
    this.phase = "FADING_OUT";
    this.fadeController = new FadeController(this.fadeDurationSeconds, "IN");
    this.eventBus.emit("transition:phase-changed", { phase: this.phase });
  }

  /** Call every frame while phase is FADING_OUT or FADING_IN — no-ops harmlessly during IDLE/LOADING. */
  update(deltaSeconds: number): void {
    if (!this.fadeController) {
      return;
    }
    if (this.phase === "FADING_OUT") {
      const { isComplete } = this.fadeController.update(deltaSeconds);
      if (isComplete) {
        this.phase = "LOADING";
        this.eventBus.emit("transition:phase-changed", { phase: this.phase });
      }
      return;
    }
    if (this.phase === "FADING_IN") {
      const { isComplete } = this.fadeController.update(deltaSeconds);
      if (isComplete) {
        this.phase = "IDLE";
        this.fadeController = null;
        this.eventBus.emit("transition:phase-changed", { phase: this.phase });
      }
    }
  }

  /** Call once the real async loading work (scene streaming, asset preload) has genuinely resolved — advances LOADING into FADING_IN. */
  markLoadingComplete(): void {
    if (this.phase !== "LOADING") {
      return;
    }
    this.phase = "FADING_IN";
    this.fadeController = new FadeController(this.fadeDurationSeconds, "OUT");
    this.eventBus.emit("transition:phase-changed", { phase: this.phase });
  }
}

import { CharacterState } from "../CharacterState";
import type { MovementTuning } from "./MovementTuning";

export interface MovementStateContext {
  readonly isGrounded: boolean;
  readonly horizontalSpeed: number;
  readonly verticalVelocity: number;
  readonly sprintHeld: boolean;
  /** True only on the single tick a jump impulse was just applied. */
  readonly didJump: boolean;
  /** True when the character has (near-)zero horizontal speed but is rotating to face a new heading. */
  readonly isTurningInPlace: boolean;
}

const DEFAULT_LANDING_DURATION_SECONDS = 0.25;
/** While IDLE, speed must exceed idleSpeedThreshold * this multiplier to start WALKING — a higher bar than the base threshold. */
const IDLE_EXIT_MULTIPLIER = 1.5;
/** While WALKING (or faster), speed must drop below idleSpeedThreshold * this multiplier to fall back to IDLE — a lower bar than the base threshold. Together with IDLE_EXIT_MULTIPLIER this creates a genuine dead zone between the two, rather than widening only one side of it. */
const IDLE_REENTRY_MULTIPLIER = 0.5;
/** Narrows the "return to walking" threshold by 15% while already running — enough to absorb small speed fluctuations without needing a large, visually-odd dead zone near the run threshold. */
const RUN_HYSTERESIS_MULTIPLIER = 0.85;

/**
 * Decides the character's locomotion state each tick. Holds minimal
 * internal state of its own (whether it was airborne last tick, and a
 * landing-recovery timer) — everything else is recomputed fresh from
 * the context passed to `update()`, so it stays trivially testable
 * without a physics world.
 */
export class MovementStateMachine {
  private currentState: CharacterState;
  private wasAirborne = false;
  private landingElapsedSeconds = 0;

  constructor(
    initialState: CharacterState = CharacterState.IDLE,
    private readonly landingDurationSeconds = DEFAULT_LANDING_DURATION_SECONDS
  ) {
    this.currentState = initialState;
  }

  update(context: MovementStateContext, tuning: MovementTuning, deltaSeconds: number): CharacterState {
    if (context.didJump) {
      this.wasAirborne = true;
      this.currentState = CharacterState.JUMPING;
      return this.currentState;
    }

    if (!context.isGrounded) {
      this.wasAirborne = true;
      this.currentState = context.verticalVelocity > 0 ? CharacterState.JUMPING : CharacterState.FALLING;
      return this.currentState;
    }

    // Just touched down after being airborne: enter a brief LANDING recovery.
    if (this.wasAirborne) {
      this.wasAirborne = false;
      this.currentState = CharacterState.LANDING;
      this.landingElapsedSeconds = 0;
      return this.currentState;
    }

    if (this.currentState === CharacterState.LANDING) {
      this.landingElapsedSeconds += deltaSeconds;
      if (this.landingElapsedSeconds < this.landingDurationSeconds) {
        return this.currentState;
      }
    }

    this.currentState = this.resolveGroundedLocomotionState(context, tuning);
    return this.currentState;
  }

  private resolveGroundedLocomotionState(
    context: MovementStateContext,
    tuning: MovementTuning
  ): CharacterState {
    const idleExitThreshold = tuning.idleSpeedThreshold * IDLE_EXIT_MULTIPLIER;
    const idleReentryThreshold = tuning.idleSpeedThreshold * IDLE_REENTRY_MULTIPLIER;
    const runExitThreshold = tuning.runSpeedThreshold * RUN_HYSTERESIS_MULTIPLIER;

    // Idle <-> Walking: a genuine dead zone between idleReentryThreshold
    // and idleExitThreshold. Speed noise anywhere inside that band
    // keeps whichever state is already active — otherwise
    // horizontalSpeed settling near idleSpeedThreshold during
    // deceleration would flip the state every single frame.
    const isCurrentlyIdleOrTurning =
      this.currentState === CharacterState.IDLE || this.currentState === CharacterState.TURNING;
    const idleBoundary = isCurrentlyIdleOrTurning ? idleExitThreshold : idleReentryThreshold;

    if (context.horizontalSpeed < idleBoundary) {
      return context.isTurningInPlace ? CharacterState.TURNING : CharacterState.IDLE;
    }

    // Walking <-> Running: symmetric hysteresis — once running, only
    // drop back to walking below the lower runExitThreshold; once
    // walking, only promote to running above the full runSpeedThreshold.
    const isCurrentlyRunOrSprint =
      this.currentState === CharacterState.RUNNING || this.currentState === CharacterState.SPRINTING;
    const runBoundary = isCurrentlyRunOrSprint ? runExitThreshold : tuning.runSpeedThreshold;

    if (context.horizontalSpeed >= runBoundary) {
      return context.sprintHeld ? CharacterState.SPRINTING : CharacterState.RUNNING;
    }
    return CharacterState.WALKING;
  }

  getCurrentState(): CharacterState {
    return this.currentState;
  }
}

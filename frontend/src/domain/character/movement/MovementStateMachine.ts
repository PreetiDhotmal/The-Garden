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
    if (context.horizontalSpeed < tuning.idleSpeedThreshold) {
      return context.isTurningInPlace ? CharacterState.TURNING : CharacterState.IDLE;
    }
    if (context.horizontalSpeed >= tuning.runSpeedThreshold) {
      return context.sprintHeld ? CharacterState.SPRINTING : CharacterState.RUNNING;
    }
    return CharacterState.WALKING;
  }

  getCurrentState(): CharacterState {
    return this.currentState;
  }
}

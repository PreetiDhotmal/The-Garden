import { CharacterState } from "../CharacterState";
import { AnimationRole } from "./AnimationRole";

const STATE_TO_ROLE: Readonly<Record<CharacterState, AnimationRole>> = {
  [CharacterState.IDLE]: AnimationRole.IDLE,
  [CharacterState.WALKING]: AnimationRole.WALK,
  [CharacterState.RUNNING]: AnimationRole.RUN,
  [CharacterState.SPRINTING]: AnimationRole.SPRINT,
  [CharacterState.JUMPING]: AnimationRole.JUMP,
  [CharacterState.FALLING]: AnimationRole.FALL,
  [CharacterState.LANDING]: AnimationRole.LAND,
  // TURNING resolves to a direction-specific role by resolveAnimationRole below.
  [CharacterState.TURNING]: AnimationRole.TURN_LEFT,
};

export interface AnimationStateMachineSnapshot {
  readonly activeRole: AnimationRole;
  readonly previousRole: AnimationRole | null;
  /** True on the single tick the role changed — the moment to trigger a crossfade. */
  readonly justTransitioned: boolean;
}

/**
 * Pure translation from CharacterState (+ turn direction, for the one
 * state that needs it) to the AnimationRole that should be active.
 * Holds no reference to THREE.AnimationMixer or any clip — that
 * binding happens in infrastructure's CharacterAnimationController,
 * which reacts to `justTransitioned` to trigger a crossfade.
 */
export class AnimationStateMachine {
  private activeRole: AnimationRole;
  private previousRole: AnimationRole | null = null;

  constructor(initialState: CharacterState = CharacterState.IDLE) {
    this.activeRole = STATE_TO_ROLE[initialState];
  }

  /** @param turnDirection Only consulted when `state` is TURNING. */
  update(
    state: CharacterState,
    turnDirection: "left" | "right" = "left"
  ): AnimationStateMachineSnapshot {
    const nextRole =
      state === CharacterState.TURNING
        ? turnDirection === "left"
          ? AnimationRole.TURN_LEFT
          : AnimationRole.TURN_RIGHT
        : STATE_TO_ROLE[state];

    const justTransitioned = nextRole !== this.activeRole;
    if (justTransitioned) {
      this.previousRole = this.activeRole;
      this.activeRole = nextRole;
    }

    return { activeRole: this.activeRole, previousRole: this.previousRole, justTransitioned };
  }

  getActiveRole(): AnimationRole {
    return this.activeRole;
  }
}

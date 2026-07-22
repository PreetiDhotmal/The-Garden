/**
 * A character's current locomotion state. This is the shared
 * vocabulary between MovementStateMachine (which decides transitions
 * from physics/input) and AnimationStateMachine (which maps each
 * state to a clip) — keeping them on the same enum means adding a new
 * locomotion state can't silently desync animation from movement.
 */
export enum CharacterState {
  IDLE = "IDLE",
  WALKING = "WALKING",
  RUNNING = "RUNNING",
  SPRINTING = "SPRINTING",
  JUMPING = "JUMPING",
  FALLING = "FALLING",
  LANDING = "LANDING",
  TURNING = "TURNING",
}

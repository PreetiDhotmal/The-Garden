/**
 * The semantic animation "slots" the engine drives directly from
 * CharacterState / movement events. A CharacterAnimationConfig maps
 * each of these to a concrete clip name discovered on a specific
 * model — the engine never references a clip name like "NlaTrack"
 * directly, only these roles.
 */
export enum AnimationRole {
  IDLE = "IDLE",
  WALK = "WALK",
  RUN = "RUN",
  SPRINT = "SPRINT",
  JUMP = "JUMP",
  FALL = "FALL",
  LAND = "LAND",
  TURN_LEFT = "TURN_LEFT",
  TURN_RIGHT = "TURN_RIGHT",
  /** Milestone 7 addition — NPC dialogue animation. Falls back to IDLE in configs that don't map it, since not every model has a distinct talk clip discovered yet. */
  TALK = "TALK",
}

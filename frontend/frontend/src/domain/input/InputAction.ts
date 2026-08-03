/**
 * Abstract actions the game responds to. Nothing in the character
 * controller or camera reads a raw key code, gamepad button index, or
 * touch gesture directly — they only ever consume these, resolved by
 * InputMap + the per-device input sources in the infrastructure layer.
 */
export enum InputAction {
  MOVE_FORWARD = "MOVE_FORWARD",
  MOVE_BACKWARD = "MOVE_BACKWARD",
  MOVE_LEFT = "MOVE_LEFT",
  MOVE_RIGHT = "MOVE_RIGHT",
  SPRINT = "SPRINT",
  JUMP = "JUMP",
  INTERACT = "INTERACT",
  PAUSE = "PAUSE",
  OPEN_JOURNAL = "OPEN_JOURNAL",
  OPEN_INVENTORY = "OPEN_INVENTORY",
}

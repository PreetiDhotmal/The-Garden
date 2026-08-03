export interface InputFrameState {
  readonly moveForward: boolean;
  readonly moveBackward: boolean;
  readonly moveLeft: boolean;
  readonly moveRight: boolean;
  readonly sprintHeld: boolean;
  readonly jumpPressed: boolean;
  readonly interactPressed: boolean;
  /** Camera yaw/pitch delta this frame, in radians — from mouse movement, right gamepad stick, or a touch drag. */
  readonly lookDeltaX: number;
  readonly lookDeltaY: number;
  /** Camera zoom delta this frame — from mouse wheel or a pinch gesture. Positive = zoom out. */
  readonly zoomDelta: number;
}

export const EMPTY_INPUT_FRAME_STATE: InputFrameState = {
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,
  sprintHeld: false,
  jumpPressed: false,
  interactPressed: false,
  lookDeltaX: 0,
  lookDeltaY: 0,
  zoomDelta: 0,
};

/** Merges multiple input sources' frames for one tick — booleans OR together, deltas sum. */
export function mergeInputFrameStates(frames: readonly InputFrameState[]): InputFrameState {
  return frames.reduce<InputFrameState>((merged, frame) => ({
    moveForward: merged.moveForward || frame.moveForward,
    moveBackward: merged.moveBackward || frame.moveBackward,
    moveLeft: merged.moveLeft || frame.moveLeft,
    moveRight: merged.moveRight || frame.moveRight,
    sprintHeld: merged.sprintHeld || frame.sprintHeld,
    jumpPressed: merged.jumpPressed || frame.jumpPressed,
    interactPressed: merged.interactPressed || frame.interactPressed,
    lookDeltaX: merged.lookDeltaX + frame.lookDeltaX,
    lookDeltaY: merged.lookDeltaY + frame.lookDeltaY,
    zoomDelta: merged.zoomDelta + frame.zoomDelta,
  }), EMPTY_INPUT_FRAME_STATE);
}

/** Converts boolean movement flags into a normalized -1..1 x/z direction, matching MovementInput's shape. */
export function inputFrameToMoveVector(frame: InputFrameState): { x: number; z: number } {
  const rawX = (frame.moveRight ? 1 : 0) - (frame.moveLeft ? 1 : 0);
  const rawZ = (frame.moveForward ? 1 : 0) - (frame.moveBackward ? 1 : 0);
  const magnitude = Math.hypot(rawX, rawZ);
  if (magnitude === 0) {
    return { x: 0, z: 0 };
  }
  return { x: rawX / magnitude, z: rawZ / magnitude };
}

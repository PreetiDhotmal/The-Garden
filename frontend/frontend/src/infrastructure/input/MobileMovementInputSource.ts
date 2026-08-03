import { EMPTY_INPUT_FRAME_STATE, type InputFrameState } from "@/domain/input/InputFrameState";
import type { InputSource } from "./InputSource";

/**
 * Fed by the visible on-screen VirtualJoystick (movement) and
 * TouchCameraArea (camera look) components - implements the same
 * InputSource contract as keyboard/mouse/gamepad, so the character
 * controller and camera consume it identically. Movement is reported
 * as a normalized -1..1 x/z vector directly (the joystick already
 * computes this from stick displacement), converted to the
 * project's existing boolean moveForward/moveBackward/moveLeft/
 * moveRight fields via a small threshold - matching how every other
 * InputSource already represents movement, rather than introducing a
 * second, parallel movement representation.
 */
export class MobileMovementInputSource implements InputSource {
  private moveX = 0;
  private moveZ = 0;
  private lookDeltaX = 0;
  private lookDeltaY = 0;

  attach(): void {
    // No DOM listeners - state is pushed in via setters, called by
    // the VirtualJoystick/TouchCameraArea React components.
  }

  detach(): void {
    this.moveX = 0;
    this.moveZ = 0;
    this.lookDeltaX = 0;
    this.lookDeltaY = 0;
  }

  /** x/z each in -1..1, as reported by VirtualJoystick's stick displacement. */
  setMoveVector(x: number, z: number): void {
    this.moveX = x;
    this.moveZ = z;
  }

  /** Accumulates a look delta this frame, as reported by TouchCameraArea's drag tracking. */
  addLookDelta(deltaX: number, deltaY: number): void {
    this.lookDeltaX += deltaX;
    this.lookDeltaY += deltaY;
  }

  sample(): InputFrameState {
    const MOVE_THRESHOLD = 0.25;
    const frame: InputFrameState = {
      ...EMPTY_INPUT_FRAME_STATE,
      moveForward: this.moveZ < -MOVE_THRESHOLD,
      moveBackward: this.moveZ > MOVE_THRESHOLD,
      moveLeft: this.moveX < -MOVE_THRESHOLD,
      moveRight: this.moveX > MOVE_THRESHOLD,
      lookDeltaX: this.lookDeltaX,
      lookDeltaY: this.lookDeltaY,
    };
    this.lookDeltaX = 0;
    this.lookDeltaY = 0;
    return frame;
  }
}

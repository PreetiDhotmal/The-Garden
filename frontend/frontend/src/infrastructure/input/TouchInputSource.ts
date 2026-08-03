import { EMPTY_INPUT_FRAME_STATE, type InputFrameState } from "@/domain/input/InputFrameState";
import type { InputSource } from "./InputSource";

const MOVE_STICK_MAX_RADIUS = 50;
const LOOK_SENSITIVITY = 0.004;

interface ActiveTouch {
  readonly identifier: number;
  readonly startX: number;
  readonly startY: number;
  lastX: number;
  lastY: number;
}

/**
 * A dual-zone touch controller: a touch starting in the left half of
 * `targetElement` drives movement (virtual joystick, clamped to
 * `MOVE_STICK_MAX_RADIUS`), a touch starting in the right half
 * accumulates look deltas (like a touch-drag camera, similar to
 * mobile third-person games). This is a working mobile input
 * abstraction, not a placeholder — though it has not been tuned on a
 * physical device (see Known Limitations).
 */
export class TouchInputSource implements InputSource {
  private moveTouch: ActiveTouch | null = null;
  private lookTouch: ActiveTouch | null = null;
  private lookDeltaX = 0;
  private lookDeltaY = 0;

  constructor(private readonly targetElement: HTMLElement) {}

  attach(): void {
    this.targetElement.addEventListener("touchstart", this.handleTouchStart, { passive: true });
    this.targetElement.addEventListener("touchmove", this.handleTouchMove, { passive: true });
    this.targetElement.addEventListener("touchend", this.handleTouchEnd, { passive: true });
    this.targetElement.addEventListener("touchcancel", this.handleTouchEnd, { passive: true });
  }

  detach(): void {
    this.targetElement.removeEventListener("touchstart", this.handleTouchStart);
    this.targetElement.removeEventListener("touchmove", this.handleTouchMove);
    this.targetElement.removeEventListener("touchend", this.handleTouchEnd);
    this.targetElement.removeEventListener("touchcancel", this.handleTouchEnd);
    this.moveTouch = null;
    this.lookTouch = null;
  }

  sample(): InputFrameState {
    let moveForward = false;
    let moveBackward = false;
    let moveLeft = false;
    let moveRight = false;

    if (this.moveTouch) {
      const dx = this.moveTouch.lastX - this.moveTouch.startX;
      const dy = this.moveTouch.lastY - this.moveTouch.startY;
      moveForward = dy < -10;
      moveBackward = dy > 10;
      moveLeft = dx < -10;
      moveRight = dx > 10;
    }

    const frame: InputFrameState = {
      ...EMPTY_INPUT_FRAME_STATE,
      moveForward,
      moveBackward,
      moveLeft,
      moveRight,
      lookDeltaX: this.lookDeltaX,
      lookDeltaY: this.lookDeltaY,
    };
    this.lookDeltaX = 0;
    this.lookDeltaY = 0;
    return frame;
  }

  private handleTouchStart = (event: TouchEvent): void => {
    const bounds = this.targetElement.getBoundingClientRect();
    for (const touch of Array.from(event.changedTouches)) {
      const isLeftHalf = touch.clientX - bounds.left < bounds.width / 2;
      const activeTouch: ActiveTouch = {
        identifier: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        lastX: touch.clientX,
        lastY: touch.clientY,
      };
      if (isLeftHalf && !this.moveTouch) {
        this.moveTouch = activeTouch;
      } else if (!isLeftHalf && !this.lookTouch) {
        this.lookTouch = activeTouch;
      }
    }
  };

  private handleTouchMove = (event: TouchEvent): void => {
    for (const touch of Array.from(event.changedTouches)) {
      if (this.moveTouch?.identifier === touch.identifier) {
        this.moveTouch.lastX = clampToRadius(touch.clientX, this.moveTouch.startX, MOVE_STICK_MAX_RADIUS);
        this.moveTouch.lastY = clampToRadius(touch.clientY, this.moveTouch.startY, MOVE_STICK_MAX_RADIUS);
      } else if (this.lookTouch?.identifier === touch.identifier) {
        this.lookDeltaX += -(touch.clientX - this.lookTouch.lastX) * LOOK_SENSITIVITY;
        this.lookDeltaY += -(touch.clientY - this.lookTouch.lastY) * LOOK_SENSITIVITY;
        this.lookTouch.lastX = touch.clientX;
        this.lookTouch.lastY = touch.clientY;
      }
    }
  };

  private handleTouchEnd = (event: TouchEvent): void => {
    for (const touch of Array.from(event.changedTouches)) {
      if (this.moveTouch?.identifier === touch.identifier) {
        this.moveTouch = null;
      } else if (this.lookTouch?.identifier === touch.identifier) {
        this.lookTouch = null;
      }
    }
  };
}

function clampToRadius(value: number, origin: number, maxRadius: number): number {
  const offset = value - origin;
  const clamped = Math.max(-maxRadius, Math.min(maxRadius, offset));
  return origin + clamped;
}

import { EMPTY_INPUT_FRAME_STATE, type InputFrameState } from "@/domain/input/InputFrameState";
import type { InputSource } from "./InputSource";

const LOOK_SENSITIVITY = 0.0025;
const ZOOM_SENSITIVITY = 0.0015;

/**
 * Accumulates look/zoom input from the mouse. Look input only
 * accumulates while the pointer is locked to `targetElement` (calling
 * `requestPointerLock()` is the caller's responsibility, typically
 * triggered by a click-to-play overlay) — this avoids capturing every
 * incidental mouse move over the canvas as a camera rotation.
 */
export class MouseInputSource implements InputSource {
  private lookDeltaX = 0;
  private lookDeltaY = 0;
  private zoomDelta = 0;

  constructor(
    private readonly targetElement: HTMLElement,
    private readonly sensitivityMultiplier = 1
  ) {}

  attach(): void {
    document.addEventListener("mousemove", this.handleMouseMove);
    this.targetElement.addEventListener("wheel", this.handleWheel, { passive: true });
  }

  detach(): void {
    document.removeEventListener("mousemove", this.handleMouseMove);
    this.targetElement.removeEventListener("wheel", this.handleWheel);
  }

  sample(): InputFrameState {
    const frame: InputFrameState = {
      ...EMPTY_INPUT_FRAME_STATE,
      lookDeltaX: this.lookDeltaX,
      lookDeltaY: this.lookDeltaY,
      zoomDelta: this.zoomDelta,
    };
    this.lookDeltaX = 0;
    this.lookDeltaY = 0;
    this.zoomDelta = 0;
    return frame;
  }

  private handleMouseMove = (event: MouseEvent): void => {
    if (document.pointerLockElement !== this.targetElement) {
      return;
    }
    this.lookDeltaX += -event.movementX * LOOK_SENSITIVITY * this.sensitivityMultiplier;
    this.lookDeltaY += -event.movementY * LOOK_SENSITIVITY * this.sensitivityMultiplier;
  };

  private handleWheel = (event: WheelEvent): void => {
    this.zoomDelta += event.deltaY * ZOOM_SENSITIVITY;
  };
}

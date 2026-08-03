import type { InputFrameState } from "@/domain/input/InputFrameState";

/**
 * Contract every device-specific input source implements. `sample()`
 * is called once per render tick by InputSystem and should return
 * this frame's contribution, resetting any edge-triggered or
 * delta-accumulated fields (jumpPressed, lookDelta*, zoomDelta) — held
 * states (movement, sprint) are not reset, since they reflect current
 * physical state, not a one-frame event.
 */
export interface InputSource {
  attach: () => void;
  detach: () => void;
  sample: () => InputFrameState;
}

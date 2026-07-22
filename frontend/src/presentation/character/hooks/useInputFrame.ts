import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { EMPTY_INPUT_FRAME_STATE, type InputFrameState } from "@/domain/input/InputFrameState";
import type { InputSystem } from "@/infrastructure/input/InputSystem";

/**
 * Must be called exactly once per active InputSystem. `sample()`
 * resets delta-accumulated fields (look/zoom) as a side effect, so
 * calling it more than once per frame would starve whichever consumer
 * samples second — every other consumer must read the returned ref
 * instead of calling `inputSystem.sample()` itself.
 */
export function useInputFrame(inputSystem: InputSystem): React.RefObject<InputFrameState> {
  const frameRef = useRef<InputFrameState>(EMPTY_INPUT_FRAME_STATE);
  useFrame(() => {
    frameRef.current = inputSystem.sample();
  }, -1); // negative priority: runs before default-priority (0) camera/controller callbacks
  return frameRef;
}

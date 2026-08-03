import { EMPTY_INPUT_FRAME_STATE, type InputFrameState } from "@/domain/input/InputFrameState";
import type { InputSource } from "./InputSource";

/**
 * Backs the on-screen jump/sprint/interact buttons (MobileControls).
 * Implements the same InputSource contract every other device uses,
 * so the character controller and interaction system consume it
 * identically to keyboard input - not a parallel, disconnected mobile
 * input path. React button components call the setters below;
 * InputSystem calls sample() once per frame like any other source.
 */
export class MobileButtonInputSource implements InputSource {
  private sprintHeld = false;
  private jumpPressed = false;
  private interactPressed = false;

  attach(): void {
    // No DOM listeners to wire up - state is pushed in via the
    // setters below, called directly by React event handlers.
  }

  detach(): void {
    this.sprintHeld = false;
    this.jumpPressed = false;
    this.interactPressed = false;
  }

  setSprintHeld(held: boolean): void {
    this.sprintHeld = held;
  }

  /** Edge-triggered, matching keyboard's own jump handling - one press registers once, not held-every-frame. */
  triggerJump(): void {
    this.jumpPressed = true;
  }

  /** Edge-triggered, matching keyboard's own interact handling. */
  triggerInteract(): void {
    this.interactPressed = true;
  }

  sample(): InputFrameState {
    const frame: InputFrameState = {
      ...EMPTY_INPUT_FRAME_STATE,
      sprintHeld: this.sprintHeld,
      jumpPressed: this.jumpPressed,
      interactPressed: this.interactPressed,
    };
    // Edge-triggered fields reset after being sampled once, same
    // convention as every other InputSource in this project.
    this.jumpPressed = false;
    this.interactPressed = false;
    return frame;
  }
}

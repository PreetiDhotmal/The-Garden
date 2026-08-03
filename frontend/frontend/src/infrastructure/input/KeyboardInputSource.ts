import { InputAction } from "@/domain/input/InputAction";
import { EMPTY_INPUT_FRAME_STATE, type InputFrameState } from "@/domain/input/InputFrameState";
import type { InputMap } from "@/domain/input/InputMap";
import type { InputSource } from "./InputSource";

export class KeyboardInputSource implements InputSource {
  private readonly heldActions = new Set<InputAction>();
  private jumpPressedThisFrame = false;
  private interactPressedThisFrame = false;

  constructor(private readonly inputMap: InputMap) {}

  attach(): void {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  detach(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.heldActions.clear();
  }

  sample(): InputFrameState {
    const frame: InputFrameState = {
      ...EMPTY_INPUT_FRAME_STATE,
      moveForward: this.heldActions.has(InputAction.MOVE_FORWARD),
      moveBackward: this.heldActions.has(InputAction.MOVE_BACKWARD),
      moveLeft: this.heldActions.has(InputAction.MOVE_LEFT),
      moveRight: this.heldActions.has(InputAction.MOVE_RIGHT),
      sprintHeld: this.heldActions.has(InputAction.SPRINT),
      jumpPressed: this.jumpPressedThisFrame,
      interactPressed: this.interactPressedThisFrame,
    };
    this.jumpPressedThisFrame = false;
    this.interactPressedThisFrame = false;
    return frame;
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    const action = this.inputMap.resolveAction("keyboard", event.code);
    if (!action) {
      return;
    }
    if (action === InputAction.JUMP && !this.heldActions.has(action)) {
      this.jumpPressedThisFrame = true;
    }
    if (action === InputAction.INTERACT && !this.heldActions.has(action)) {
      this.interactPressedThisFrame = true;
    }
    this.heldActions.add(action);
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    const action = this.inputMap.resolveAction("keyboard", event.code);
    if (action) {
      this.heldActions.delete(action);
    }
  };
}

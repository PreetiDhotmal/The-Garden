import { InputAction } from "@/domain/input/InputAction";
import { EMPTY_INPUT_FRAME_STATE, type InputFrameState } from "@/domain/input/InputFrameState";
import type { InputMap } from "@/domain/input/InputMap";
import type { InputSource } from "./InputSource";

const STICK_DEADZONE = 0.15;
const LOOK_SENSITIVITY = 0.045;
const LEFT_STICK_X_AXIS = 0;
const LEFT_STICK_Y_AXIS = 1;
const RIGHT_STICK_X_AXIS = 2;
const RIGHT_STICK_Y_AXIS = 3;

function applyDeadzone(value: number): number {
  return Math.abs(value) < STICK_DEADZONE ? 0 : value;
}

/**
 * Polls `navigator.getGamepads()` on every `sample()` call rather than
 * listening for events — the Gamepad API has no move/press events by
 * design, polling each frame is the documented approach. Uses
 * `gamepadindex 0` (the first connected gamepad); multi-gamepad
 * support is not needed for a single-player character controller.
 */
export class GamepadInputSource implements InputSource {
  private previousJumpHeld = false;
  private previousInteractHeld = false;

  constructor(private readonly inputMap: InputMap) {}

  attach(): void {
    // No listeners to attach — the Gamepad API is poll-based.
  }

  detach(): void {
    this.previousJumpHeld = false;
    this.previousInteractHeld = false;
  }

  sample(): InputFrameState {
    const gamepad = navigator.getGamepads()[0];
    if (!gamepad) {
      return EMPTY_INPUT_FRAME_STATE;
    }

    const moveX = applyDeadzone(gamepad.axes[LEFT_STICK_X_AXIS] ?? 0);
    const moveY = applyDeadzone(gamepad.axes[LEFT_STICK_Y_AXIS] ?? 0);
    const lookX = applyDeadzone(gamepad.axes[RIGHT_STICK_X_AXIS] ?? 0);
    const lookY = applyDeadzone(gamepad.axes[RIGHT_STICK_Y_AXIS] ?? 0);

    const jumpBinding = this.inputMap
      .listBindingsForAction(InputAction.JUMP)
      .find((binding) => binding.deviceKind === "gamepad-button");
    const sprintBinding = this.inputMap
      .listBindingsForAction(InputAction.SPRINT)
      .find((binding) => binding.deviceKind === "gamepad-button");

    const interactBinding = this.inputMap
      .listBindingsForAction(InputAction.INTERACT)
      .find((binding) => binding.deviceKind === "gamepad-button");

    const jumpHeld = jumpBinding ? this.isButtonPressed(gamepad, jumpBinding.physicalInput) : false;
    const jumpPressed = jumpHeld && !this.previousJumpHeld;
    this.previousJumpHeld = jumpHeld;

    const interactHeld = interactBinding ? this.isButtonPressed(gamepad, interactBinding.physicalInput) : false;
    const interactPressed = interactHeld && !this.previousInteractHeld;
    this.previousInteractHeld = interactHeld;

    return {
      moveForward: moveY < 0,
      moveBackward: moveY > 0,
      moveLeft: moveX < 0,
      moveRight: moveX > 0,
      sprintHeld: sprintBinding ? this.isButtonPressed(gamepad, sprintBinding.physicalInput) : false,
      jumpPressed,
      interactPressed,
      lookDeltaX: lookX * LOOK_SENSITIVITY,
      lookDeltaY: lookY * LOOK_SENSITIVITY,
      zoomDelta: 0,
    };
  }

  private isButtonPressed(gamepad: Gamepad, buttonIndexString: string): boolean {
    const index = Number.parseInt(buttonIndexString, 10);
    return gamepad.buttons[index]?.pressed ?? false;
  }
}

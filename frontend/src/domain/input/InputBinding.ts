import type { InputAction } from "./InputAction";

export type InputDeviceKind = "keyboard" | "gamepad-button" | "gamepad-axis" | "touch";

/**
 * One physical-input-to-action binding. `physicalInput` is
 * intentionally `string` (not a device-specific union) — for
 * "keyboard" it's a `KeyboardEvent.code` value like "KeyW"; for
 * "gamepad-button" it's a button index as a string; this keeps
 * InputBinding/InputMap fully device-agnostic and serializable (e.g.
 * to localStorage for a rebind UI) without importing DOM/Gamepad
 * types into the domain layer.
 */
export interface InputBinding {
  readonly action: InputAction;
  readonly deviceKind: InputDeviceKind;
  readonly physicalInput: string;
}

export function createInputBinding(
  action: InputAction,
  deviceKind: InputDeviceKind,
  physicalInput: string
): InputBinding {
  if (physicalInput.trim().length === 0) {
    throw new Error("physicalInput must not be empty");
  }
  return { action, deviceKind, physicalInput };
}

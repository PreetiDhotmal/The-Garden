import { InputAction } from "./InputAction";
import { createInputBinding, type InputBinding, type InputDeviceKind } from "./InputBinding";

function bindingKey(deviceKind: InputDeviceKind, physicalInput: string): string {
  return `${deviceKind}:${physicalInput}`;
}

export const DEFAULT_KEYBOARD_BINDINGS: readonly InputBinding[] = [
  createInputBinding(InputAction.MOVE_FORWARD, "keyboard", "KeyW"),
  createInputBinding(InputAction.MOVE_FORWARD, "keyboard", "ArrowUp"),
  createInputBinding(InputAction.MOVE_BACKWARD, "keyboard", "KeyS"),
  createInputBinding(InputAction.MOVE_BACKWARD, "keyboard", "ArrowDown"),
  createInputBinding(InputAction.MOVE_LEFT, "keyboard", "KeyA"),
  createInputBinding(InputAction.MOVE_LEFT, "keyboard", "ArrowLeft"),
  createInputBinding(InputAction.MOVE_RIGHT, "keyboard", "KeyD"),
  createInputBinding(InputAction.MOVE_RIGHT, "keyboard", "ArrowRight"),
  createInputBinding(InputAction.SPRINT, "keyboard", "ShiftLeft"),
  createInputBinding(InputAction.JUMP, "keyboard", "Space"),
  createInputBinding(InputAction.INTERACT, "keyboard", "KeyE"),
];

export const DEFAULT_GAMEPAD_BINDINGS: readonly InputBinding[] = [
  createInputBinding(InputAction.SPRINT, "gamepad-button", "10"), // left stick click
  createInputBinding(InputAction.JUMP, "gamepad-button", "0"), // face button (A/Cross)
  createInputBinding(InputAction.INTERACT, "gamepad-button", "2"), // face button (X/Square)
];

/**
 * A rebindable map from physical inputs to semantic actions. Multiple
 * physical inputs may map to the same action (e.g. WASD and arrow
 * keys both drive movement); `rebind` replaces whichever binding(s)
 * currently occupy the *target* action for a given device kind, so
 * rebinding "jump" from Space to Enter doesn't leave Space dangling
 * mapped to jump as well.
 */
export class InputMap {
  private readonly bindingsByKey = new Map<string, InputBinding>();

  constructor(initialBindings: readonly InputBinding[] = []) {
    for (const binding of initialBindings) {
      this.bindingsByKey.set(bindingKey(binding.deviceKind, binding.physicalInput), binding);
    }
  }

  resolveAction(deviceKind: InputDeviceKind, physicalInput: string): InputAction | null {
    return this.bindingsByKey.get(bindingKey(deviceKind, physicalInput))?.action ?? null;
  }

  /** Replaces every existing binding for `action` on `deviceKind` with a single new physical input. */
  rebind(action: InputAction, deviceKind: InputDeviceKind, newPhysicalInput: string): void {
    for (const [key, binding] of this.bindingsByKey.entries()) {
      if (binding.action === action && binding.deviceKind === deviceKind) {
        this.bindingsByKey.delete(key);
      }
    }
    const binding = createInputBinding(action, deviceKind, newPhysicalInput);
    this.bindingsByKey.set(bindingKey(deviceKind, newPhysicalInput), binding);
  }

  listBindingsForAction(action: InputAction): readonly InputBinding[] {
    return Array.from(this.bindingsByKey.values()).filter((binding) => binding.action === action);
  }

  listAll(): readonly InputBinding[] {
    return Array.from(this.bindingsByKey.values());
  }
}

export function createDefaultInputMap(): InputMap {
  return new InputMap([...DEFAULT_KEYBOARD_BINDINGS, ...DEFAULT_GAMEPAD_BINDINGS]);
}

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { InputAction } from "@/domain/input/InputAction";

export type RebindableAction =
  | InputAction.MOVE_FORWARD
  | InputAction.MOVE_BACKWARD
  | InputAction.MOVE_LEFT
  | InputAction.MOVE_RIGHT
  | InputAction.SPRINT
  | InputAction.JUMP
  | InputAction.INTERACT
  | InputAction.PAUSE
  | InputAction.OPEN_JOURNAL
  | InputAction.OPEN_INVENTORY;

export const REBINDABLE_ACTIONS: readonly { action: RebindableAction; label: string }[] = [
  { action: InputAction.MOVE_FORWARD, label: "Forward" },
  { action: InputAction.MOVE_BACKWARD, label: "Backward" },
  { action: InputAction.MOVE_LEFT, label: "Left" },
  { action: InputAction.MOVE_RIGHT, label: "Right" },
  { action: InputAction.JUMP, label: "Jump" },
  { action: InputAction.SPRINT, label: "Sprint" },
  { action: InputAction.INTERACT, label: "Interact" },
  { action: InputAction.PAUSE, label: "Pause" },
  { action: InputAction.OPEN_JOURNAL, label: "Open Journal" },
  { action: InputAction.OPEN_INVENTORY, label: "Open Inventory" },
];

interface KeyBindingsState {
  readonly overrides: Readonly<Partial<Record<InputAction, string>>>;
  rebind: (action: RebindableAction, physicalInput: string) => void;
  resetToDefaults: () => void;
}

export const useKeyBindingsStore = create<KeyBindingsState>()(
  persist(
    (set) => ({
      overrides: {},
      rebind: (action, physicalInput) => {
        set((state) => ({ overrides: { ...state.overrides, [action]: physicalInput } }));
      },
      resetToDefaults: () => {
        set({ overrides: {} });
      },
    }),
    { name: "the-garden:key-bindings" }
  )
);

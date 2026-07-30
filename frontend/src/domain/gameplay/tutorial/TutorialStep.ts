export type TutorialStepId =
  | "MOVE"
  | "LOOK"
  | "JUMP"
  | "SPRINT"
  | "INTERACT"
  | "READ_SCRIPTURE"
  | "OPEN_JOURNAL"
  | "OPEN_INVENTORY"
  | "PAUSE"
  | "SAVE";

export interface TutorialStep {
  readonly id: TutorialStepId;
  readonly instruction: string;
}

export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  { id: "MOVE", instruction: "Use W A S D to walk through the Garden." },
  { id: "LOOK", instruction: "Move the mouse to look around." },
  { id: "JUMP", instruction: "Press Space to jump." },
  { id: "SPRINT", instruction: "Hold Shift while moving to sprint." },
  { id: "INTERACT", instruction: "Walk up to something and press E to interact with it." },
  { id: "READ_SCRIPTURE", instruction: "Interact with a scripture stone to read it." },
  { id: "OPEN_JOURNAL", instruction: "Press J to open your Journal." },
  { id: "OPEN_INVENTORY", instruction: "Press I to open your Inventory." },
  { id: "PAUSE", instruction: "Press Escape to pause the game." },
  { id: "SAVE", instruction: "Open the pause menu and press Save to save your progress." },
];

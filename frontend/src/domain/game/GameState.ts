export enum GameState {
  GAME_BOOT = "GAME_BOOT",
  LOADING = "LOADING",
  MAIN_MENU = "MAIN_MENU",
  CHARACTER_SELECTION = "CHARACTER_SELECTION",
  LOBBY = "LOBBY",
  HUB_WORLD = "HUB_WORLD",
  ENTERING_LEVEL = "ENTERING_LEVEL",
  PLAYING = "PLAYING",
  PAUSED = "PAUSED",
  REFLECTION = "REFLECTION",
  GARDEN_RESTORATION = "GARDEN_RESTORATION",
  SAVING = "SAVING",
  LEVEL_COMPLETE = "LEVEL_COMPLETE",
  CREDITS = "CREDITS",
}

/**
 * Explicit allow-list of valid transitions, keyed by current state —
 * this is what "no boolean spaghetti" means concretely: there is
 * exactly one place in the codebase that answers "can we go from X to
 * Y", and it's a data table, not a scattered set of `if
 * (isPaused && !isLoading && hasEntity)` checks across components.
 */
const VALID_TRANSITIONS: Readonly<Record<GameState, readonly GameState[]>> = {
  [GameState.GAME_BOOT]: [GameState.LOADING],
  [GameState.LOADING]: [GameState.MAIN_MENU],
  [GameState.MAIN_MENU]: [GameState.CHARACTER_SELECTION, GameState.LOBBY, GameState.LOADING],
  [GameState.CHARACTER_SELECTION]: [GameState.LOBBY, GameState.MAIN_MENU],
  [GameState.LOBBY]: [GameState.HUB_WORLD, GameState.MAIN_MENU, GameState.LOADING],
  [GameState.HUB_WORLD]: [
    GameState.ENTERING_LEVEL,
    GameState.SAVING,
    GameState.MAIN_MENU,
    GameState.CREDITS,
  ],
  [GameState.ENTERING_LEVEL]: [GameState.PLAYING, GameState.HUB_WORLD],
  [GameState.PLAYING]: [
    GameState.PAUSED,
    GameState.LEVEL_COMPLETE,
    GameState.SAVING,
    GameState.HUB_WORLD,
  ],
  [GameState.PAUSED]: [GameState.PLAYING, GameState.MAIN_MENU, GameState.HUB_WORLD],
  [GameState.LEVEL_COMPLETE]: [GameState.REFLECTION],
  [GameState.REFLECTION]: [GameState.GARDEN_RESTORATION],
  [GameState.GARDEN_RESTORATION]: [GameState.SAVING, GameState.HUB_WORLD],
  [GameState.SAVING]: [GameState.HUB_WORLD, GameState.PLAYING, GameState.MAIN_MENU],
  [GameState.CREDITS]: [GameState.MAIN_MENU],
};

export class InvalidGameStateTransitionError extends Error {
  constructor(
    readonly from: GameState,
    readonly to: GameState
  ) {
    super(`Cannot transition from ${from} to ${to} — not a valid GameState transition.`);
    this.name = "InvalidGameStateTransitionError";
  }
}

export function isValidGameStateTransition(from: GameState, to: GameState): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export function listValidNextStates(from: GameState): readonly GameState[] {
  return VALID_TRANSITIONS[from];
}

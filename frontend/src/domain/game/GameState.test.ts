import { describe, expect, it } from "vitest";
import { GameState, isValidGameStateTransition, listValidNextStates } from "./GameState";

describe("GameState transitions", () => {
  it("allows the documented boot sequence", () => {
    expect(isValidGameStateTransition(GameState.GAME_BOOT, GameState.LOADING)).toBe(true);
    expect(isValidGameStateTransition(GameState.LOADING, GameState.MAIN_MENU)).toBe(true);
  });

  it("rejects skipping loading entirely", () => {
    expect(isValidGameStateTransition(GameState.GAME_BOOT, GameState.MAIN_MENU)).toBe(false);
  });

  it("allows pausing only from PLAYING", () => {
    expect(isValidGameStateTransition(GameState.PLAYING, GameState.PAUSED)).toBe(true);
    expect(isValidGameStateTransition(GameState.HUB_WORLD, GameState.PAUSED)).toBe(false);
  });

  it("allows resuming from PAUSED back to PLAYING", () => {
    expect(isValidGameStateTransition(GameState.PAUSED, GameState.PLAYING)).toBe(true);
  });

  it("enforces the level-complete -> reflection -> garden-restoration sequence", () => {
    expect(isValidGameStateTransition(GameState.LEVEL_COMPLETE, GameState.REFLECTION)).toBe(true);
    expect(isValidGameStateTransition(GameState.REFLECTION, GameState.GARDEN_RESTORATION)).toBe(
      true
    );
    expect(isValidGameStateTransition(GameState.LEVEL_COMPLETE, GameState.HUB_WORLD)).toBe(false);
  });

  it("does not allow jumping directly from PLAYING to REFLECTION, skipping LEVEL_COMPLETE", () => {
    expect(isValidGameStateTransition(GameState.PLAYING, GameState.REFLECTION)).toBe(false);
  });

  it("listValidNextStates matches isValidGameStateTransition for every state", () => {
    for (const from of Object.values(GameState)) {
      for (const to of Object.values(GameState)) {
        expect(listValidNextStates(from).includes(to)).toBe(isValidGameStateTransition(from, to));
      }
    }
  });

  it("every state has at least one valid outgoing transition", () => {
    for (const state of Object.values(GameState)) {
      expect(listValidNextStates(state).length).toBeGreaterThan(0);
    }
  });
});

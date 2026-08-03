import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { GameState, isValidGameStateTransition } from "@/domain/game/GameState";

/**
 * Android's hardware/gesture back button has no web equivalent -
 * Capacitor's App plugin fires a 'backButton' event for it. This maps
 * each GameState to a sensible "go back" target, reusing this
 * project's own real, existing state machine
 * (isValidGameStateTransition) rather than a separate ad-hoc
 * navigation stack - so back-button behavior can never drift out of
 * sync with what transitions are actually valid.
 *
 * No-ops entirely on web/desktop (Capacitor.isNativePlatform() is
 * false there) - this does not change browser behavior at all.
 */
const BACK_TARGET_BY_STATE: Partial<Record<GameState, GameState>> = {
  [GameState.CHARACTER_SELECTION]: GameState.MAIN_MENU,
  [GameState.LOBBY]: GameState.MAIN_MENU,
  [GameState.HUB_WORLD]: GameState.MAIN_MENU,
  [GameState.PAUSED]: GameState.HUB_WORLD,
  [GameState.CREDITS]: GameState.MAIN_MENU,
};

/** PLAYING itself first goes to PAUSED (opening the pause state) rather than leaving the level outright - "leave pause menu" before "return to previous screen". */
const PLAYING_BACK_TARGET = GameState.PAUSED;

export interface UseAndroidBackButtonOptions {
  readonly gameState: GameState;
  readonly transitionToState: (state: GameState) => void;
}

export function useAndroidBackButton({
  gameState,
  transitionToState,
}: UseAndroidBackButtonOptions): void {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const listenerPromise = CapacitorApp.addListener("backButton", () => {
      if (gameState === GameState.MAIN_MENU) {
        // Already at the main screen - ask before exiting rather than
        // silently closing, matching the explicit requirement.
        if (window.confirm("Exit The Garden?")) {
          void CapacitorApp.exitApp();
        }
        return;
      }

      if (gameState === GameState.PLAYING) {
        transitionToState(PLAYING_BACK_TARGET);
        return;
      }

      const target = BACK_TARGET_BY_STATE[gameState];
      if (target && isValidGameStateTransition(gameState, target)) {
        transitionToState(target);
        return;
      }

      // No sensible mapped target for this state (e.g. mid-transition
      // states like ENTERING_LEVEL/SAVING/REFLECTION) - deliberately
      // do nothing rather than force an invalid or jarring transition
      // that could corrupt in-progress gameplay/save state.
    });

    return () => {
      void listenerPromise.then((listener) => listener.remove());
    };
  }, [gameState, transitionToState]);
}

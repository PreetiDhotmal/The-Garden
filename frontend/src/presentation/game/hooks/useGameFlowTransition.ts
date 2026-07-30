import { useEffect, useRef } from "react";
import type { GameState } from "@/domain/game/GameState";
import { useGameFramework } from "./useGameFramework";
import { useTransitionDriver, type TransitionState } from "./useTransitionDriver";

export interface GameFlowTransition extends TransitionState {
  readonly transitionToState: (next: GameState) => void;
}

export function useGameFlowTransition(): GameFlowTransition {
  const { gameStateMachine, transitionManager } = useGameFramework();
  const transitionState = useTransitionDriver();
  const pendingStateRef = useRef<GameState | null>(null);
  const hasAppliedPendingStateRef = useRef(false);

  const transitionToState = (next: GameState) => {
    pendingStateRef.current = next;
    hasAppliedPendingStateRef.current = false;
    transitionManager.beginTransition();
  };

  useEffect(() => {
    if (
      transitionState.phase === "LOADING" &&
      pendingStateRef.current &&
      !hasAppliedPendingStateRef.current
    ) {
      hasAppliedPendingStateRef.current = true;
      gameStateMachine.transitionTo(pendingStateRef.current);
      pendingStateRef.current = null;
      // No real async loading blocks screen composition here (assets
      // are preloaded independently, per-screen, elsewhere) — marking
      // complete immediately still gives the fade-out/fade-in beats
      // real visual weight without an artificial stall.
      transitionManager.markLoadingComplete();
    }
  }, [transitionState.phase, gameStateMachine, transitionManager]);

  return { ...transitionState, transitionToState };
}

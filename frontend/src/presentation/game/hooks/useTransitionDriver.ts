import { useEffect, useRef, useState } from "react";
import type { TransitionPhase } from "@/domain/game/TransitionManager";
import { useGameFramework } from "./useGameFramework";

export interface TransitionState {
  readonly phase: TransitionPhase;
  readonly opacity: number;
}

/**
 * TransitionManager is pure domain logic with no canvas/frame-loop
 * dependency of its own (deliberately, so it works for UI-only
 * transitions like Main Menu -> Character Select, not just in-canvas
 * ones) — this hook is what actually calls .update() every frame via
 * requestAnimationFrame, since nothing else in the app drives it.
 */
export function useTransitionDriver(): TransitionState {
  const { transitionManager } = useGameFramework();
  const [state, setState] = useState<TransitionState>({
    phase: transitionManager.getPhase(),
    opacity: transitionManager.getScreenOpacity(),
  });
  const lastTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    let frameId: number;

    const tick = (timestamp: number) => {
      const lastTimestamp = lastTimestampRef.current ?? timestamp;
      const deltaSeconds = Math.min((timestamp - lastTimestamp) / 1000, 1 / 15);
      lastTimestampRef.current = timestamp;

      transitionManager.update(deltaSeconds);
      setState({
        phase: transitionManager.getPhase(),
        opacity: transitionManager.getScreenOpacity(),
      });

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [transitionManager]);

  return state;
}

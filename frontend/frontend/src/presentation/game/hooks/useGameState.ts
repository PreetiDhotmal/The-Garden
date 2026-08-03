import { useEffect, useState } from "react";
import type { GameState } from "@/domain/game/GameState";
import { useGameFramework } from "./useGameFramework";

export function useGameState(): GameState {
  const { gameStateMachine, eventBus } = useGameFramework();
  const [state, setState] = useState(gameStateMachine.current());

  useEffect(() => {
    return eventBus.on("game:state-changed", () => {
      setState(gameStateMachine.current());
    });
  }, [gameStateMachine, eventBus]);

  return state;
}

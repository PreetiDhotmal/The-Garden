import type { GameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import {
  GameState,
  InvalidGameStateTransitionError,
  isValidGameStateTransition,
} from "./GameState";

/**
 * The single authority for "what meta-state is the game in and can it
 * change." No other system should track its own isPaused/isLoading/
 * isPlaying booleans that duplicate what this class already knows —
 * they should read GameStateMachine.current() instead.
 */
export class GameStateMachine {
  private state: GameState = GameState.GAME_BOOT;

  constructor(private readonly eventBus: GameplayEventBus) {}

  current(): GameState {
    return this.state;
  }

  canTransitionTo(next: GameState): boolean {
    return isValidGameStateTransition(this.state, next);
  }

  transitionTo(next: GameState): void {
    if (!this.canTransitionTo(next)) {
      throw new InvalidGameStateTransitionError(this.state, next);
    }
    const from = this.state;
    this.state = next;
    this.eventBus.emit("game:state-changed", { from, to: next });
  }

  is(...states: readonly GameState[]): boolean {
    return states.includes(this.state);
  }
}

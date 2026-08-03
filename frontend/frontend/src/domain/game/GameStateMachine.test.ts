import { describe, expect, it, vi } from "vitest";
import { createGameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import { GameState, InvalidGameStateTransitionError } from "./GameState";
import { GameStateMachine } from "./GameStateMachine";

describe("GameStateMachine", () => {
  it("starts in GAME_BOOT", () => {
    const machine = new GameStateMachine(createGameplayEventBus());
    expect(machine.current()).toBe(GameState.GAME_BOOT);
  });

  it("transitions successfully along a valid path", () => {
    const machine = new GameStateMachine(createGameplayEventBus());
    machine.transitionTo(GameState.LOADING);
    machine.transitionTo(GameState.MAIN_MENU);
    expect(machine.current()).toBe(GameState.MAIN_MENU);
  });

  it("throws InvalidGameStateTransitionError on an invalid transition", () => {
    const machine = new GameStateMachine(createGameplayEventBus());
    expect(() => {
      machine.transitionTo(GameState.PLAYING);
    }).toThrow(InvalidGameStateTransitionError);
  });

  it("does not change state when a transition is rejected", () => {
    const machine = new GameStateMachine(createGameplayEventBus());
    try {
      machine.transitionTo(GameState.PLAYING);
    } catch {
      // Expected.
    }
    expect(machine.current()).toBe(GameState.GAME_BOOT);
  });

  it("emits game:state-changed on every successful transition", () => {
    const eventBus = createGameplayEventBus();
    const listener = vi.fn();
    eventBus.on("game:state-changed", listener);
    const machine = new GameStateMachine(eventBus);

    machine.transitionTo(GameState.LOADING);

    expect(listener).toHaveBeenCalledWith({ from: GameState.GAME_BOOT, to: GameState.LOADING });
  });

  it("does not emit on a rejected transition", () => {
    const eventBus = createGameplayEventBus();
    const listener = vi.fn();
    eventBus.on("game:state-changed", listener);
    const machine = new GameStateMachine(eventBus);

    try {
      machine.transitionTo(GameState.PLAYING);
    } catch {
      // Expected.
    }

    expect(listener).not.toHaveBeenCalled();
  });

  it("canTransitionTo reports validity without mutating state", () => {
    const machine = new GameStateMachine(createGameplayEventBus());
    expect(machine.canTransitionTo(GameState.LOADING)).toBe(true);
    expect(machine.canTransitionTo(GameState.PLAYING)).toBe(false);
    expect(machine.current()).toBe(GameState.GAME_BOOT);
  });

  it("is() checks membership against the current state", () => {
    const machine = new GameStateMachine(createGameplayEventBus());
    expect(machine.is(GameState.GAME_BOOT, GameState.LOADING)).toBe(true);
    expect(machine.is(GameState.PLAYING)).toBe(false);
  });
});

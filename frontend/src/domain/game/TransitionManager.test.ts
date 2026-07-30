import { describe, expect, it, vi } from "vitest";
import { createGameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import { TransitionManager } from "./TransitionManager";

describe("TransitionManager", () => {
  it("starts IDLE with zero screen opacity", () => {
    const manager = new TransitionManager(createGameplayEventBus());
    expect(manager.getPhase()).toBe("IDLE");
    expect(manager.getScreenOpacity()).toBe(0);
  });

  it("beginTransition moves to FADING_OUT", () => {
    const manager = new TransitionManager(createGameplayEventBus());
    manager.beginTransition();
    expect(manager.getPhase()).toBe("FADING_OUT");
  });

  it("screen opacity increases toward 1 while fading out", () => {
    const manager = new TransitionManager(createGameplayEventBus(), 1);
    manager.beginTransition();
    manager.update(0.5);
    expect(manager.getScreenOpacity()).toBeCloseTo(0.5);
  });

  it("automatically advances from FADING_OUT to LOADING once the fade completes", () => {
    const manager = new TransitionManager(createGameplayEventBus(), 1);
    manager.beginTransition();
    manager.update(1);
    expect(manager.getPhase()).toBe("LOADING");
    expect(manager.getScreenOpacity()).toBe(1);
  });

  it("stays in LOADING indefinitely until markLoadingComplete is called — no fixed timeout guess", () => {
    const manager = new TransitionManager(createGameplayEventBus(), 1);
    manager.beginTransition();
    manager.update(1);
    manager.update(100);
    expect(manager.getPhase()).toBe("LOADING");
  });

  it("markLoadingComplete advances LOADING to FADING_IN", () => {
    const manager = new TransitionManager(createGameplayEventBus(), 1);
    manager.beginTransition();
    manager.update(1);
    manager.markLoadingComplete();
    expect(manager.getPhase()).toBe("FADING_IN");
  });

  it("markLoadingComplete is a no-op outside of LOADING", () => {
    const manager = new TransitionManager(createGameplayEventBus());
    manager.markLoadingComplete();
    expect(manager.getPhase()).toBe("IDLE");
  });

  it("screen opacity decreases toward 0 while fading in", () => {
    const manager = new TransitionManager(createGameplayEventBus(), 1);
    manager.beginTransition();
    manager.update(1);
    manager.markLoadingComplete();
    manager.update(0.5);
    expect(manager.getScreenOpacity()).toBeCloseTo(0.5);
  });

  it("returns to IDLE once fade-in completes", () => {
    const manager = new TransitionManager(createGameplayEventBus(), 1);
    manager.beginTransition();
    manager.update(1);
    manager.markLoadingComplete();
    manager.update(1);
    expect(manager.getPhase()).toBe("IDLE");
    expect(manager.getScreenOpacity()).toBe(0);
  });

  it("emits transition:phase-changed on every phase transition", () => {
    const eventBus = createGameplayEventBus();
    const listener = vi.fn();
    eventBus.on("transition:phase-changed", listener);
    const manager = new TransitionManager(eventBus, 1);

    manager.beginTransition();
    manager.update(1);
    manager.markLoadingComplete();
    manager.update(1);

    expect(listener).toHaveBeenNthCalledWith(1, { phase: "FADING_OUT" });
    expect(listener).toHaveBeenNthCalledWith(2, { phase: "LOADING" });
    expect(listener).toHaveBeenNthCalledWith(3, { phase: "FADING_IN" });
    expect(listener).toHaveBeenNthCalledWith(4, { phase: "IDLE" });
  });

  it("update() is a harmless no-op before beginTransition is ever called", () => {
    const manager = new TransitionManager(createGameplayEventBus());
    expect(() => {
      manager.update(1);
    }).not.toThrow();
    expect(manager.getPhase()).toBe("IDLE");
  });
});

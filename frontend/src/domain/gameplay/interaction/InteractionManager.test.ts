import { describe, expect, it, vi } from "vitest";
import { createGameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import { InteractionManager } from "./InteractionManager";
import {
  InteractionPriority,
  InteractionState,
  InteractionTrigger,
  InteractionType,
} from "./InteractionTypes";
import type { InteractionTarget } from "./InteractionTarget";

function buildTarget(overrides: Partial<InteractionTarget> = {}): InteractionTarget {
  return {
    id: overrides.id ?? "target-1",
    type: overrides.type ?? InteractionType.PROXIMITY,
    priority: overrides.priority ?? InteractionPriority.NORMAL,
    trigger: overrides.trigger ?? InteractionTrigger.PRESS,
    interactionRadius: overrides.interactionRadius ?? 2,
    holdDurationSeconds: overrides.holdDurationSeconds ?? 0,
    promptText: overrides.promptText ?? "Interact",
    getPosition: overrides.getPosition ?? (() => ({ x: 0, y: 0, z: 0 })),
    canInteract: overrides.canInteract ?? (() => true),
    onInteract: overrides.onInteract ?? vi.fn(),
  };
}

describe("InteractionManager", () => {
  it("focuses a target within range", () => {
    const manager = new InteractionManager(createGameplayEventBus());
    manager.register(buildTarget({ id: "well" }));

    manager.updateProximityFocus({ x: 1, y: 0, z: 0 });

    expect(manager.getFocusedTargetId()).toBe("well");
  });

  it("does not focus a target out of range", () => {
    const manager = new InteractionManager(createGameplayEventBus());
    manager.register(buildTarget({ id: "well", interactionRadius: 2 }));

    manager.updateProximityFocus({ x: 10, y: 0, z: 0 });

    expect(manager.getFocusedTargetId()).toBeNull();
  });

  it("focuses the nearest target when multiple are in range", () => {
    const manager = new InteractionManager(createGameplayEventBus());
    manager.register(
      buildTarget({ id: "far", interactionRadius: 20, getPosition: () => ({ x: 5, y: 0, z: 0 }) })
    );
    manager.register(
      buildTarget({ id: "near", interactionRadius: 20, getPosition: () => ({ x: 1, y: 0, z: 0 }) })
    );

    manager.updateProximityFocus({ x: 0, y: 0, z: 0 });

    expect(manager.getFocusedTargetId()).toBe("near");
  });

  it("breaks distance ties by priority", () => {
    const manager = new InteractionManager(createGameplayEventBus());
    manager.register(
      buildTarget({
        id: "low",
        priority: InteractionPriority.LOW,
        getPosition: () => ({ x: 1, y: 0, z: 0 }),
      })
    );
    manager.register(
      buildTarget({
        id: "high",
        priority: InteractionPriority.HIGH,
        getPosition: () => ({ x: -1, y: 0, z: 0 }),
      })
    );

    manager.updateProximityFocus({ x: 0, y: 0, z: 0 });

    expect(manager.getFocusedTargetId()).toBe("high");
  });

  it("ignores a target that reports canInteract() false", () => {
    const manager = new InteractionManager(createGameplayEventBus());
    manager.register(buildTarget({ id: "locked", canInteract: () => false }));

    manager.updateProximityFocus({ x: 0, y: 0, z: 0 });

    expect(manager.getFocusedTargetId()).toBeNull();
  });

  it("emits entered-range and exited-range events on focus changes", () => {
    const eventBus = createGameplayEventBus();
    const manager = new InteractionManager(eventBus);
    manager.register(buildTarget({ id: "well", interactionRadius: 2 }));
    const entered = vi.fn();
    const exited = vi.fn();
    eventBus.on("interaction:entered-range", entered);
    eventBus.on("interaction:exited-range", exited);

    manager.updateProximityFocus({ x: 1, y: 0, z: 0 });
    manager.updateProximityFocus({ x: 100, y: 0, z: 0 });

    expect(entered).toHaveBeenCalledWith({ targetId: "well" });
    expect(exited).toHaveBeenCalledWith({ targetId: "well" });
  });

  it("fires a PRESS-trigger target immediately", () => {
    const onInteract = vi.fn();
    const manager = new InteractionManager(createGameplayEventBus());
    manager.register(buildTarget({ id: "well", onInteract }));
    manager.updateProximityFocus({ x: 0, y: 0, z: 0 });

    const state = manager.handlePressStart(0);

    expect(state).toBe(InteractionState.COMPLETED);
    expect(onInteract).toHaveBeenCalledTimes(1);
  });

  it("respects cooldown on repeated PRESS triggers", () => {
    const onInteract = vi.fn();
    const manager = new InteractionManager(createGameplayEventBus());
    manager.register(buildTarget({ id: "well", onInteract }));
    manager.updateProximityFocus({ x: 0, y: 0, z: 0 });

    manager.handlePressStart(0);
    const secondState = manager.handlePressStart(0.1);

    expect(onInteract).toHaveBeenCalledTimes(1);
    expect(secondState).toBe(InteractionState.FOCUSED);
  });

  it("requires holding for the configured duration on HOLD-trigger targets", () => {
    const onInteract = vi.fn();
    const manager = new InteractionManager(createGameplayEventBus());
    manager.register(
      buildTarget({ id: "gate", trigger: InteractionTrigger.HOLD, holdDurationSeconds: 1, onInteract })
    );
    manager.updateProximityFocus({ x: 0, y: 0, z: 0 });

    manager.handlePressStart(0);
    expect(manager.updateHold(0.5, 0.5)).toBe(InteractionState.IN_PROGRESS);
    expect(onInteract).not.toHaveBeenCalled();

    expect(manager.updateHold(0.5, 1)).toBe(InteractionState.COMPLETED);
    expect(onInteract).toHaveBeenCalledTimes(1);
  });

  it("reports hold progress as a 0-1 fraction", () => {
    const manager = new InteractionManager(createGameplayEventBus());
    manager.register(buildTarget({ id: "gate", trigger: InteractionTrigger.HOLD, holdDurationSeconds: 2 }));
    manager.updateProximityFocus({ x: 0, y: 0, z: 0 });

    manager.handlePressStart(0);
    manager.updateHold(1, 1);

    expect(manager.getHoldProgress()).toBeCloseTo(0.5, 5);
  });

  it("throws when registering a duplicate target id", () => {
    const manager = new InteractionManager(createGameplayEventBus());
    manager.register(buildTarget({ id: "well" }));
    expect(() => {
      manager.register(buildTarget({ id: "well" }));
    }).toThrow();
  });
});

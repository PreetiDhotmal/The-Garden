import { describe, expect, it, vi } from "vitest";
import { SceneTransitionController } from "./SceneTransitionController";

describe("SceneTransitionController", () => {
  it("is idle with zero opacity before start()", () => {
    const controller = new SceneTransitionController(1);
    expect(controller.snapshot()).toEqual({ phase: "idle", opacity: 0 });
    expect(controller.isTransitioning()).toBe(false);
  });

  it("fades out to full opacity, calls onMidpoint, then fades back in", () => {
    const controller = new SceneTransitionController(1);
    const onMidpoint = vi.fn();
    controller.start(onMidpoint);

    let snapshot = controller.tick(0.5);
    expect(snapshot.phase).toBe("fading-out");
    expect(snapshot.opacity).toBeCloseTo(0.5, 5);
    expect(onMidpoint).not.toHaveBeenCalled();

    snapshot = controller.tick(0.5);
    expect(snapshot.opacity).toBeCloseTo(1, 5);
    expect(snapshot.phase).toBe("fading-in");
    expect(onMidpoint).toHaveBeenCalledTimes(1);

    snapshot = controller.tick(0.5);
    expect(snapshot.opacity).toBeCloseTo(0.5, 5);

    snapshot = controller.tick(0.5);
    expect(snapshot.phase).toBe("idle");
    expect(snapshot.opacity).toBe(0);
  });

  it("calls onMidpoint exactly once even if progress overshoots 1", () => {
    const controller = new SceneTransitionController(1);
    const onMidpoint = vi.fn();
    controller.start(onMidpoint);

    controller.tick(5);

    expect(onMidpoint).toHaveBeenCalledTimes(1);
  });

  it("ticking while idle is a no-op", () => {
    const controller = new SceneTransitionController(1);
    const snapshot = controller.tick(1);
    expect(snapshot).toEqual({ phase: "idle", opacity: 0 });
  });

  it("rejects a non-positive fade duration", () => {
    expect(() => new SceneTransitionController(0)).toThrow(RangeError);
  });

  it("reports isTransitioning() true during both fade phases", () => {
    const controller = new SceneTransitionController(1);
    controller.start(() => {});

    controller.tick(0.5);
    expect(controller.isTransitioning()).toBe(true);

    controller.tick(0.5); // now fading-in
    expect(controller.isTransitioning()).toBe(true);

    controller.tick(1);
    expect(controller.isTransitioning()).toBe(false);
  });
});

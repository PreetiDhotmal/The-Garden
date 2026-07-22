import { describe, expect, it } from "vitest";
import { createAnimationClipDescriptor } from "./AnimationClipDescriptor";
import { AnimationClipRegistry, UnknownAnimationClipError } from "./AnimationClipRegistry";

describe("AnimationClipRegistry", () => {
  it("registers clips and retrieves them by their actual name", () => {
    const registry = new AnimationClipRegistry();
    registry.registerAll([createAnimationClipDescriptor("NlaTrack", 17.08, 123)]);

    expect(registry.has("NlaTrack")).toBe(true);
    expect(registry.get("NlaTrack").durationSeconds).toBeCloseTo(17.08, 2);
  });

  it("throws with the list of available clips when looking up an unknown name", () => {
    const registry = new AnimationClipRegistry();
    registry.registerAll([createAnimationClipDescriptor("NlaTrack", 1, 1)]);

    expect(() => registry.get("Idle")).toThrow(UnknownAnimationClipError);
  });

  it("lists all registered clip names", () => {
    const registry = new AnimationClipRegistry();
    registry.registerAll([
      createAnimationClipDescriptor("NlaTrack", 1, 1),
      createAnimationClipDescriptor("NlaTrack.001", 2, 1),
    ]);

    expect(registry.listNames()).toEqual(["NlaTrack", "NlaTrack.001"]);
    expect(registry.size()).toBe(2);
  });
});

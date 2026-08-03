import { describe, expect, it } from "vitest";
import { AnimationClip, NumberKeyframeTrack, Object3D } from "three";
import { CharacterAnimationController } from "./CharacterAnimationController";
import { AnimationRole } from "@/domain/character/animation/AnimationRole";
import { createCharacterAnimationConfig } from "@/domain/character/animation/CharacterAnimationConfig";
import { AnimationClipRegistry } from "@/domain/character/animation/AnimationClipRegistry";
import { createAnimationClipDescriptor } from "@/domain/character/animation/AnimationClipDescriptor";

function fakeClip(name: string, duration = 1): AnimationClip {
  // A single-track clip is enough for AnimationMixer.clipAction() to
  // work correctly without needing a real skeleton or WebGL context.
  const track = new NumberKeyframeTrack(".rotation[x]", [0, duration], [0, 1]);
  return new AnimationClip(name, duration, [track]);
}

function buildController(
  clipNames: readonly string[],
  mappings: readonly { role: AnimationRole; clipName: string }[]
) {
  const root = new Object3D();
  const clips = clipNames.map((name) => fakeClip(name));
  const registry = new AnimationClipRegistry();
  registry.registerAll(clipNames.map((name) => createAnimationClipDescriptor(name, 1, 1)));
  const config = createCharacterAnimationConfig(
    { id: "test-config", characterModelAssetId: "test-model", mappings },
    registry
  );
  return new CharacterAnimationController(root, clips, config);
}

describe("CharacterAnimationController", () => {
  it("plays the clip mapped to a role", () => {
    const controller = buildController(
      ["NlaTrack.004"],
      [{ role: AnimationRole.IDLE, clipName: "NlaTrack.004" }]
    );
    controller.playRole(AnimationRole.IDLE);
    controller.update(0);
    expect(controller.getCurrentClipName()).toBe("NlaTrack.004");
  });

  it("falls back to IDLE's clip when a role has no mapping at all", () => {
    const controller = buildController(
      ["NlaTrack.004"],
      [{ role: AnimationRole.IDLE, clipName: "NlaTrack.004" }]
      // FALL is intentionally unmapped.
    );
    controller.playRole(AnimationRole.FALL);
    controller.update(0);
    expect(controller.getCurrentClipName()).toBe("NlaTrack.004");
  });

  it("never leaves no action active — some clip is always playing after any playRole call", () => {
    const controller = buildController(
      ["NlaTrack.004"],
      [{ role: AnimationRole.IDLE, clipName: "NlaTrack.004" }]
    );
    controller.playRole(AnimationRole.SPRINT);
    controller.update(0);
    expect(controller.getCurrentClipName()).not.toBeNull();
  });

  it("caches the fallback so repeated calls for the same unmapped role don't re-resolve", () => {
    const controller = buildController(
      ["NlaTrack.004"],
      [{ role: AnimationRole.IDLE, clipName: "NlaTrack.004" }]
    );
    controller.playRole(AnimationRole.TURN_LEFT);
    controller.update(0);
    const firstClip = controller.getCurrentClipName();
    controller.playRole(AnimationRole.IDLE);
    controller.playRole(AnimationRole.TURN_LEFT);
    controller.update(0);
    expect(controller.getCurrentClipName()).toBe(firstClip);
  });

  describe("the T-pose bug: playRole's fadeIn leaves weight at 0 when update() is called with zero delta", () => {
    it("REPRODUCES THE BUG: playRole() + update(0) — the exact sequence the old spawn code used — leaves the action's effective weight at 0", () => {
      const controller = buildController(
        ["NlaTrack.004"],
        [{ role: AnimationRole.IDLE, clipName: "NlaTrack.004" }]
      );
      controller.playRole(AnimationRole.IDLE);
      controller.update(0);
      // getCurrentClipName() correctly reports IDLE's clip as
      // "active" — this is exactly why the earlier test suite's
      // reliance on getCurrentClipName() alone gave false confidence:
      // the clip is assigned, but contributes nothing to the visible
      // pose at weight 0. A skeleton with only a weight-0 action ever
      // applied to it has never actually been posed — it remains at
      // bind pose (T-pose), which getCurrentClipName() cannot detect.
      expect(controller.getCurrentClipName()).toBe("NlaTrack.004");
      expect(controller.getActiveActionWeight()).toBe(0);
    });

    it("PROVES THE FIX: forcePose() applies full weight immediately, with zero elapsed time", () => {
      const controller = buildController(
        ["NlaTrack.004"],
        [{ role: AnimationRole.IDLE, clipName: "NlaTrack.004" }]
      );
      controller.forcePose(AnimationRole.IDLE);
      expect(controller.getCurrentClipName()).toBe("NlaTrack.004");
      expect(controller.getActiveActionWeight()).toBe(1);
    });

    it("forcePose still resolves through the same fallback chain as playRole for an unmapped role", () => {
      const controller = buildController(
        ["NlaTrack.004"],
        [{ role: AnimationRole.IDLE, clipName: "NlaTrack.004" }]
        // FALL is intentionally unmapped.
      );
      controller.forcePose(AnimationRole.FALL);
      expect(controller.getCurrentClipName()).toBe("NlaTrack.004");
      expect(controller.getActiveActionWeight()).toBe(1);
    });
  });

  describe("the '_cacheIndex' crash: reusing a controller instance after dispose()", () => {
    it("REPRODUCES REACT STRICT MODE'S EXACT SEQUENCE: forcePose (mount) -> dispose (cleanup) -> forcePose again (re-mount) on the SAME instance must not throw", () => {
      const controller = buildController(
        ["NlaTrack.004"],
        [{ role: AnimationRole.IDLE, clipName: "NlaTrack.004" }]
      );
      // First mount.
      controller.forcePose(AnimationRole.IDLE);
      expect(controller.getActiveActionWeight()).toBe(1);

      // Strict Mode's immediate development-only cleanup pass.
      controller.dispose();

      // Re-mount — the exact same controller instance, since useMemo's
      // dependencies didn't change between the two Strict Mode render
      // passes. Before the fix, this line threw:
      // "Cannot set properties of undefined (setting '_cacheIndex')".
      expect(() => {
        controller.forcePose(AnimationRole.IDLE);
      }).not.toThrow();

      // Not just "didn't throw" — genuinely re-posed at full weight,
      // exactly as if this were a fresh controller.
      expect(controller.getCurrentClipName()).toBe("NlaTrack.004");
      expect(controller.getActiveActionWeight()).toBe(1);
    });

    it("also does not throw when playRole() (not forcePose) is called after dispose() on the same instance", () => {
      const controller = buildController(
        ["NlaTrack.004"],
        [{ role: AnimationRole.IDLE, clipName: "NlaTrack.004" }]
      );
      controller.forcePose(AnimationRole.IDLE);
      controller.dispose();

      expect(() => {
        controller.playRole(AnimationRole.IDLE);
        controller.update(0);
      }).not.toThrow();
      expect(controller.getCurrentClipName()).toBe("NlaTrack.004");
    });

    it("dispose() resets activeAction and both action caches, not just the mixer", () => {
      const controller = buildController(
        ["NlaTrack.004"],
        [{ role: AnimationRole.IDLE, clipName: "NlaTrack.004" }]
      );
      controller.forcePose(AnimationRole.IDLE);
      expect(controller.getCurrentClipName()).not.toBeNull();

      controller.dispose();

      // Immediately after dispose, before anything is played again,
      // there is genuinely no active action — not a stale reference.
      expect(controller.getCurrentClipName()).toBeNull();
      expect(controller.getActiveActionWeight()).toBeNull();
    });
  });
});

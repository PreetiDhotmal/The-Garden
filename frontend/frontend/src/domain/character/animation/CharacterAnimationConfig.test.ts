import { describe, expect, it } from "vitest";
import { createAnimationClipDescriptor } from "./AnimationClipDescriptor";
import { AnimationClipRegistry } from "./AnimationClipRegistry";
import { AnimationRole } from "./AnimationRole";
import {
  createCharacterAnimationConfig,
  getRoleMapping,
  InvalidAnimationConfigError,
} from "./CharacterAnimationConfig";

function buildRegistry(): AnimationClipRegistry {
  const registry = new AnimationClipRegistry();
  registry.registerAll([
    createAnimationClipDescriptor("NlaTrack.002", 1.29, 20),
    createAnimationClipDescriptor("NlaTrack.003", 2.25, 20),
  ]);
  return registry;
}

describe("createCharacterAnimationConfig", () => {
  it("builds a valid config when every referenced clip exists", () => {
    const config = createCharacterAnimationConfig(
      {
        id: "boy-anim-config",
        characterModelAssetId: "models:boy",
        mappings: [
          { role: AnimationRole.JUMP, clipName: "NlaTrack.002" },
          { role: AnimationRole.LAND, clipName: "NlaTrack.003" },
        ],
      },
      buildRegistry()
    );

    expect(getRoleMapping(config, AnimationRole.JUMP)?.clipName).toBe("NlaTrack.002");
  });

  it("applies the default looping heuristic for known continuous roles", () => {
    const config = createCharacterAnimationConfig(
      {
        id: "boy-anim-config",
        characterModelAssetId: "models:boy",
        mappings: [{ role: AnimationRole.JUMP, clipName: "NlaTrack.002" }],
      },
      buildRegistry()
    );

    // JUMP is a one-shot by default (not in DEFAULT_LOOPING_ROLES).
    expect(getRoleMapping(config, AnimationRole.JUMP)?.loop).toBe(false);
  });

  it("rejects a mapping referencing a clip that does not exist on the model", () => {
    expect(() =>
      createCharacterAnimationConfig(
        {
          id: "boy-anim-config",
          characterModelAssetId: "models:boy",
          mappings: [{ role: AnimationRole.IDLE, clipName: "Idle" }],
        },
        buildRegistry()
      )
    ).toThrow(InvalidAnimationConfigError);
  });

  it("rejects an empty mapping list", () => {
    expect(() =>
      createCharacterAnimationConfig(
        { id: "boy-anim-config", characterModelAssetId: "models:boy", mappings: [] },
        buildRegistry()
      )
    ).toThrow(InvalidAnimationConfigError);
  });

  it("returns undefined for a role with no mapping", () => {
    const config = createCharacterAnimationConfig(
      {
        id: "boy-anim-config",
        characterModelAssetId: "models:boy",
        mappings: [{ role: AnimationRole.JUMP, clipName: "NlaTrack.002" }],
      },
      buildRegistry()
    );

    expect(getRoleMapping(config, AnimationRole.WALK)).toBeUndefined();
  });
});

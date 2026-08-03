import { describe, expect, it } from "vitest";
import { CharacterType } from "@/domain/character/CharacterType";
import { createCharacterConfig, InvalidCharacterConfigError } from "./CharacterConfig";

describe("createCharacterConfig", () => {
  it("applies sensible defaults", () => {
    const config = createCharacterConfig({
      id: "traveler",
      modelAssetId: "models:traveler",
      animationConfigId: "anim:traveler",
    });
    expect(config.type).toBe(CharacterType.NPC);
    expect(config.capsuleRadius).toBe(0.3);
    expect(config.capsuleHeight).toBe(1.8);
    expect(config.movementTuning.walkSpeed).toBeGreaterThan(0);
  });

  it("accepts an explicit character type and movement tuning overrides", () => {
    const config = createCharacterConfig({
      id: "boy",
      type: CharacterType.PLAYER,
      modelAssetId: "models:boy",
      animationConfigId: "anim:boy",
      movementTuning: { sprintSpeed: 9 },
    });
    expect(config.type).toBe(CharacterType.PLAYER);
    expect(config.movementTuning.sprintSpeed).toBe(9);
  });

  it("rejects an empty animationConfigId", () => {
    expect(() =>
      createCharacterConfig({ id: "boy", modelAssetId: "models:boy", animationConfigId: " " })
    ).toThrow(InvalidCharacterConfigError);
  });

  it("rejects a capsule height not exceeding its own diameter", () => {
    expect(() =>
      createCharacterConfig({
        id: "boy",
        modelAssetId: "models:boy",
        animationConfigId: "anim:boy",
        capsuleRadius: 1,
        capsuleHeight: 1.5,
      })
    ).toThrow(InvalidCharacterConfigError);
  });

  it("rejects an empty modelAssetId", () => {
    expect(() =>
      createCharacterConfig({ id: "boy", modelAssetId: " ", animationConfigId: "anim:boy" })
    ).toThrow(InvalidCharacterConfigError);
  });
});

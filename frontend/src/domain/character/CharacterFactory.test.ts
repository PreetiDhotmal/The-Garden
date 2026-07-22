import { beforeEach, describe, expect, it } from "vitest";
import { createCharacterConfig } from "@/domain/engine/config/CharacterConfig";
import { CharacterType } from "./CharacterType";
import { createSpawnPoint } from "./CharacterSpawnPoint";
import { CharacterFactory, resetCharacterInstanceSequence } from "./CharacterFactory";
import { CharacterRegistry, UnknownCharacterInstanceError } from "./CharacterRegistry";

function buildConfig(id = "boy") {
  return createCharacterConfig({
    id,
    type: CharacterType.PLAYER,
    modelAssetId: `models:${id}`,
    animationConfigId: `anim:${id}`,
  });
}

describe("CharacterFactory", () => {
  beforeEach(() => {
    resetCharacterInstanceSequence();
  });

  it("spawns a character at the spawn point's position and facing", () => {
    const factory = new CharacterFactory();
    const spawnPoint = createSpawnPoint({ id: "start", position: { x: 1, y: 0, z: 2 }, facingYaw: 1.5 });

    const character = factory.spawn(buildConfig(), spawnPoint);

    expect(character.getPosition()).toEqual({ x: 1, y: 0, z: 2 });
    expect(character.getYaw()).toBe(1.5);
    expect(character.isAlive()).toBe(true);
  });

  it("generates unique, deterministic instance ids per spawn", () => {
    const factory = new CharacterFactory();
    const spawnPoint = createSpawnPoint({ id: "start", position: { x: 0, y: 0, z: 0 } });

    const first = factory.spawn(buildConfig(), spawnPoint);
    const second = factory.spawn(buildConfig(), spawnPoint);

    expect(first.instanceId).toBe("boy#1");
    expect(second.instanceId).toBe("boy#2");
  });

  it("applies stat overrides when provided", () => {
    const factory = new CharacterFactory();
    const spawnPoint = createSpawnPoint({ id: "start", position: { x: 0, y: 0, z: 0 } });

    const character = factory.spawn(buildConfig(), spawnPoint, {
      statsOverrides: { maxHealth: 50 },
    });

    expect(character.getStats().maxHealth).toBe(50);
  });
});

describe("CharacterRegistry", () => {
  beforeEach(() => {
    resetCharacterInstanceSequence();
  });

  it("registers and retrieves a character by instance id", () => {
    const factory = new CharacterFactory();
    const registry = new CharacterRegistry();
    const spawnPoint = createSpawnPoint({ id: "start", position: { x: 0, y: 0, z: 0 } });
    const character = factory.spawn(buildConfig(), spawnPoint);

    registry.register(character);

    expect(registry.get(character.instanceId)).toBe(character);
  });

  it("throws when getting an unregistered instance id", () => {
    const registry = new CharacterRegistry();
    expect(() => registry.get("missing#1")).toThrow(UnknownCharacterInstanceError);
  });

  it("filters characters by type", () => {
    const factory = new CharacterFactory();
    const registry = new CharacterRegistry();
    const spawnPoint = createSpawnPoint({ id: "start", position: { x: 0, y: 0, z: 0 } });

    registry.register(factory.spawn(buildConfig("boy"), spawnPoint));
    registry.register(
      factory.spawn(
        createCharacterConfig({
          id: "villager",
          type: CharacterType.NPC,
          modelAssetId: "models:villager",
          animationConfigId: "anim:villager",
        }),
        spawnPoint
      )
    );

    expect(registry.listByType(CharacterType.PLAYER)).toHaveLength(1);
    expect(registry.listByType(CharacterType.NPC)).toHaveLength(1);
  });

  it("unregisters a character", () => {
    const factory = new CharacterFactory();
    const registry = new CharacterRegistry();
    const spawnPoint = createSpawnPoint({ id: "start", position: { x: 0, y: 0, z: 0 } });
    const character = factory.spawn(buildConfig(), spawnPoint);
    registry.register(character);

    registry.unregister(character.instanceId);

    expect(registry.has(character.instanceId)).toBe(false);
  });
});

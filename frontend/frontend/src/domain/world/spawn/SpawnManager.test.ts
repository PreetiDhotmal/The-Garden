import { describe, expect, it } from "vitest";
import { createSpawnPoint } from "@/domain/character/CharacterSpawnPoint";
import { NoDefaultSpawnPointError, SpawnManager, UnknownSpawnPointError } from "./SpawnManager";

describe("SpawnManager", () => {
  it("resolves the default spawn point when none is preferred", () => {
    const manager = new SpawnManager();
    manager.register(createSpawnPoint({ id: "main", position: { x: 0, y: 0, z: 0 } }));

    expect(manager.resolveSpawnPoint().id).toBe("main");
  });

  it("the first registered spawn point becomes the default automatically", () => {
    const manager = new SpawnManager();
    manager.register(createSpawnPoint({ id: "first", position: { x: 0, y: 0, z: 0 } }));
    manager.register(createSpawnPoint({ id: "second", position: { x: 1, y: 0, z: 0 } }));

    expect(manager.resolveSpawnPoint().id).toBe("first");
  });

  it("resolves a preferred spawn point when given and registered", () => {
    const manager = new SpawnManager();
    manager.register(createSpawnPoint({ id: "main", position: { x: 0, y: 0, z: 0 } }));
    manager.register(createSpawnPoint({ id: "checkpoint-1", position: { x: 5, y: 0, z: 5 } }));

    expect(manager.resolveSpawnPoint("checkpoint-1").id).toBe("checkpoint-1");
  });

  it("falls back to default when the preferred id is not registered", () => {
    const manager = new SpawnManager();
    manager.register(createSpawnPoint({ id: "main", position: { x: 0, y: 0, z: 0 } }));

    expect(manager.resolveSpawnPoint("missing").id).toBe("main");
  });

  it("an explicit isDefault registration overrides the first-registered default", () => {
    const manager = new SpawnManager();
    manager.register(createSpawnPoint({ id: "first", position: { x: 0, y: 0, z: 0 } }));
    manager.register(
      createSpawnPoint({ id: "preferred-default", position: { x: 1, y: 0, z: 0 } }),
      true
    );

    expect(manager.resolveSpawnPoint().id).toBe("preferred-default");
  });

  it("throws when no spawn points have been registered at all", () => {
    const manager = new SpawnManager();
    expect(() => manager.resolveSpawnPoint()).toThrow(NoDefaultSpawnPointError);
  });

  it("throws when getting an unregistered spawn point id", () => {
    const manager = new SpawnManager();
    expect(() => manager.get("missing")).toThrow(UnknownSpawnPointError);
  });
});

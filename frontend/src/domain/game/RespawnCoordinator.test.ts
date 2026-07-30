import { describe, expect, it, vi } from "vitest";
import { createSpawnPoint } from "@/domain/character/CharacterSpawnPoint";
import { createGameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import { CheckpointManager } from "@/domain/world/checkpoint/CheckpointManager";
import { createWorldEventBus } from "@/domain/world/events/WorldEventBus";
import { SpawnManager } from "@/domain/world/spawn/SpawnManager";
import { RespawnCoordinator } from "./RespawnCoordinator";

function buildCoordinator() {
  const checkpointManager = new CheckpointManager(createWorldEventBus());
  const spawnManager = new SpawnManager();
  spawnManager.register(
    createSpawnPoint({ id: "spawn:level-entry", position: { x: 0, y: 0, z: 0 } }),
    true
  );
  spawnManager.register(
    createSpawnPoint({ id: "checkpoint:midpoint", position: { x: 10, y: 0, z: 5 } })
  );
  const gameplayEventBus = createGameplayEventBus();
  const coordinator = new RespawnCoordinator(checkpointManager, spawnManager, gameplayEventBus);
  return { coordinator, checkpointManager, spawnManager, gameplayEventBus };
}

describe("RespawnCoordinator", () => {
  it("resolves the default spawn point when no checkpoint has been reached yet", () => {
    const { coordinator } = buildCoordinator();
    expect(coordinator.resolveRespawnPoint().id).toBe("spawn:level-entry");
  });

  it("resolves the most recently reached checkpoint once one has been reached", () => {
    const { coordinator, checkpointManager } = buildCoordinator();
    checkpointManager.reach("checkpoint:midpoint");
    expect(coordinator.resolveRespawnPoint().id).toBe("checkpoint:midpoint");
  });

  it("both players resolve to the exact same respawn point — never separated", () => {
    const { coordinator, checkpointManager } = buildCoordinator();
    checkpointManager.reach("checkpoint:midpoint");
    const first = coordinator.resolveRespawnPoint();
    const second = coordinator.resolveRespawnPoint();
    expect(first.position).toEqual(second.position);
  });

  it("notifyRespawned emits player:respawned once per player id, both with the same checkpointId", () => {
    const { coordinator, checkpointManager, gameplayEventBus } = buildCoordinator();
    checkpointManager.reach("checkpoint:midpoint");
    const listener = vi.fn();
    gameplayEventBus.on("player:respawned", listener);

    coordinator.notifyRespawned(["player:boy", "player:girl"]);

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenCalledWith({
      playerId: "player:boy",
      checkpointId: "checkpoint:midpoint",
    });
    expect(listener).toHaveBeenCalledWith({
      playerId: "player:girl",
      checkpointId: "checkpoint:midpoint",
    });
  });

  it("notifyRespawned uses 'default' as the checkpointId when nothing has been reached yet", () => {
    const { coordinator, gameplayEventBus } = buildCoordinator();
    const listener = vi.fn();
    gameplayEventBus.on("player:respawned", listener);

    coordinator.notifyRespawned(["player:boy", "player:girl"]);

    expect(listener).toHaveBeenCalledWith({ playerId: "player:boy", checkpointId: "default" });
  });
});

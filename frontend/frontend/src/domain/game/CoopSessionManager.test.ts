import { describe, expect, it, vi } from "vitest";
import { createGameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import {
  CoopSessionManager,
  DuplicateCharacterSelectionError,
  SlotAlreadyOccupiedError,
} from "./CoopSessionManager";

describe("CoopSessionManager", () => {
  it("a fresh session is not ready", () => {
    const manager = new CoopSessionManager(createGameplayEventBus());
    expect(manager.isSessionReady()).toBe(false);
  });

  it("becomes ready once both slots are joined", () => {
    const manager = new CoopSessionManager(createGameplayEventBus());
    manager.join("PLAYER_ONE", "player:one", "boy");
    expect(manager.isSessionReady()).toBe(false);
    manager.join("PLAYER_TWO", "player:two", "girl");
    expect(manager.isSessionReady()).toBe(true);
  });

  it("throws SlotAlreadyOccupiedError joining an already-occupied slot", () => {
    const manager = new CoopSessionManager(createGameplayEventBus());
    manager.join("PLAYER_ONE", "player:one", "boy");
    expect(() => {
      manager.join("PLAYER_ONE", "player:other", "girl");
    }).toThrow(SlotAlreadyOccupiedError);
  });

  it("throws DuplicateCharacterSelectionError if both players pick the same character", () => {
    const manager = new CoopSessionManager(createGameplayEventBus());
    manager.join("PLAYER_ONE", "player:one", "boy");
    expect(() => {
      manager.join("PLAYER_TWO", "player:two", "boy");
    }).toThrow(DuplicateCharacterSelectionError);
  });

  it("emits coop:player-joined on a successful join", () => {
    const eventBus = createGameplayEventBus();
    const listener = vi.fn();
    eventBus.on("coop:player-joined", listener);
    const manager = new CoopSessionManager(eventBus);

    manager.join("PLAYER_ONE", "player:one", "boy");

    expect(listener).toHaveBeenCalledWith({ playerId: "player:one" });
  });

  it("leave() frees the slot and emits coop:player-left", () => {
    const eventBus = createGameplayEventBus();
    const listener = vi.fn();
    eventBus.on("coop:player-left", listener);
    const manager = new CoopSessionManager(eventBus);
    manager.join("PLAYER_ONE", "player:one", "boy");

    manager.leave("PLAYER_ONE");

    expect(listener).toHaveBeenCalledWith({ playerId: "player:one" });
    expect(manager.getMembership("PLAYER_ONE")).toBeNull();
    expect(manager.isSessionReady()).toBe(false);
  });

  it("leave() on an empty slot is a harmless no-op, does not emit", () => {
    const eventBus = createGameplayEventBus();
    const listener = vi.fn();
    eventBus.on("coop:player-left", listener);
    const manager = new CoopSessionManager(eventBus);

    manager.leave("PLAYER_ONE");

    expect(listener).not.toHaveBeenCalled();
  });

  it("a freed slot and character can be rejoined afterward", () => {
    const manager = new CoopSessionManager(createGameplayEventBus());
    manager.join("PLAYER_ONE", "player:one", "boy");
    manager.leave("PLAYER_ONE");
    expect(() => {
      manager.join("PLAYER_ONE", "player:one-again", "boy");
    }).not.toThrow();
  });

  it("listMembers reflects the current session state", () => {
    const manager = new CoopSessionManager(createGameplayEventBus());
    manager.join("PLAYER_ONE", "player:one", "boy");
    manager.join("PLAYER_TWO", "player:two", "girl");
    expect(manager.listMembers()).toHaveLength(2);
  });

  it("getPlayerIdsForRespawn returns null until both players have joined", () => {
    const manager = new CoopSessionManager(createGameplayEventBus());
    expect(manager.getPlayerIdsForRespawn()).toBeNull();
    manager.join("PLAYER_ONE", "player:one", "boy");
    expect(manager.getPlayerIdsForRespawn()).toBeNull();
  });

  it("getPlayerIdsForRespawn returns both ids in slot order once ready — the exact tuple shape RespawnCoordinator.notifyRespawned expects", () => {
    const manager = new CoopSessionManager(createGameplayEventBus());
    manager.join("PLAYER_ONE", "player:one", "boy");
    manager.join("PLAYER_TWO", "player:two", "girl");
    expect(manager.getPlayerIdsForRespawn()).toEqual(["player:one", "player:two"]);
  });
});

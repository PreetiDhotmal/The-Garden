import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import type { PlayerSave } from "@/domain/gameplay/save/PlayerSave";
import { INITIAL_PLAYER_PROGRESS } from "@/domain/gameplay/reward/PlayerProgressTotals";
import { IndexedDbSaveRepository } from "./IndexedDbSaveRepository";

function buildSave(overrides: Partial<PlayerSave> = {}): PlayerSave {
  return {
    saveVersion: 1,
    savedAtIso: new Date().toISOString(),
    progress: INITIAL_PLAYER_PROGRESS,
    inventory: { capacity: 20, slots: [] },
    quests: [],
    scripture: {
      unlockedReferenceKeys: [],
      discoveredReferenceKeys: [],
      memorizedReferenceKeys: [],
    },
    world: {
      currentWorldId: "region:garden-of-beginnings",
      unlockedWorldIds: [],
      playerPosition: { x: 0, y: 0, z: 0 },
      playerYaw: 0,
    },
    settings: { musicVolume: 0.8, sfxVolume: 0.8, selectedCharacterId: null },
    npcStates: [],
    storyFlags: [],
    ...overrides,
  };
}

describe("IndexedDbSaveRepository", () => {
  it("returns null when nothing has been saved yet", async () => {
    const repository = new IndexedDbSaveRepository();
    await repository.clear();
    expect(await repository.load()).toBeNull();
  });

  it("saves and loads a PlayerSave", async () => {
    const repository = new IndexedDbSaveRepository();
    const save = buildSave({ storyFlags: ["met-the-elder"] });

    await repository.save(save);
    const loaded = await repository.load();

    expect(loaded).toEqual(save);
  });

  it("overwrites the previous save on a second save() call", async () => {
    const repository = new IndexedDbSaveRepository();
    await repository.save(buildSave({ storyFlags: ["first"] }));
    await repository.save(buildSave({ storyFlags: ["second"] }));

    const loaded = await repository.load();

    expect(loaded?.storyFlags).toEqual(["second"]);
  });

  it("clears the save", async () => {
    const repository = new IndexedDbSaveRepository();
    await repository.save(buildSave());
    await repository.clear();

    expect(await repository.load()).toBeNull();
  });
});

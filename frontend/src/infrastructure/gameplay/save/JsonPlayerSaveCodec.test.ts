import { describe, expect, it } from "vitest";
import type { PlayerSave } from "@/domain/gameplay/save/PlayerSave";
import { INITIAL_PLAYER_PROGRESS } from "@/domain/gameplay/reward/PlayerProgressTotals";
import { InvalidSaveDataError, JsonPlayerSaveCodec } from "./JsonPlayerSaveCodec";

const SAMPLE_SAVE: PlayerSave = {
  saveVersion: 1,
  savedAtIso: "2026-01-01T00:00:00.000Z",
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
};

describe("JsonPlayerSaveCodec", () => {
  it("round-trips a PlayerSave through serialize/deserialize", () => {
    const codec = new JsonPlayerSaveCodec();
    const json = codec.serialize(SAMPLE_SAVE);
    expect(codec.deserialize(json)).toEqual(SAMPLE_SAVE);
  });

  it("throws InvalidSaveDataError for malformed JSON", () => {
    const codec = new JsonPlayerSaveCodec();
    expect(() => codec.deserialize("not json")).toThrow(InvalidSaveDataError);
  });
});

import { describe, expect, it } from "vitest";
import { createAssetConfig, InvalidAssetConfigError } from "./AssetConfig";
import { createAudioConfig, InvalidAudioConfigError } from "./AudioConfig";

describe("createAssetConfig", () => {
  it("uses defaults when no overrides given", () => {
    const config = createAssetConfig();
    expect(config.maxConcurrentLoads).toBe(6);
  });

  it("allows partial overrides", () => {
    const config = createAssetConfig({ maxConcurrentLoads: 12 });
    expect(config.maxConcurrentLoads).toBe(12);
    expect(config.retryAttempts).toBe(2);
  });

  it("rejects maxConcurrentLoads below 1", () => {
    expect(() => createAssetConfig({ maxConcurrentLoads: 0 })).toThrow(InvalidAssetConfigError);
  });

  it("rejects a negative retryAttempts", () => {
    expect(() => createAssetConfig({ retryAttempts: -1 })).toThrow(InvalidAssetConfigError);
  });
});

describe("createAudioConfig", () => {
  it("uses defaults when no overrides given", () => {
    const config = createAudioConfig();
    expect(config.volumeGroups.master).toBe(1);
  });

  it("merges partial volume group overrides with defaults", () => {
    const config = createAudioConfig({ volumeGroups: { music: 0.2 } });
    expect(config.volumeGroups.music).toBe(0.2);
    expect(config.volumeGroups.sfx).toBe(0.85);
  });

  it("rejects an out-of-range volume level", () => {
    expect(() => createAudioConfig({ volumeGroups: { master: 1.5 } })).toThrow(
      InvalidAudioConfigError
    );
  });

  it("rejects a negative crossfade duration", () => {
    expect(() => createAudioConfig({ musicCrossfadeSeconds: -1 })).toThrow(InvalidAudioConfigError);
  });
});

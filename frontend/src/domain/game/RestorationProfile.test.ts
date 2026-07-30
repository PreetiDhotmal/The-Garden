import { describe, expect, it } from "vitest";
import { DORMANT_RESTORATION_PROFILE, mergeRestorationProfiles } from "./RestorationProfile";

describe("mergeRestorationProfiles", () => {
  it("takes the maximum of every numeric field", () => {
    const merged = mergeRestorationProfiles(
      { ...DORMANT_RESTORATION_PROFILE, flowerDensity: 0.3, waterLevel: 0.8 },
      { ...DORMANT_RESTORATION_PROFILE, flowerDensity: 0.6, waterLevel: 0.2 }
    );
    expect(merged.flowerDensity).toBe(0.6);
    expect(merged.waterLevel).toBe(0.8);
  });

  it("never regresses an already-higher value", () => {
    const restored = { ...DORMANT_RESTORATION_PROFILE, lightingWarmth: 1 };
    const merged = mergeRestorationProfiles(restored, DORMANT_RESTORATION_PROFILE);
    expect(merged.lightingWarmth).toBe(1);
  });

  it("bridgeStable is true if either profile has it true", () => {
    const merged = mergeRestorationProfiles(
      { ...DORMANT_RESTORATION_PROFILE, bridgeStable: true },
      { ...DORMANT_RESTORATION_PROFILE, bridgeStable: false }
    );
    expect(merged.bridgeStable).toBe(true);
  });

  it("prefers the incoming musicLayerId, falling back to the existing one", () => {
    const withLayer = { ...DORMANT_RESTORATION_PROFILE, musicLayerId: "layer:water" };
    const noLayer = { ...DORMANT_RESTORATION_PROFILE, musicLayerId: null };
    expect(mergeRestorationProfiles(withLayer, noLayer).musicLayerId).toBe("layer:water");
    expect(mergeRestorationProfiles(noLayer, withLayer).musicLayerId).toBe("layer:water");
  });

  it("unions unlockedAreaIds without duplicates", () => {
    const a = { ...DORMANT_RESTORATION_PROFILE, unlockedAreaIds: ["area:a", "area:b"] };
    const b = { ...DORMANT_RESTORATION_PROFILE, unlockedAreaIds: ["area:b", "area:c"] };
    const merged = mergeRestorationProfiles(a, b);
    expect(new Set(merged.unlockedAreaIds)).toEqual(new Set(["area:a", "area:b", "area:c"]));
  });
});

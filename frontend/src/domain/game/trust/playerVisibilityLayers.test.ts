import { describe, expect, it } from "vitest";
import {
  layerForPlayer,
  PLAYER_A_ONLY_LAYER,
  PLAYER_B_ONLY_LAYER,
} from "./playerVisibilityLayers";

describe("layerForPlayer", () => {
  it("returns the A-only layer for player A", () => {
    expect(layerForPlayer("A")).toBe(PLAYER_A_ONLY_LAYER);
  });

  it("returns the B-only layer for player B", () => {
    expect(layerForPlayer("B")).toBe(PLAYER_B_ONLY_LAYER);
  });

  it("returns null for BOTH — content stays on the default shared layer", () => {
    expect(layerForPlayer("BOTH")).toBeNull();
  });

  it("the two player-only layers are distinct from each other and from the default layer (0)", () => {
    expect(PLAYER_A_ONLY_LAYER).not.toBe(PLAYER_B_ONLY_LAYER);
    expect(PLAYER_A_ONLY_LAYER).not.toBe(0);
    expect(PLAYER_B_ONLY_LAYER).not.toBe(0);
  });
});

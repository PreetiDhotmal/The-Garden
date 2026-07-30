import { describe, expect, it } from "vitest";
import { MeshStandardMaterial } from "three";
import { createLayeredTerrainMaterial } from "./LayeredTerrainMaterial";

const COLORS = {
  grass: "#4a7c3f",
  dirt: "#8a6244",
  stone: "#807c74",
  cliff: "#605c56",
};

describe("createLayeredTerrainMaterial", () => {
  it("constructs a real MeshStandardMaterial", () => {
    const material = createLayeredTerrainMaterial({ colors: COLORS });
    expect(material).toBeInstanceOf(MeshStandardMaterial);
  });

  it("sets onBeforeCompile as a function, so shader injection actually runs on compile", () => {
    const material = createLayeredTerrainMaterial({ colors: COLORS });
    expect(typeof material.onBeforeCompile).toBe("function");
  });

  it("respects the roughness option", () => {
    const material = createLayeredTerrainMaterial({ colors: COLORS, roughness: 0.5 });
    expect(material.roughness).toBe(0.5);
  });

  it("produces distinct cache keys for different color sets — prevents two terrains with different palettes from sharing one compiled shader by mistake", () => {
    const materialA = createLayeredTerrainMaterial({ colors: COLORS });
    const materialB = createLayeredTerrainMaterial({
      colors: { ...COLORS, grass: "#000000" },
    });
    const keyA = materialA.customProgramCacheKey();
    const keyB = materialB.customProgramCacheKey();
    expect(keyA).not.toBe(keyB);
  });

  it("produces the same cache key for the same color set — allows legitimate shader reuse across identical terrains", () => {
    const materialA = createLayeredTerrainMaterial({ colors: COLORS });
    const materialB = createLayeredTerrainMaterial({ colors: COLORS });
    expect(materialA.customProgramCacheKey()).toBe(materialB.customProgramCacheKey());
  });
});

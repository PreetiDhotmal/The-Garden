import { describe, expect, it } from "vitest";
import { addExperience, INITIAL_PLAYER_PROGRESS, levelForExperience } from "./PlayerProgressTotals";

describe("levelForExperience", () => {
  it("starts at level 1 with zero experience", () => {
    expect(levelForExperience(0)).toBe(1);
  });

  it("levels up every 100 experience", () => {
    expect(levelForExperience(100)).toBe(2);
    expect(levelForExperience(250)).toBe(3);
  });
});

describe("addExperience", () => {
  it("accumulates experience and recomputes level", () => {
    const result = addExperience(INITIAL_PLAYER_PROGRESS, 150);
    expect(result.experience).toBe(150);
    expect(result.level).toBe(2);
  });

  it("rejects negative amounts", () => {
    expect(() => addExperience(INITIAL_PLAYER_PROGRESS, -10)).toThrow(RangeError);
  });
});

import { describe, expect, it } from "vitest";
import { generateSplitCode } from "./communicationLevelContent";

describe("generateSplitCode", () => {
  it("returns exactly four digits", () => {
    expect(generateSplitCode(1)).toHaveLength(4);
  });

  it("every digit is between 0 and 9 inclusive", () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const code = generateSplitCode(seed);
      for (const digit of code) {
        expect(digit).toBeGreaterThanOrEqual(0);
        expect(digit).toBeLessThanOrEqual(9);
      }
    }
  });

  it("is deterministic — the same seed always produces the same code", () => {
    expect(generateSplitCode(42)).toEqual(generateSplitCode(42));
  });

  it("different seeds generally produce different codes", () => {
    const codes = new Set(Array.from({ length: 20 }, (_, i) => generateSplitCode(i).join("")));
    expect(codes.size).toBeGreaterThan(15);
  });
});

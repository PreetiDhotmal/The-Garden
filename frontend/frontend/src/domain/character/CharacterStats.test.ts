import { describe, expect, it } from "vitest";
import {
  createCharacterStats,
  InvalidCharacterStatsError,
  withDamage,
  withStaminaDelta,
} from "./CharacterStats";

describe("createCharacterStats", () => {
  it("defaults current values to their max", () => {
    const stats = createCharacterStats({ maxHealth: 80, maxStamina: 50 });
    expect(stats.currentHealth).toBe(80);
    expect(stats.currentStamina).toBe(50);
  });

  it("rejects currentHealth above maxHealth", () => {
    expect(() => createCharacterStats({ maxHealth: 50, currentHealth: 60 })).toThrow(
      InvalidCharacterStatsError
    );
  });

  it("rejects a non-positive maxHealth", () => {
    expect(() => createCharacterStats({ maxHealth: 0 })).toThrow(InvalidCharacterStatsError);
  });
});

describe("withDamage", () => {
  it("reduces current health and clamps at zero", () => {
    const stats = createCharacterStats({ maxHealth: 100 });
    const damaged = withDamage(stats, 150);
    expect(damaged.currentHealth).toBe(0);
    expect(stats.currentHealth).toBe(100); // original untouched
  });

  it("rejects a negative damage amount", () => {
    const stats = createCharacterStats();
    expect(() => withDamage(stats, -10)).toThrow(InvalidCharacterStatsError);
  });
});

describe("withStaminaDelta", () => {
  it("clamps stamina within [0, maxStamina]", () => {
    const stats = createCharacterStats({ maxStamina: 100, currentStamina: 90 });
    expect(withStaminaDelta(stats, 50).currentStamina).toBe(100);
    expect(withStaminaDelta(stats, -200).currentStamina).toBe(0);
  });
});

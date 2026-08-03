import { describe, expect, it } from "vitest";
import {
  INITIAL_SURVIVAL_STATS,
  drainThirst,
  drinkWater,
  updateStamina,
  isCriticallyThirsty,
  canSprint,
} from "./SurvivalStats";

describe("SurvivalStats", () => {
  it("drains thirst over time", () => {
    const next = drainThirst(INITIAL_SURVIVAL_STATS, 10, false);
    expect(next.thirst).toBeLessThan(INITIAL_SURVIVAL_STATS.thirst);
  });

  it("drains thirst more slowly while sheltered", () => {
    const exposed = drainThirst(INITIAL_SURVIVAL_STATS, 10, false);
    const sheltered = drainThirst(INITIAL_SURVIVAL_STATS, 10, true);
    expect(sheltered.thirst).toBeGreaterThan(exposed.thirst);
  });

  it("never drains thirst below zero", () => {
    const next = drainThirst({ ...INITIAL_SURVIVAL_STATS, thirst: 1 }, 100, false);
    expect(next.thirst).toBe(0);
  });

  it("drinkWater restores thirst, capped at max", () => {
    const thirsty = { ...INITIAL_SURVIVAL_STATS, thirst: 50 };
    expect(drinkWater(thirsty, 30).thirst).toBe(80);
    expect(drinkWater(thirsty, 1000).thirst).toBe(INITIAL_SURVIVAL_STATS.maxThirst);
  });

  it("drains stamina while sprinting", () => {
    const next = updateStamina(INITIAL_SURVIVAL_STATS, 1, true);
    expect(next.stamina).toBeLessThan(INITIAL_SURVIVAL_STATS.stamina);
  });

  it("regenerates stamina while not sprinting", () => {
    const depleted = { ...INITIAL_SURVIVAL_STATS, stamina: 50 };
    const next = updateStamina(depleted, 1, false);
    expect(next.stamina).toBeGreaterThan(50);
  });

  it("cannot drain stamina below zero", () => {
    const next = updateStamina({ ...INITIAL_SURVIVAL_STATS, stamina: 1 }, 10, true);
    expect(next.stamina).toBe(0);
  });

  it("isCriticallyThirsty flags at or below 20", () => {
    expect(isCriticallyThirsty({ ...INITIAL_SURVIVAL_STATS, thirst: 20 })).toBe(true);
    expect(isCriticallyThirsty({ ...INITIAL_SURVIVAL_STATS, thirst: 21 })).toBe(false);
  });

  it("canSprint is false at zero stamina", () => {
    expect(canSprint({ ...INITIAL_SURVIVAL_STATS, stamina: 0 })).toBe(false);
    expect(canSprint({ ...INITIAL_SURVIVAL_STATS, stamina: 1 })).toBe(true);
  });
});

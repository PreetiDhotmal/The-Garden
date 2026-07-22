import { describe, expect, it } from "vitest";
import {
  advanceDayNightTime,
  computeDayNightSnapshot,
  DayPhase,
  InvalidDayNightTimeError,
} from "./DayNightCycle";

describe("computeDayNightSnapshot", () => {
  it("reports NIGHT at midnight", () => {
    expect(computeDayNightSnapshot(0).phase).toBe(DayPhase.NIGHT);
  });

  it("reports DAY at noon", () => {
    expect(computeDayNightSnapshot(0.5).phase).toBe(DayPhase.DAY);
  });

  it("reports DAWN in the early morning", () => {
    expect(computeDayNightSnapshot(0.25).phase).toBe(DayPhase.DAWN);
  });

  it("reports DUSK in the early evening", () => {
    expect(computeDayNightSnapshot(0.73).phase).toBe(DayPhase.DUSK);
  });

  it("peaks sun elevation near noon", () => {
    const noon = computeDayNightSnapshot(0.5);
    const midnight = computeDayNightSnapshot(0.001);
    expect(noon.sunAngle.elevation).toBeGreaterThan(midnight.sunAngle.elevation);
  });

  it("the moon is up when the sun is down", () => {
    const midnight = computeDayNightSnapshot(0);
    expect(midnight.sunAngle.elevation).toBeLessThan(0);
    expect(midnight.moonAngle.elevation).toBeGreaterThan(0);
  });

  it("sun intensity is zero when the sun is below the horizon", () => {
    const midnight = computeDayNightSnapshot(0);
    expect(midnight.sunIntensity).toBe(0);
  });

  it("sun intensity is positive at noon", () => {
    expect(computeDayNightSnapshot(0.5).sunIntensity).toBeGreaterThan(0);
  });

  it("rejects an out-of-range time", () => {
    expect(() => computeDayNightSnapshot(1)).toThrow(InvalidDayNightTimeError);
    expect(() => computeDayNightSnapshot(-0.1)).toThrow(InvalidDayNightTimeError);
  });
});

describe("advanceDayNightTime", () => {
  it("advances time proportionally to the cycle duration", () => {
    const next = advanceDayNightTime(0, 60, 600); // 1/10th of the cycle
    expect(next).toBeCloseTo(0.1, 5);
  });

  it("wraps around past 1", () => {
    const next = advanceDayNightTime(0.95, 60, 600);
    expect(next).toBeCloseTo(0.05, 5);
  });

  it("rejects a non-positive cycle duration", () => {
    expect(() => advanceDayNightTime(0, 1, 0)).toThrow(InvalidDayNightTimeError);
  });
});

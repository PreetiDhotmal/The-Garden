import { describe, expect, it } from "vitest";
import { TimeSystem } from "./TimeSystem";

describe("TimeSystem", () => {
  it("accumulates elapsed time across ticks", () => {
    const time = new TimeSystem();

    time.tick(0.016);
    time.tick(0.016);
    const snapshot = time.tick(0.016);

    expect(snapshot.elapsedSeconds).toBeCloseTo(0.048, 5);
    expect(snapshot.deltaSeconds).toBeCloseTo(0.016, 5);
  });

  it("reports zero delta and does not advance while paused", () => {
    const time = new TimeSystem();
    time.tick(0.016);
    time.pause();

    const snapshot = time.tick(0.016);

    expect(snapshot.deltaSeconds).toBe(0);
    expect(snapshot.elapsedSeconds).toBeCloseTo(0.016, 5);
    expect(snapshot.isPaused).toBe(true);
  });

  it("resumes advancing time after resume()", () => {
    const time = new TimeSystem();
    time.pause();
    time.tick(0.016);
    time.resume();
    const snapshot = time.tick(0.016);

    expect(snapshot.deltaSeconds).toBeCloseTo(0.016, 5);
    expect(snapshot.isPaused).toBe(false);
  });

  it("scales delta by timeScale", () => {
    const time = new TimeSystem();
    time.setTimeScale(2);

    const snapshot = time.tick(0.01);

    expect(snapshot.deltaSeconds).toBeCloseTo(0.02, 5);
    expect(snapshot.timeScale).toBe(2);
  });

  it("rejects a negative timeScale", () => {
    const time = new TimeSystem();
    expect(() => {
      time.setTimeScale(-1);
    }).toThrow(RangeError);
  });

  it("rejects a negative raw delta", () => {
    const time = new TimeSystem();
    expect(() => time.tick(-0.01)).toThrow(RangeError);
  });

  it("reset() restores the initial state", () => {
    const time = new TimeSystem();
    time.setTimeScale(3);
    time.tick(1);
    time.pause();

    time.reset();
    const snapshot = time.snapshot();

    expect(snapshot).toEqual({
      deltaSeconds: 0,
      elapsedSeconds: 0,
      isPaused: false,
      timeScale: 1,
    });
  });
});

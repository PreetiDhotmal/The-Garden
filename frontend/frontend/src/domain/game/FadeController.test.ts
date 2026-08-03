import { describe, expect, it } from "vitest";
import { FadeController } from "./FadeController";

describe("FadeController", () => {
  it("throws for a non-positive duration", () => {
    expect(() => new FadeController(0, "IN")).toThrow(RangeError);
    expect(() => new FadeController(-1, "IN")).toThrow(RangeError);
  });

  it("IN direction progresses from 0 toward 1", () => {
    const fade = new FadeController(1, "IN");
    expect(fade.getState().progress).toBe(0);
    fade.update(0.5);
    expect(fade.getState().progress).toBeCloseTo(0.5);
    fade.update(0.5);
    expect(fade.getState().progress).toBeCloseTo(1);
  });

  it("OUT direction progresses from 1 toward 0", () => {
    const fade = new FadeController(1, "OUT");
    expect(fade.getState().progress).toBe(1);
    fade.update(1);
    expect(fade.getState().progress).toBeCloseTo(0);
  });

  it("isComplete becomes true once elapsed reaches duration, regardless of direction", () => {
    const fadeIn = new FadeController(1, "IN");
    const fadeOut = new FadeController(1, "OUT");
    expect(fadeIn.update(1).isComplete).toBe(true);
    expect(fadeOut.update(1).isComplete).toBe(true);
  });

  it("clamps at duration — updating past it does not overshoot", () => {
    const fade = new FadeController(1, "IN");
    fade.update(5);
    expect(fade.getState().progress).toBe(1);
  });

  it("reverse() flips direction without a visual jump", () => {
    const fade = new FadeController(2, "IN");
    fade.update(1);
    const before = fade.getState().progress;
    fade.reverse();
    const after = fade.getState().progress;
    expect(after).toBeCloseTo(before);
  });

  it("reset() restarts cleanly with a new direction", () => {
    const fade = new FadeController(1, "IN");
    fade.update(1);
    fade.reset("OUT");
    expect(fade.getState().progress).toBe(1);
    expect(fade.getState().isComplete).toBe(false);
  });
});

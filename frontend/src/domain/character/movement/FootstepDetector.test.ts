import { describe, expect, it } from "vitest";
import { FootstepDetector } from "./FootstepDetector";

describe("FootstepDetector", () => {
  it("does not trigger while airborne, regardless of distance", () => {
    const detector = new FootstepDetector();
    expect(detector.update(2, false, false)).toBe(false);
  });

  it("does not trigger while standing still", () => {
    const detector = new FootstepDetector();
    expect(detector.update(0, true, false)).toBe(false);
  });

  it("triggers once enough walking distance accumulates", () => {
    const detector = new FootstepDetector({ walkStrideMeters: 1, runStrideMeters: 1.5 });
    expect(detector.update(0.6, true, false)).toBe(false);
    expect(detector.update(0.5, true, false)).toBe(true);
  });

  it("uses the shorter run stride when running", () => {
    const detector = new FootstepDetector({ walkStrideMeters: 2, runStrideMeters: 1 });
    expect(detector.update(1, true, true)).toBe(true);
  });

  it("carries over leftover distance into the next stride", () => {
    const detector = new FootstepDetector({ walkStrideMeters: 1, runStrideMeters: 1 });
    expect(detector.update(1.3, true, false)).toBe(true);
    // 0.3m carried over; needs only 0.7m more to trigger again.
    expect(detector.update(0.6, true, false)).toBe(false);
    expect(detector.update(0.2, true, false)).toBe(true);
  });

  it("resets accumulated distance when landing/stopping breaks the stride", () => {
    const detector = new FootstepDetector({ walkStrideMeters: 1, runStrideMeters: 1 });
    detector.update(0.8, true, false);
    detector.update(0.5, false, false); // airborne — resets
    expect(detector.update(0.5, true, false)).toBe(false);
  });

  it("reset() clears accumulated distance explicitly", () => {
    const detector = new FootstepDetector({ walkStrideMeters: 1, runStrideMeters: 1 });
    detector.update(0.8, true, false);
    detector.reset();
    expect(detector.update(0.5, true, false)).toBe(false);
  });
});

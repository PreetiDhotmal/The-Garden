import { describe, expect, it } from "vitest";
import {
  EMPTY_INPUT_FRAME_STATE,
  inputFrameToMoveVector,
  mergeInputFrameStates,
} from "./InputFrameState";

describe("mergeInputFrameStates", () => {
  it("ORs boolean flags across frames", () => {
    const merged = mergeInputFrameStates([
      { ...EMPTY_INPUT_FRAME_STATE, moveForward: true },
      { ...EMPTY_INPUT_FRAME_STATE, sprintHeld: true },
    ]);
    expect(merged.moveForward).toBe(true);
    expect(merged.sprintHeld).toBe(true);
  });

  it("sums numeric deltas across frames", () => {
    const merged = mergeInputFrameStates([
      { ...EMPTY_INPUT_FRAME_STATE, lookDeltaX: 0.1 },
      { ...EMPTY_INPUT_FRAME_STATE, lookDeltaX: 0.2 },
    ]);
    expect(merged.lookDeltaX).toBeCloseTo(0.3, 5);
  });

  it("returns the empty state when given no frames", () => {
    expect(mergeInputFrameStates([])).toEqual(EMPTY_INPUT_FRAME_STATE);
  });
});

describe("inputFrameToMoveVector", () => {
  it("returns zero vector when nothing is pressed", () => {
    expect(inputFrameToMoveVector(EMPTY_INPUT_FRAME_STATE)).toEqual({ x: 0, z: 0 });
  });

  it("returns a unit vector for a single direction", () => {
    const vector = inputFrameToMoveVector({ ...EMPTY_INPUT_FRAME_STATE, moveForward: true });
    expect(vector).toEqual({ x: 0, z: 1 });
  });

  it("normalizes diagonal movement to a unit vector", () => {
    const vector = inputFrameToMoveVector({
      ...EMPTY_INPUT_FRAME_STATE,
      moveForward: true,
      moveRight: true,
    });
    expect(Math.hypot(vector.x, vector.z)).toBeCloseTo(1, 5);
  });

  it("cancels out opposing directions", () => {
    const vector = inputFrameToMoveVector({
      ...EMPTY_INPUT_FRAME_STATE,
      moveForward: true,
      moveBackward: true,
    });
    expect(vector).toEqual({ x: 0, z: 0 });
  });
});

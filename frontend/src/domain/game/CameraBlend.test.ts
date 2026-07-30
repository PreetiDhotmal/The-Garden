import { describe, expect, it } from "vitest";
import { CameraBlend, type CameraTransform } from "./CameraBlend";

const FROM: CameraTransform = { position: { x: 0, y: 0, z: 0 }, lookAt: { x: 0, y: 0, z: 1 } };
const TO: CameraTransform = { position: { x: 10, y: 4, z: 0 }, lookAt: { x: 0, y: 0, z: -1 } };

describe("CameraBlend", () => {
  it("starts at the from transform", () => {
    const blend = new CameraBlend(FROM, TO, 2);
    const state = blend.update(0);
    expect(state.position).toEqual(FROM.position);
  });

  it("reaches the to transform once the duration elapses", () => {
    const blend = new CameraBlend(FROM, TO, 2);
    const state = blend.update(2);
    expect(state.position).toEqual(TO.position);
    expect(state.lookAt).toEqual(TO.lookAt);
  });

  it("interpolates linearly at the midpoint", () => {
    const blend = new CameraBlend(FROM, TO, 2);
    const state = blend.update(1);
    expect(state.position.x).toBeCloseTo(5);
    expect(state.position.y).toBeCloseTo(2);
  });

  it("isComplete reflects whether the blend has finished", () => {
    const blend = new CameraBlend(FROM, TO, 1);
    expect(blend.isComplete()).toBe(false);
    blend.update(1);
    expect(blend.isComplete()).toBe(true);
  });

  it("does not overshoot the to transform past the duration", () => {
    const blend = new CameraBlend(FROM, TO, 1);
    blend.update(10);
    const state = blend.update(0);
    expect(state.position).toEqual(TO.position);
  });
});

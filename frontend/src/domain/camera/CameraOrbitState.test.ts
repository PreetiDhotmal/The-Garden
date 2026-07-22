import { describe, expect, it } from "vitest";
import { CameraOrbitState, createThirdPersonCameraConfig, InvalidCameraConfigError } from "./CameraOrbitState";

describe("createThirdPersonCameraConfig", () => {
  it("rejects maxDistance not exceeding minDistance", () => {
    expect(() =>
      createThirdPersonCameraConfig({ minDistance: 5, maxDistance: 5 })
    ).toThrow(InvalidCameraConfigError);
  });

  it("rejects an inverted pitch range", () => {
    expect(() =>
      createThirdPersonCameraConfig({ minPitchRadians: 1, maxPitchRadians: 0 })
    ).toThrow(InvalidCameraConfigError);
  });
});

describe("CameraOrbitState", () => {
  it("starts at maxDistance", () => {
    const config = createThirdPersonCameraConfig({ minDistance: 2, maxDistance: 6 });
    const orbit = new CameraOrbitState(config);
    const snapshot = orbit.tick(0, null);
    expect(snapshot.distance).toBeCloseTo(6, 5);
  });

  it("smoothly approaches the target yaw rather than snapping instantly", () => {
    const config = createThirdPersonCameraConfig({ rotationSmoothing: 5 });
    const orbit = new CameraOrbitState(config);
    orbit.applyLookDelta(Math.PI / 2, 0);

    const afterOneFrame = orbit.tick(0.016, null);
    expect(afterOneFrame.yaw).toBeGreaterThan(0);
    expect(afterOneFrame.yaw).toBeLessThan(Math.PI / 2);
  });

  it("converges to the target yaw over many ticks", () => {
    const config = createThirdPersonCameraConfig({ rotationSmoothing: 10 });
    const orbit = new CameraOrbitState(config);
    orbit.applyLookDelta(1, 0);

    let snapshot = orbit.tick(0, null);
    for (let i = 0; i < 200; i += 1) {
      snapshot = orbit.tick(0.016, null);
    }
    expect(snapshot.yaw).toBeCloseTo(1, 2);
  });

  it("clamps pitch within the configured range", () => {
    const config = createThirdPersonCameraConfig({
      minPitchRadians: -0.5,
      maxPitchRadians: 0.5,
      rotationSmoothing: 1000,
    });
    const orbit = new CameraOrbitState(config);
    orbit.applyLookDelta(0, 10);

    const snapshot = orbit.tick(1, null);
    expect(snapshot.pitch).toBeLessThanOrEqual(0.5);
  });

  it("clamps zoom distance within [minDistance, maxDistance]", () => {
    const config = createThirdPersonCameraConfig({ minDistance: 2, maxDistance: 6, zoomSmoothing: 1000 });
    const orbit = new CameraOrbitState(config);
    orbit.applyZoomDelta(-100);

    const snapshot = orbit.tick(1, null);
    expect(snapshot.distance).toBeGreaterThanOrEqual(2);
  });

  it("clamps effective distance to an obstruction, even if closer than the smoothed distance", () => {
    const config = createThirdPersonCameraConfig({ minDistance: 1, maxDistance: 6, zoomSmoothing: 1000 });
    const orbit = new CameraOrbitState(config);

    const snapshot = orbit.tick(1, 2.5);
    expect(snapshot.distance).toBeCloseTo(2.5, 5);
  });

  it("ignores obstruction distance when it is farther than the desired distance", () => {
    const config = createThirdPersonCameraConfig({ minDistance: 1, maxDistance: 3, zoomSmoothing: 1000 });
    const orbit = new CameraOrbitState(config);

    const snapshot = orbit.tick(1, 100);
    expect(snapshot.distance).toBeCloseTo(3, 5);
  });
});

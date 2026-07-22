import { describe, expect, it } from "vitest";
import { createAudioZone, InvalidAudioZoneError, isPointInAudioZone } from "./AudioZone";

describe("createAudioZone", () => {
  it("creates a zone with defaults for optional tracks", () => {
    const zone = createAudioZone({ id: "grove", center: { x: 0, y: 0, z: 0 }, radius: 10 });
    expect(zone.musicTrackId).toBeNull();
    expect(zone.ambientTrackId).toBeNull();
  });

  it("rejects a non-positive radius", () => {
    expect(() =>
      createAudioZone({ id: "grove", center: { x: 0, y: 0, z: 0 }, radius: 0 })
    ).toThrow(InvalidAudioZoneError);
  });

  it("rejects an empty id", () => {
    expect(() =>
      createAudioZone({ id: "  ", center: { x: 0, y: 0, z: 0 }, radius: 5 })
    ).toThrow(InvalidAudioZoneError);
  });
});

describe("isPointInAudioZone", () => {
  const zone = createAudioZone({ id: "grove", center: { x: 0, y: 0, z: 0 }, radius: 10 });

  it("returns true for a point inside the radius", () => {
    expect(isPointInAudioZone(zone, { x: 3, y: 0, z: 4 })).toBe(true); // distance 5
  });

  it("returns true for a point exactly on the boundary", () => {
    expect(isPointInAudioZone(zone, { x: 10, y: 0, z: 0 })).toBe(true);
  });

  it("returns false for a point outside the radius", () => {
    expect(isPointInAudioZone(zone, { x: 11, y: 0, z: 0 })).toBe(false);
  });
});

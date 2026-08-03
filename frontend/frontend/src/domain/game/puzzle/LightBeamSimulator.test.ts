import { describe, expect, it } from "vitest";
import { simulateLightBeam, type MirrorState } from "./LightBeamSimulator";

describe("simulateLightBeam", () => {
  it("travels in a straight line and misses when no mirrors are present", () => {
    const result = simulateLightBeam(
      { position: { x: 0, z: 0 }, direction: { x: 1, z: 0 } },
      [],
      { position: { x: 5, z: 5 }, radius: 0.5 }
    );
    expect(result.hitsTarget).toBe(false);
  });

  it("hits the target directly when it lies on the unobstructed beam path", () => {
    const result = simulateLightBeam(
      { position: { x: 0, z: 0 }, direction: { x: 1, z: 0 } },
      [],
      { position: { x: 10, z: 0 }, radius: 0.5 }
    );
    expect(result.hitsTarget).toBe(true);
  });

  it("a single FORWARD_SLASH mirror reflects a rightward beam upward (+Z)", () => {
    const mirrors: MirrorState[] = [
      { id: "m1", position: { x: 5, z: 0 }, orientation: "FORWARD_SLASH" },
    ];
    const result = simulateLightBeam(
      { position: { x: 0, z: 0 }, direction: { x: 1, z: 0 } },
      mirrors,
      { position: { x: 5, z: 5 }, radius: 0.5 }
    );
    expect(result.hitsTarget).toBe(true);
  });

  it("a single BACK_SLASH mirror reflects a rightward beam downward (-Z)", () => {
    const mirrors: MirrorState[] = [
      { id: "m1", position: { x: 5, z: 0 }, orientation: "BACK_SLASH" },
    ];
    const result = simulateLightBeam(
      { position: { x: 0, z: 0 }, direction: { x: 1, z: 0 } },
      mirrors,
      { position: { x: 5, z: -5 }, radius: 0.5 }
    );
    expect(result.hitsTarget).toBe(true);
  });

  it("the wrong mirror orientation simply sends the beam elsewhere — no crash, no special failure state", () => {
    const mirrors: MirrorState[] = [
      { id: "m1", position: { x: 5, z: 0 }, orientation: "BACK_SLASH" },
    ];
    const result = simulateLightBeam(
      { position: { x: 0, z: 0 }, direction: { x: 1, z: 0 } },
      mirrors,
      { position: { x: 5, z: 5 }, radius: 0.5 }
    );
    expect(result.hitsTarget).toBe(false);
    expect(result.path.length).toBeGreaterThan(1);
  });

  it("chains through two mirrors correctly (the exact two-mirror configuration Puzzle 2's level content uses)", () => {
    const mirrors: MirrorState[] = [
      { id: "mirror-1", position: { x: -2, z: -40 }, orientation: "FORWARD_SLASH" },
      { id: "mirror-2", position: { x: -2, z: -34 }, orientation: "FORWARD_SLASH" },
    ];
    const result = simulateLightBeam(
      { position: { x: -10, z: -40 }, direction: { x: 1, z: 0 } },
      mirrors,
      { position: { x: 6, z: -34 }, radius: 0.6 }
    );
    expect(result.hitsTarget).toBe(true);
    expect(result.path).toHaveLength(4);
  });

  it("hits the target with the exact single-mirror configuration the Final Puzzle's level content uses", () => {
    const mirrors: MirrorState[] = [
      { id: "final-mirror", position: { x: 8, z: -100 }, orientation: "FORWARD_SLASH" },
    ];
    const result = simulateLightBeam(
      { position: { x: 2, z: -100 }, direction: { x: 1, z: 0 } },
      mirrors,
      { position: { x: 8, z: -94 }, radius: 0.6 }
    );
    expect(result.hitsTarget).toBe(true);
    expect(result.path).toHaveLength(3); // source -> mirror -> target
  });

  it("the same two-mirror level is unsolved if either mirror is in the wrong orientation", () => {
    const wrongFirst: MirrorState[] = [
      { id: "mirror-1", position: { x: -2, z: -40 }, orientation: "BACK_SLASH" },
      { id: "mirror-2", position: { x: -2, z: -34 }, orientation: "FORWARD_SLASH" },
    ];
    const source = { position: { x: -10, z: -40 }, direction: { x: 1, z: 0 } };
    const target = { position: { x: 6, z: -34 }, radius: 0.6 };
    expect(simulateLightBeam(source, wrongFirst, target).hitsTarget).toBe(false);

    const wrongSecond: MirrorState[] = [
      { id: "mirror-1", position: { x: -2, z: -40 }, orientation: "FORWARD_SLASH" },
      { id: "mirror-2", position: { x: -2, z: -34 }, orientation: "BACK_SLASH" },
    ];
    expect(simulateLightBeam(source, wrongSecond, target).hitsTarget).toBe(false);
  });

  it("does not hit a target behind a mirror the beam bounces off before reaching it", () => {
    const mirrors: MirrorState[] = [
      { id: "m1", position: { x: 5, z: 0 }, orientation: "FORWARD_SLASH" },
    ];
    const result = simulateLightBeam(
      { position: { x: 0, z: 0 }, direction: { x: 1, z: 0 } },
      mirrors,
      { position: { x: 10, z: 0 }, radius: 0.5 }
    );
    expect(result.hitsTarget).toBe(false);
  });

  it("terminates (does not hang) even in a mirror configuration that could bounce repeatedly", () => {
    const mirrors: MirrorState[] = [
      { id: "m1", position: { x: 5, z: 0 }, orientation: "FORWARD_SLASH" },
      { id: "m2", position: { x: 5, z: 5 }, orientation: "BACK_SLASH" },
      { id: "m3", position: { x: 0, z: 5 }, orientation: "FORWARD_SLASH" },
      { id: "m4", position: { x: 0, z: 0 }, orientation: "BACK_SLASH" },
    ];
    const result = simulateLightBeam(
      { position: { x: -5, z: 0 }, direction: { x: 1, z: 0 } },
      mirrors,
      { position: { x: 100, z: 100 }, radius: 0.5 }
    );
    expect(result.hitsTarget).toBe(false);
    expect(result.path.length).toBeLessThanOrEqual(10);
  });
});

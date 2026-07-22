import { describe, expect, it } from "vitest";
import { createAudioZone } from "@/domain/engine/audio/AudioZone";
import { AudioZoneManager } from "./AudioZoneManager";

describe("AudioZoneManager", () => {
  it("registers and lists zones", () => {
    const manager = new AudioZoneManager();
    manager.register(createAudioZone({ id: "grove", center: { x: 0, y: 0, z: 0 }, radius: 10 }));

    expect(manager.list()).toHaveLength(1);
  });

  it("finds zones containing a point", () => {
    const manager = new AudioZoneManager();
    manager.register(createAudioZone({ id: "grove", center: { x: 0, y: 0, z: 0 }, radius: 10 }));
    manager.register(createAudioZone({ id: "cave", center: { x: 100, y: 0, z: 0 }, radius: 5 }));

    const found = manager.zonesContaining({ x: 1, y: 0, z: 1 });

    expect(found).toHaveLength(1);
    expect(found[0]?.id).toBe("grove");
  });

  it("returns no zones for a point outside every zone", () => {
    const manager = new AudioZoneManager();
    manager.register(createAudioZone({ id: "grove", center: { x: 0, y: 0, z: 0 }, radius: 10 }));

    expect(manager.zonesContaining({ x: 500, y: 0, z: 0 })).toHaveLength(0);
  });

  it("unregisters a zone", () => {
    const manager = new AudioZoneManager();
    manager.register(createAudioZone({ id: "grove", center: { x: 0, y: 0, z: 0 }, radius: 10 }));

    manager.unregister("grove");

    expect(manager.list()).toHaveLength(0);
  });
});

import { describe, expect, it } from "vitest";
import { createEnvironmentConfig } from "@/domain/engine/config/EnvironmentConfig";
import { createSphereTrigger } from "@/domain/world/trigger/TriggerShape";
import { createEnvironmentZone, resolveActiveZone } from "./EnvironmentZone";

describe("resolveActiveZone", () => {
  it("returns null when the player is in no zones", () => {
    expect(resolveActiveZone([])).toBeNull();
  });

  it("returns the only zone when just one applies", () => {
    const zone = createEnvironmentZone(
      "forest",
      createSphereTrigger({ x: 0, y: 0, z: 0 }, 10),
      createEnvironmentConfig({ id: "forest-env" })
    );
    expect(resolveActiveZone([zone])?.id).toBe("forest");
  });

  it("prefers the higher-priority zone when zones overlap", () => {
    const outer = createEnvironmentZone(
      "forest",
      createSphereTrigger({ x: 0, y: 0, z: 0 }, 50),
      createEnvironmentConfig({ id: "forest-env" }),
      0
    );
    const inner = createEnvironmentZone(
      "sacred-clearing",
      createSphereTrigger({ x: 0, y: 0, z: 0 }, 5),
      createEnvironmentConfig({ id: "clearing-env" }),
      10
    );
    expect(resolveActiveZone([outer, inner])?.id).toBe("sacred-clearing");
  });
});

import { describe, expect, it } from "vitest";
import { createEnvironmentConfig, InvalidEnvironmentConfigError } from "./EnvironmentConfig";

describe("createEnvironmentConfig", () => {
  it("applies sensible defaults", () => {
    const config = createEnvironmentConfig({ id: "garden-day" });
    expect(config.hdriAssetId).toBeNull();
    expect(config.directionalLight.castShadow).toBe(true);
    expect(config.fog).toBeNull();
  });

  it("merges partial overrides with defaults", () => {
    const config = createEnvironmentConfig({
      id: "garden-dusk",
      directionalLight: { intensity: 1.2 },
    });
    expect(config.directionalLight.intensity).toBe(1.2);
    expect(config.directionalLight.colorHex).toBe("#fff6e0");
  });

  it("rejects fog where near >= far", () => {
    expect(() =>
      createEnvironmentConfig({
        id: "garden-fog",
        fog: { colorHex: "#cccccc", near: 50, far: 10 },
      })
    ).toThrow(InvalidEnvironmentConfigError);
  });

  it("rejects a malformed background color", () => {
    expect(() =>
      createEnvironmentConfig({ id: "garden-day", backgroundColorHex: "sky-blue" })
    ).toThrow(InvalidEnvironmentConfigError);
  });
});

import { describe, expect, it } from "vitest";
import { createMaterialConfig, InvalidMaterialConfigError } from "./MaterialConfig";

describe("createMaterialConfig", () => {
  it("applies sensible defaults", () => {
    const config = createMaterialConfig({ id: "bark" });
    expect(config.baseColorHex).toBe("#ffffff");
    expect(config.roughness).toBe(0.7);
    expect(config.metalness).toBe(0);
    expect(config.opacity).toBe(1);
  });

  it("rejects an out-of-range roughness", () => {
    expect(() => createMaterialConfig({ id: "bark", roughness: 1.5 })).toThrow(
      InvalidMaterialConfigError
    );
  });

  it("rejects a malformed hex color", () => {
    expect(() => createMaterialConfig({ id: "bark", baseColorHex: "green" })).toThrow(
      InvalidMaterialConfigError
    );
  });

  it("rejects a negative emissive intensity", () => {
    expect(() => createMaterialConfig({ id: "bark", emissiveIntensity: -1 })).toThrow(
      InvalidMaterialConfigError
    );
  });
});

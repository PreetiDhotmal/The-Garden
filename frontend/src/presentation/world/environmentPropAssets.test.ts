import { describe, expect, it } from "vitest";
import { ENVIRONMENT_PROPS, ENVIRONMENT_PROP_IDS } from "./environmentPropAssets";
import { DISCOVERED_ENVIRONMENT_PROPS } from "./environmentPropManifest.generated";

describe("ENVIRONMENT_PROPS (auto-discovered)", () => {
  it("exposes exactly one definition per category the manifest discovered", () => {
    expect(ENVIRONMENT_PROPS).toHaveLength(DISCOVERED_ENVIRONMENT_PROPS.length);
  });

  it("every declared ENVIRONMENT_PROP_IDS key, if a matching asset was discovered, resolves to a real registered prop", () => {
    for (const assetId of Object.values(ENVIRONMENT_PROP_IDS)) {
      const wasDiscovered = DISCOVERED_ENVIRONMENT_PROPS.some((prop) => prop.assetId === assetId);
      if (!wasDiscovered) {
        continue; // A category simply wasn't found on disk this run - not a failure by itself.
      }
      const definition = ENVIRONMENT_PROPS.find((prop) => prop.assetId === assetId);
      expect(definition).toBeDefined();
    }
  });

  it("every baseScale is positive and finite — a zero or negative scale would make a prop invisible or inverted", () => {
    for (const prop of ENVIRONMENT_PROPS) {
      expect(prop.baseScale).toBeGreaterThan(0);
      expect(Number.isFinite(prop.baseScale)).toBe(true);
    }
  });

  it("every registered url points under /models/environment/", () => {
    for (const prop of ENVIRONMENT_PROPS) {
      expect(prop.url.startsWith("/models/environment/")).toBe(true);
    }
  });

  it("every asset id is unique — the discovery script should never register the same category twice", () => {
    const ids = ENVIRONMENT_PROPS.map((prop) => prop.assetId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

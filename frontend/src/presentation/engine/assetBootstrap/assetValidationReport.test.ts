import { describe, expect, it } from "vitest";
import { AssetRegistry } from "@/domain/engine/assets/AssetRegistry";
import { createAssetDescriptor } from "@/domain/engine/assets/AssetDescriptor";
import { AssetType } from "@/domain/engine/assets/AssetType";
import { CHARACTER_MODEL_ASSET_IDS } from "@/presentation/character/characterModelAssets";
import { formatAssetValidationReport, validateCoreAssets } from "./assetValidationReport";

describe("validateCoreAssets", () => {
  it("reports both character models missing on a fresh, empty registry", () => {
    const registry = new AssetRegistry();
    const report = validateCoreAssets(registry);
    expect(report.allPresent).toBe(false);
    expect(report.lines.every((line) => !line.isPresent)).toBe(true);
  });

  it("reports allPresent true once both character models are registered", () => {
    const registry = new AssetRegistry();
    registry.register(
      createAssetDescriptor({
        id: CHARACTER_MODEL_ASSET_IDS.BOY,
        type: AssetType.MODEL,
        url: "/models/characters/boy.glb",
        priority: "critical",
      })
    );
    registry.register(
      createAssetDescriptor({
        id: CHARACTER_MODEL_ASSET_IDS.GIRL,
        type: AssetType.MODEL,
        url: "/models/characters/girl.glb",
        priority: "critical",
      })
    );
    const report = validateCoreAssets(registry);
    expect(report.allPresent).toBe(true);
  });

  it("reports partial registration accurately (one present, one missing)", () => {
    const registry = new AssetRegistry();
    registry.register(
      createAssetDescriptor({
        id: CHARACTER_MODEL_ASSET_IDS.BOY,
        type: AssetType.MODEL,
        url: "/models/characters/boy.glb",
        priority: "critical",
      })
    );
    const report = validateCoreAssets(registry);
    expect(report.allPresent).toBe(false);
    const boyLine = report.lines.find((line) => line.assetId === CHARACTER_MODEL_ASSET_IDS.BOY);
    const girlLine = report.lines.find((line) => line.assetId === CHARACTER_MODEL_ASSET_IDS.GIRL);
    expect(boyLine?.isPresent).toBe(true);
    expect(girlLine?.isPresent).toBe(false);
  });
});

describe("formatAssetValidationReport", () => {
  it("formats a missing asset with a visible ✗ marker and its id", () => {
    const registry = new AssetRegistry();
    const text = formatAssetValidationReport(validateCoreAssets(registry));
    expect(text).toContain("✗");
    expect(text).toContain(CHARACTER_MODEL_ASSET_IDS.BOY);
  });

  it("formats a present asset with a visible ✓ marker", () => {
    const registry = new AssetRegistry();
    registry.register(
      createAssetDescriptor({
        id: CHARACTER_MODEL_ASSET_IDS.BOY,
        type: AssetType.MODEL,
        url: "/models/characters/boy.glb",
        priority: "critical",
      })
    );
    registry.register(
      createAssetDescriptor({
        id: CHARACTER_MODEL_ASSET_IDS.GIRL,
        type: AssetType.MODEL,
        url: "/models/characters/girl.glb",
        priority: "critical",
      })
    );
    const text = formatAssetValidationReport(validateCoreAssets(registry));
    expect(text).not.toContain("✗");
    expect(text.match(/✓/g)).toHaveLength(2);
  });
});

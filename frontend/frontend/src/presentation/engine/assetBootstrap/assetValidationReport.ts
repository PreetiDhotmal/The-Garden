import type { AssetRegistry } from "@/domain/engine/assets/AssetRegistry";
import { CHARACTER_MODEL_ASSET_IDS } from "@/presentation/character/characterModelAssets";

export interface AssetValidationLine {
  readonly isPresent: boolean;
  readonly label: string;
  readonly assetId: string;
}

export interface AssetValidationReport {
  readonly lines: readonly AssetValidationLine[];
  readonly allPresent: boolean;
}

/**
 * Validates only what this pipeline actually tracks via AssetRegistry
 * — the two character models. Terrain, vegetation, and most
 * environment dressing in this project are procedurally generated
 * geometry (TerrainMesh, VegetationField, and similar), not loaded
 * asset files, so there is nothing real to check a "Terrain
 * Registered" line against; a report that printed one anyway would be
 * fabricating a check that doesn't correspond to any actual pipeline
 * step. If UI or audio assets are registered through AssetRegistry in
 * the future, extend this function's list rather than inventing
 * entries for things this project doesn't load this way.
 */
export function validateCoreAssets(assetRegistry: AssetRegistry): AssetValidationReport {
  const checks: readonly { label: string; assetId: string }[] = [
    { label: "Boy character model", assetId: CHARACTER_MODEL_ASSET_IDS.BOY },
    { label: "Girl character model", assetId: CHARACTER_MODEL_ASSET_IDS.GIRL },
  ];

  const lines = checks.map(({ label, assetId }) => ({
    isPresent: assetRegistry.has(assetId),
    label,
    assetId,
  }));

  return { lines, allPresent: lines.every((line) => line.isPresent) };
}

export function formatAssetValidationReport(report: AssetValidationReport): string {
  const lines = report.lines.map((line) =>
    line.isPresent
      ? `✓ ${line.label} registered (${line.assetId})`
      : `✗ Missing asset: ${line.label} (${line.assetId})`
  );
  return lines.join("\n");
}

/** Logs the report to the console — the "readable report" the debugging pass asked for. */
export function logAssetValidationReport(assetRegistry: AssetRegistry): AssetValidationReport {
  const report = validateCoreAssets(assetRegistry);
  console.log(`[AssetValidation]\n${formatAssetValidationReport(report)}`);
  if (!report.allPresent) {
    console.error(
      "[AssetValidation] One or more critical character assets are not registered — character loading will fail with UnknownAssetIdError until this route calls registerCharacterModelAssets()."
    );
  }
  return report;
}

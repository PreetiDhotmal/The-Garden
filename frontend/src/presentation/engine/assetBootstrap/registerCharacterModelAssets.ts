import { createAssetDescriptor } from "@/domain/engine/assets/AssetDescriptor";
import { AssetType } from "@/domain/engine/assets/AssetType";
import type { AssetRegistry } from "@/domain/engine/assets/AssetRegistry";
import {
  CHARACTER_MODEL_ASSET_IDS,
  CHARACTER_MODEL_URLS,
} from "@/presentation/character/characterModelAssets";

export interface AssetRegistrationReport {
  readonly registeredIds: readonly string[];
  readonly alreadyRegisteredIds: readonly string[];
}

/**
 * The single place every route should call to register the core
 * character models. Idempotent (checks .has() before .register())
 * so calling it from multiple mount points against the SAME
 * AssetRegistry instance is always safe — but note that a fresh
 * EngineProvider means a fresh, empty AssetRegistry, so this must
 * still be called once per independent EngineProvider tree, not just
 * once globally.
 */
export function registerCharacterModelAssets(
  assetRegistry: AssetRegistry
): AssetRegistrationReport {
  const registeredIds: string[] = [];
  const alreadyRegisteredIds: string[] = [];

  for (const assetId of Object.values(CHARACTER_MODEL_ASSET_IDS)) {
    if (assetRegistry.has(assetId)) {
      alreadyRegisteredIds.push(assetId);
      continue;
    }
    const url = CHARACTER_MODEL_URLS[assetId];
    if (!url) {
      // Should be unreachable — CHARACTER_MODEL_URLS is keyed by the
      // same CHARACTER_MODEL_ASSET_IDS values — but fail loudly rather
      // than registering a descriptor with an empty URL.
      console.error(`[AssetRegistration] No URL configured for character asset id "${assetId}".`);
      continue;
    }
    assetRegistry.register(
      createAssetDescriptor({ id: assetId, type: AssetType.MODEL, url, priority: "critical" })
    );
    registeredIds.push(assetId);
  }

  return { registeredIds, alreadyRegisteredIds };
}

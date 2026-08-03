import { createAssetDescriptor } from "@/domain/engine/assets/AssetDescriptor";
import { AssetType } from "@/domain/engine/assets/AssetType";
import type { AssetRegistry } from "@/domain/engine/assets/AssetRegistry";
import { ENVIRONMENT_PROPS } from "@/presentation/world/environmentPropAssets";

export interface AssetRegistrationReport {
  readonly registeredIds: readonly string[];
  readonly alreadyRegisteredIds: readonly string[];
}

/**
 * Same idempotent pattern as registerCharacterModelAssets — safe to
 * call redundantly against the same registry, and each route with its
 * own EngineProvider still needs its own call, exactly as characters
 * do. Priority "low" — decorative props should never compete with the
 * character models that gameplay actually depends on.
 */
export function registerEnvironmentPropAssets(
  assetRegistry: AssetRegistry
): AssetRegistrationReport {
  const registeredIds: string[] = [];
  const alreadyRegisteredIds: string[] = [];

  for (const prop of ENVIRONMENT_PROPS) {
    if (assetRegistry.has(prop.assetId)) {
      alreadyRegisteredIds.push(prop.assetId);
      continue;
    }
    assetRegistry.register(
      createAssetDescriptor({
        id: prop.assetId,
        type: AssetType.MODEL,
        url: prop.url,
        priority: "low",
      })
    );
    registeredIds.push(prop.assetId);
  }

  return { registeredIds, alreadyRegisteredIds };
}

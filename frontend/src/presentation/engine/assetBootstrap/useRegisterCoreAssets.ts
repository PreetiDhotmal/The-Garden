import { useEffect } from "react";
import { useEngine } from "@/presentation/engine/hooks/useEngine";
import { registerCharacterModelAssets } from "./registerCharacterModelAssets";

/**
 * Call this once near the top of any route that mounts its own
 * EngineProvider (a fresh EngineProvider means a fresh, empty
 * AssetRegistry) and needs character models available — Character
 * Selection, the Hub, and every level route. Logs what actually
 * happened so a registration gap is visible in the console
 * immediately, rather than surfacing later as an opaque
 * UnknownAssetError deep in a load() call.
 */
export function useRegisterCoreAssets(): void {
  const { assetRegistry } = useEngine();

  useEffect(() => {
    const report = registerCharacterModelAssets(assetRegistry);
    console.log(
      "[AssetRegistration] registered:",
      report.registeredIds,
      "already present:",
      report.alreadyRegisteredIds
    );
  }, [assetRegistry]);
}

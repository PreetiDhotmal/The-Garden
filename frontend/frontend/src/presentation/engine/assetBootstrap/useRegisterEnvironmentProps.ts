import { useEffect } from "react";
import { useEngine } from "@/presentation/engine/hooks/useEngine";
import { registerEnvironmentPropAssets } from "./registerEnvironmentPropAssets";

/** Call once near the top of any route that wants environment props available — same pattern as useRegisterCoreAssets. */
export function useRegisterEnvironmentProps(): void {
  const { assetRegistry } = useEngine();

  useEffect(() => {
    const report = registerEnvironmentPropAssets(assetRegistry);
    console.log(
      "[EnvironmentPropRegistration] registered:",
      report.registeredIds,
      "already present:",
      report.alreadyRegisteredIds
    );
  }, [assetRegistry]);
}

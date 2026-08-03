import type { ScriptureReference } from "@the-garden/shared-types";

export interface ScriptureDiscovery {
  readonly reference: ScriptureReference;
  readonly discoveredAtIso: string;
  /** Free-form context, e.g. "collectible:scroll-042" or "quest:garden-intro" — for a future discovery log/journal UI. */
  readonly context: string;
}

export function createScriptureDiscovery(
  reference: ScriptureReference,
  context: string
): ScriptureDiscovery {
  return { reference, discoveredAtIso: new Date().toISOString(), context };
}

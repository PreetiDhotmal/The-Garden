import type { ScriptureReference } from "@the-garden/shared-types";

export type ScriptureUnlockSource = "QUEST" | "COLLECTIBLE" | "INTERACTION" | "STARTING" | "SAVE_RESTORE";

export interface ScriptureUnlock {
  readonly reference: ScriptureReference;
  readonly source: ScriptureUnlockSource;
  readonly sourceId: string | null;
  readonly unlockedAtIso: string;
}

export function createScriptureUnlock(
  reference: ScriptureReference,
  source: ScriptureUnlockSource,
  sourceId: string | null = null
): ScriptureUnlock {
  return { reference, source, sourceId, unlockedAtIso: new Date().toISOString() };
}

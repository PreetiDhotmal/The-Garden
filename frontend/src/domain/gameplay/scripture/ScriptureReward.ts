import type { ScriptureReference } from "@the-garden/shared-types";
import type { ScriptureUnlockSource } from "./ScriptureUnlock";

export interface ScriptureReward {
  readonly reference: ScriptureReference;
  readonly source: ScriptureUnlockSource;
  readonly sourceId: string | null;
}

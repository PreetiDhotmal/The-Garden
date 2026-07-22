import type { ScriptureVerse } from "@the-garden/shared-types";

export interface ScriptureSearchQuery {
  readonly text: string;
  readonly translationCode: string;
  readonly limit?: number;
}

export interface ScriptureSearch {
  search: (query: ScriptureSearchQuery) => Promise<readonly ScriptureVerse[]>;
}

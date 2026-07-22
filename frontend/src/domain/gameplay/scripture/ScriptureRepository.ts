import type { ScriptureReference, ScriptureVerse } from "@the-garden/shared-types";
import type { Book, Chapter } from "./Book";
import type { ScriptureCollection } from "./ScriptureCollection";

/**
 * The domain-facing scripture port. Distinct from ScriptureProvider:
 * a ScriptureRepository implementation wraps a ScriptureProvider plus
 * caching, and adds domain-shaped queries (by collection/category)
 * that a raw data provider shouldn't need to know about.
 */
export interface ScriptureRepository {
  getVerse: (reference: ScriptureReference) => Promise<ScriptureVerse>;
  getVerses: (references: readonly ScriptureReference[]) => Promise<readonly ScriptureVerse[]>;
  getCollection: (collectionId: string) => Promise<ScriptureCollection | null>;
  listCollections: () => Promise<readonly ScriptureCollection[]>;
  listBooks: () => Promise<readonly Book[]>;
  listChapters: (bookName: string, translationCode: string) => Promise<readonly Chapter[]>;
}

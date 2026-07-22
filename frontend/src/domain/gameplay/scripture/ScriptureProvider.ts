import type { ScriptureReference, ScriptureVerse } from "@the-garden/shared-types";
import type { Book, Chapter } from "./Book";

/**
 * The single seam between gameplay and however scripture text is
 * actually sourced. `MockScriptureProvider` (infrastructure)
 * implements this now; a future `YouVersionScriptureProvider` will
 * implement the identical interface — no gameplay code changes when
 * that swap happens, only which provider is constructed.
 */
export interface ScriptureProvider {
  getVerse: (reference: ScriptureReference) => Promise<ScriptureVerse>;
  getChapter: (
    bookName: string,
    chapterNumber: number,
    translationCode: string
  ) => Promise<readonly ScriptureVerse[]>;
  listBooks: () => Promise<readonly Book[]>;
  getChapterInfo: (bookName: string, chapterNumber: number) => Promise<Chapter>;
  /** Every chapter in a book — the backing data for a Chapter Selector, distinct from getChapterInfo's single-chapter lookup. */
  listChapters: (bookName: string, translationCode: string) => Promise<readonly Chapter[]>;
}

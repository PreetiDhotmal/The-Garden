import type { ScriptureVerse } from "@the-garden/shared-types";
import type {
  ScriptureSearch,
  ScriptureSearchQuery,
} from "@/domain/gameplay/scripture/ScriptureSearch";
import { BIBLE_BOOK_NAMES } from "@/domain/gameplay/scripture/BibleBookNames";
import { OfflineScriptureStorage } from "./OfflineScriptureStorage";

/**
 * Searches only what's already available locally — cached verse text
 * (from prior reads) and book names. The real YouVersion Platform API
 * has no scripture search endpoint (confirmed by checking its full
 * endpoint index), so this is a deliberate, honest scope: it finds
 * what the player has already encountered, not the entire Bible.
 */
export class ClientSideScriptureSearch implements ScriptureSearch {
  private readonly offlineStorage = new OfflineScriptureStorage();

  async search(query: ScriptureSearchQuery): Promise<readonly ScriptureVerse[]> {
    await this.offlineStorage.recordSearch(query.text);
    const normalizedQuery = query.text.trim().toLowerCase();
    if (!normalizedQuery) {
      return [];
    }

    const cachedVerses = await this.offlineStorage.getAllVerses();
    const matches = cachedVerses.filter((verse) => this.matches(verse, normalizedQuery));

    return query.limit ? matches.slice(0, query.limit) : matches;
  }

  /** Book names matching the query — for "jump straight to this book" search suggestions, distinct from verse-text matches. */
  searchBookNames(query: string): readonly string[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return [];
    }
    return BIBLE_BOOK_NAMES.filter((book) => book.name.toLowerCase().includes(normalized)).map(
      (book) => book.name
    );
  }

  async getRecentSearches(): Promise<readonly string[]> {
    return this.offlineStorage.getSearchHistory();
  }

  private matches(verse: ScriptureVerse, normalizedQuery: string): boolean {
    return (
      verse.text.toLowerCase().includes(normalizedQuery) ||
      verse.reference.bookName.toLowerCase().includes(normalizedQuery)
    );
  }
}

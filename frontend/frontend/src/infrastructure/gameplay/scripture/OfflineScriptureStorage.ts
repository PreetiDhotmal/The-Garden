import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { ScriptureVerse } from "@the-garden/shared-types";
import { referenceKey } from "@/domain/gameplay/scripture/ScriptureFormatter";

const DB_NAME = "the-garden-scripture";
const DB_VERSION = 3;
const MAX_RECENTLY_READ = 30;

export interface BookmarkEntry {
  readonly key: string;
  readonly label: string;
  readonly savedAtIso: string;
}

interface RecentlyReadEntry {
  readonly key: string;
  readonly readAtIso: string;
  readonly sequence: number;
}

interface ScriptureDbSchema extends DBSchema {
  verses: { key: string; value: ScriptureVerse };
  recentlyRead: { key: string; value: RecentlyReadEntry; indexes: { bySequence: number } };
  favorites: { key: string; value: { key: string; addedAtIso: string } };
  bookmarks: { key: string; value: BookmarkEntry };
  searchHistory: {
    key: string;
    value: { query: string; searchedAtIso: string; sequence: number };
    indexes: { bySequence: number };
  };
}

const MAX_SEARCH_HISTORY = 15;

/**
 * `Date.now()`/`toISOString()` only has millisecond resolution — two
 * calls in the same millisecond (easily hit in tests, and possible in
 * real rapid-fire play) produce identical timestamps, making
 * IndexedDB index ordering ambiguous between them. A simple in-memory
 * monotonic counter guarantees strict ordering regardless of timing;
 * the ISO timestamp is kept alongside purely for display.
 */
let sequenceCounter = 0;
function nextSequence(): number {
  sequenceCounter += 1;
  return sequenceCounter;
}

let dbPromise: Promise<IDBPDatabase<ScriptureDbSchema>> | null = null;

function getDb(): Promise<IDBPDatabase<ScriptureDbSchema>> {
  dbPromise ??= openDB<ScriptureDbSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("verses")) {
        db.createObjectStore("verses");
      }
      if (db.objectStoreNames.contains("recentlyRead")) {
        db.deleteObjectStore("recentlyRead");
      }
      const recentlyReadStore = db.createObjectStore("recentlyRead", { keyPath: "key" });
      recentlyReadStore.createIndex("bySequence", "sequence");

      if (!db.objectStoreNames.contains("favorites")) {
        db.createObjectStore("favorites", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("bookmarks")) {
        db.createObjectStore("bookmarks", { keyPath: "key" });
      }
      if (db.objectStoreNames.contains("searchHistory")) {
        db.deleteObjectStore("searchHistory");
      }
      const searchHistoryStore = db.createObjectStore("searchHistory", { keyPath: "query" });
      searchHistoryStore.createIndex("bySequence", "sequence");
    },
  });
  return dbPromise;
}

/**
 * The offline/disk-storage tier: durable across sessions (unlike the
 * in-memory ScriptureCache from Milestone 4), and — unlike
 * localStorage — suited to the larger, structured dataset this
 * milestone asks for (cached verse text, reading history, favorites,
 * bookmarks all as separate indexed stores). Every method is async;
 * IndexedDB has no synchronous API.
 */
export class OfflineScriptureStorage {
  async saveVerse(verse: ScriptureVerse): Promise<void> {
    try {
      const db = await getDb();
      await db.put("verses", verse, referenceKey(verse.reference));
    } catch {
      // Best-effort: storage quota exceeded, private browsing, or IndexedDB
      // unavailable should never crash the app — offline caching degrades
      // gracefully to "not cached" rather than failing the read.
    }
  }

  async getVerse(key: string): Promise<ScriptureVerse | null> {
    try {
      const db = await getDb();
      return (await db.get("verses", key)) ?? null;
    } catch {
      return null;
    }
  }

  async recordRecentlyRead(key: string): Promise<void> {
    try {
      const db = await getDb();
      await db.put("recentlyRead", { key, readAtIso: new Date().toISOString(), sequence: nextSequence() });
      const all = await db.getAllFromIndex("recentlyRead", "bySequence");
      if (all.length > MAX_RECENTLY_READ) {
        const overflow = all.slice(0, all.length - MAX_RECENTLY_READ);
        await Promise.all(overflow.map((entry) => db.delete("recentlyRead", entry.key)));
      }
    } catch {
      // Best-effort, as above.
    }
  }

  async getRecentlyRead(): Promise<readonly string[]> {
    try {
      const db = await getDb();
      const all = await db.getAllFromIndex("recentlyRead", "bySequence");
      return all
        .slice()
        .reverse()
        .map((entry) => entry.key);
    } catch {
      return [];
    }
  }

  async toggleFavorite(key: string): Promise<boolean> {
    try {
      const db = await getDb();
      const existing = await db.get("favorites", key);
      if (existing) {
        await db.delete("favorites", key);
        return false;
      }
      await db.put("favorites", { key, addedAtIso: new Date().toISOString() });
      return true;
    } catch {
      return false;
    }
  }

  async isFavorite(key: string): Promise<boolean> {
    try {
      const db = await getDb();
      return (await db.get("favorites", key)) !== undefined;
    } catch {
      return false;
    }
  }

  async getFavorites(): Promise<readonly string[]> {
    try {
      const db = await getDb();
      const all = await db.getAll("favorites");
      return all.map((entry) => entry.key);
    } catch {
      return [];
    }
  }

  async addBookmark(key: string, label: string): Promise<void> {
    try {
      const db = await getDb();
      await db.put("bookmarks", { key, label, savedAtIso: new Date().toISOString() });
    } catch {
      // Best-effort, as above.
    }
  }

  async removeBookmark(key: string): Promise<void> {
    try {
      const db = await getDb();
      await db.delete("bookmarks", key);
    } catch {
      // Best-effort, as above.
    }
  }

  async getBookmarks(): Promise<readonly BookmarkEntry[]> {
    try {
      const db = await getDb();
      return await db.getAll("bookmarks");
    } catch {
      return [];
    }
  }

  async recordSearch(query: string): Promise<void> {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    try {
      const db = await getDb();
      await db.put("searchHistory", {
        query: trimmed,
        searchedAtIso: new Date().toISOString(),
        sequence: nextSequence(),
      });
      const all = await db.getAllFromIndex("searchHistory", "bySequence");
      if (all.length > MAX_SEARCH_HISTORY) {
        const overflow = all.slice(0, all.length - MAX_SEARCH_HISTORY);
        await Promise.all(overflow.map((entry) => db.delete("searchHistory", entry.query)));
      }
    } catch {
      // Best-effort, as above.
    }
  }

  async getSearchHistory(): Promise<readonly string[]> {
    try {
      const db = await getDb();
      const all = await db.getAllFromIndex("searchHistory", "bySequence");
      return all
        .slice()
        .reverse()
        .map((entry) => entry.query);
    } catch {
      return [];
    }
  }

  async getAllVerses(): Promise<readonly ScriptureVerse[]> {
    try {
      const db = await getDb();
      return await db.getAll("verses");
    } catch {
      return [];
    }
  }

  async clearAll(): Promise<void> {
    try {
      const db = await getDb();
      await Promise.all([
        db.clear("verses"),
        db.clear("recentlyRead"),
        db.clear("favorites"),
        db.clear("bookmarks"),
        db.clear("searchHistory"),
      ]);
    } catch {
      // Best-effort, as above.
    }
  }

  async countCachedVerses(): Promise<number> {
    try {
      const db = await getDb();
      return await db.count("verses");
    } catch {
      return 0;
    }
  }
}

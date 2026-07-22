import type { ScriptureReference, ScriptureVerse } from "@the-garden/shared-types";
import { ScriptureCategory } from "@/domain/gameplay/scripture/ScriptureCategory";
import type { ScriptureCollection } from "@/domain/gameplay/scripture/ScriptureCollection";
import type { ScriptureProvider } from "@/domain/gameplay/scripture/ScriptureProvider";
import type { ScriptureRepository } from "@/domain/gameplay/scripture/ScriptureRepository";
import { ScriptureCache } from "@/domain/gameplay/scripture/ScriptureCache";
import { formatReference, referenceKey } from "@/domain/gameplay/scripture/ScriptureFormatter";
import { NetworkStatus } from "./NetworkStatus";
import { OfflineScriptureStorage, type BookmarkEntry } from "./OfflineScriptureStorage";

/**
 * Our own curated groupings of verses per world/theme — this is game
 * design content, not something YouVersion's API provides, so it
 * stays defined here regardless of which ScriptureProvider is active.
 */
const CURATED_COLLECTIONS: readonly ScriptureCollection[] = [
  {
    id: "collection:garden-of-beginnings",
    title: "Seeds of Faith",
    category: ScriptureCategory.FAITH,
    references: [
      { bookName: "John", chapter: 3, verseStart: 16, verseEnd: null, translationCode: "NIV" },
      { bookName: "Proverbs", chapter: 3, verseStart: 5, verseEnd: 6, translationCode: "NIV" },
    ],
  },
  {
    id: "collection:wilderness-of-testing",
    title: "Courage in the Wilderness",
    category: ScriptureCategory.COURAGE,
    references: [
      { bookName: "Joshua", chapter: 1, verseStart: 9, verseEnd: null, translationCode: "NIV" },
    ],
  },
];

export class ScriptureFetchError extends Error {
  constructor(
    readonly reference: ScriptureReference,
    cause: unknown
  ) {
    super(`Failed to fetch scripture and no offline copy was available.`, { cause });
    this.name = "ScriptureFetchError";
  }
}

/**
 * The production ScriptureRepository implementation. Read path:
 * memory cache -> IndexedDB (works fully offline) -> network provider
 * (BackendScriptureProvider in production, MockScriptureProvider in
 * tests/local dev without a backend) -> on network success, write
 * through to both caches. If offline (or the network call fails) and
 * no offline copy exists, throws ScriptureFetchError — callers can
 * catch this to show a "verse unavailable offline" state rather than
 * a generic error.
 */
export class ScriptureRepositoryImpl implements ScriptureRepository {
  private readonly memoryCache = new ScriptureCache();
  private readonly offlineStorage = new OfflineScriptureStorage();
  private readonly networkStatus = new NetworkStatus();

  constructor(private readonly provider: ScriptureProvider) {}

  async getVerse(reference: ScriptureReference): Promise<ScriptureVerse> {
    const memoryHit = this.memoryCache.get(reference);
    if (memoryHit) {
      return memoryHit;
    }

    const key = referenceKey(reference);

    if (!this.networkStatus.isOnline()) {
      return this.requireOfflineCopy(reference, key);
    }

    try {
      const verse = await this.provider.getVerse(reference);
      this.memoryCache.set(verse);
      await this.offlineStorage.saveVerse(verse);
      await this.offlineStorage.recordRecentlyRead(key);
      return verse;
    } catch (error) {
      const offlineCopy = await this.offlineStorage.getVerse(key);
      if (offlineCopy) {
        return offlineCopy;
      }
      throw new ScriptureFetchError(reference, error);
    }
  }

  async getVerses(references: readonly ScriptureReference[]): Promise<readonly ScriptureVerse[]> {
    return Promise.all(references.map((reference) => this.getVerse(reference)));
  }

  getCollection(collectionId: string): Promise<ScriptureCollection | null> {
    return Promise.resolve(
      CURATED_COLLECTIONS.find((collection) => collection.id === collectionId) ?? null
    );
  }

  listCollections(): Promise<readonly ScriptureCollection[]> {
    return Promise.resolve(CURATED_COLLECTIONS);
  }

  async listBooks() {
    return this.provider.listBooks();
  }

  async listChapters(bookName: string, translationCode: string) {
    return this.provider.listChapters(bookName, translationCode);
  }

  isOnline(): boolean {
    return this.networkStatus.isOnline();
  }

  subscribeToNetworkStatus(listener: (isOnline: boolean) => void): () => void {
    return this.networkStatus.subscribe(listener);
  }

  async toggleFavorite(reference: ScriptureReference): Promise<boolean> {
    return this.offlineStorage.toggleFavorite(referenceKey(reference));
  }

  async isFavorite(reference: ScriptureReference): Promise<boolean> {
    return this.offlineStorage.isFavorite(referenceKey(reference));
  }

  async getFavoriteKeys(): Promise<readonly string[]> {
    return this.offlineStorage.getFavorites();
  }

  async getRecentlyReadKeys(): Promise<readonly string[]> {
    return this.offlineStorage.getRecentlyRead();
  }

  async addBookmark(reference: ScriptureReference): Promise<void> {
    await this.offlineStorage.addBookmark(referenceKey(reference), formatReference(reference));
  }

  async removeBookmark(reference: ScriptureReference): Promise<void> {
    await this.offlineStorage.removeBookmark(referenceKey(reference));
  }

  async getBookmarks(): Promise<readonly BookmarkEntry[]> {
    return this.offlineStorage.getBookmarks();
  }

  async getCachedVerseCount(): Promise<number> {
    return this.offlineStorage.countCachedVerses();
  }

  async clearOfflineData(): Promise<void> {
    await this.offlineStorage.clearAll();
  }

  private async requireOfflineCopy(
    reference: ScriptureReference,
    key: string
  ): Promise<ScriptureVerse> {
    const offlineCopy = await this.offlineStorage.getVerse(key);
    if (!offlineCopy) {
      throw new ScriptureFetchError(reference, new Error("Offline and no cached copy exists."));
    }
    return offlineCopy;
  }
}

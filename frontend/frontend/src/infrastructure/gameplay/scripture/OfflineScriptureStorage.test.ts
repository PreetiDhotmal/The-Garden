import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import type { ScriptureVerse } from "@the-garden/shared-types";
import { OfflineScriptureStorage } from "./OfflineScriptureStorage";

const SAMPLE_VERSE: ScriptureVerse = {
  reference: { bookName: "John", chapter: 3, verseStart: 16, verseEnd: null, translationCode: "NIV" },
  text: "For God so loved the world...",
  copyrightNotice: null,
};

describe("OfflineScriptureStorage", () => {
  beforeEach(async () => {
    const storage = new OfflineScriptureStorage();
    await storage.clearAll();
  });

  it("saves and retrieves a verse by its reference key", async () => {
    const storage = new OfflineScriptureStorage();
    await storage.saveVerse(SAMPLE_VERSE);

    const retrieved = await storage.getVerse("NIV:John 3:16");

    expect(retrieved).toEqual(SAMPLE_VERSE);
  });

  it("returns null for a key that was never saved", async () => {
    const storage = new OfflineScriptureStorage();
    expect(await storage.getVerse("NIV:Nowhere 1:1")).toBeNull();
  });

  it("records recently-read entries with the most recent first", async () => {
    const storage = new OfflineScriptureStorage();
    await storage.recordRecentlyRead("a");
    await storage.recordRecentlyRead("b");

    expect(await storage.getRecentlyRead()).toEqual(["b", "a"]);
  });

  it("moves a re-read entry back to the front instead of duplicating it", async () => {
    const storage = new OfflineScriptureStorage();
    await storage.recordRecentlyRead("a");
    await storage.recordRecentlyRead("b");
    await storage.recordRecentlyRead("a");

    expect(await storage.getRecentlyRead()).toEqual(["a", "b"]);
  });

  it("toggles a favorite on and off", async () => {
    const storage = new OfflineScriptureStorage();

    expect(await storage.toggleFavorite("NIV:John 3:16")).toBe(true);
    expect(await storage.getFavorites()).toContain("NIV:John 3:16");
    expect(await storage.isFavorite("NIV:John 3:16")).toBe(true);

    expect(await storage.toggleFavorite("NIV:John 3:16")).toBe(false);
    expect(await storage.getFavorites()).not.toContain("NIV:John 3:16");
  });

  it("adds and removes a bookmark", async () => {
    const storage = new OfflineScriptureStorage();
    await storage.addBookmark("NIV:John 3:16", "John 3:16");

    const bookmarks = await storage.getBookmarks();
    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0]).toMatchObject({ key: "NIV:John 3:16", label: "John 3:16" });

    await storage.removeBookmark("NIV:John 3:16");
    expect(await storage.getBookmarks()).toHaveLength(0);
  });

  it("counts cached verses", async () => {
    const storage = new OfflineScriptureStorage();
    expect(await storage.countCachedVerses()).toBe(0);

    await storage.saveVerse(SAMPLE_VERSE);

    expect(await storage.countCachedVerses()).toBe(1);
  });
});

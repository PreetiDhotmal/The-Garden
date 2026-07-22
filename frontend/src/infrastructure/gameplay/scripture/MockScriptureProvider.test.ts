import { describe, expect, it } from "vitest";
import { MockScriptureProvider, VerseNotFoundError } from "./MockScriptureProvider";

describe("MockScriptureProvider", () => {
  it("resolves a known verse", async () => {
    const provider = new MockScriptureProvider();
    const verse = await provider.getVerse({
      bookName: "John",
      chapter: 3,
      verseStart: 16,
      verseEnd: null,
      translationCode: "NIV",
    });
    expect(verse.text).toContain("God so loved the world");
  });

  it("rejects an unknown verse", async () => {
    const provider = new MockScriptureProvider();
    await expect(
      provider.getVerse({
        bookName: "Nowhere",
        chapter: 1,
        verseStart: 1,
        verseEnd: null,
        translationCode: "NIV",
      })
    ).rejects.toThrow(VerseNotFoundError);
  });

  it("lists the mock books", async () => {
    const provider = new MockScriptureProvider();
    const books = await provider.listBooks();
    expect(books.length).toBeGreaterThan(0);
  });
});

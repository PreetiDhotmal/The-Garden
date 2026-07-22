import type { ScriptureReference, ScriptureVerse } from "@the-garden/shared-types";
import type { Book, Chapter } from "@/domain/gameplay/scripture/Book";
import type { ScriptureProvider } from "@/domain/gameplay/scripture/ScriptureProvider";
import { referenceKey } from "@/domain/gameplay/scripture/ScriptureFormatter";

const MOCK_VERSES: readonly ScriptureVerse[] = [
  {
    reference: { bookName: "John", chapter: 3, verseStart: 16, verseEnd: null, translationCode: "NIV" },
    text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
    copyrightNotice: "Mock data — not licensed text.",
  },
  {
    reference: { bookName: "Psalm", chapter: 23, verseStart: 1, verseEnd: null, translationCode: "NIV" },
    text: "The Lord is my shepherd, I lack nothing.",
    copyrightNotice: "Mock data — not licensed text.",
  },
  {
    reference: { bookName: "Philippians", chapter: 4, verseStart: 13, verseEnd: null, translationCode: "NIV" },
    text: "I can do all this through him who gives me strength.",
    copyrightNotice: "Mock data — not licensed text.",
  },
  {
    reference: { bookName: "Joshua", chapter: 1, verseStart: 9, verseEnd: null, translationCode: "NIV" },
    text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
    copyrightNotice: "Mock data — not licensed text.",
  },
  {
    reference: { bookName: "Proverbs", chapter: 3, verseStart: 5, verseEnd: 6, translationCode: "NIV" },
    text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
    copyrightNotice: "Mock data — not licensed text.",
  },
];

const MOCK_BOOKS: readonly Book[] = [
  { name: "John", testament: "NEW", chapterCount: 21 },
  { name: "Psalm", testament: "OLD", chapterCount: 150 },
  { name: "Philippians", testament: "NEW", chapterCount: 4 },
  { name: "Joshua", testament: "OLD", chapterCount: 24 },
  { name: "Proverbs", testament: "OLD", chapterCount: 31 },
];

export class VerseNotFoundError extends Error {
  constructor(readonly reference: ScriptureReference) {
    super(`No mock verse found for "${referenceKey(reference)}".`);
    this.name = "VerseNotFoundError";
  }
}

/**
 * Implements ScriptureProvider against a small embedded verse list.
 * All methods return already-resolved promises so this is a drop-in
 * replacement for a real network-backed provider — no caller needs to
 * change when a YouVersion-backed provider replaces this.
 */
export class MockScriptureProvider implements ScriptureProvider {
  private readonly versesByKey = new Map<string, ScriptureVerse>(
    MOCK_VERSES.map((verse) => [referenceKey(verse.reference), verse])
  );

  getVerse(reference: ScriptureReference): Promise<ScriptureVerse> {
    const verse = this.versesByKey.get(referenceKey(reference));
    if (!verse) {
      return Promise.reject(new VerseNotFoundError(reference));
    }
    return Promise.resolve(verse);
  }

  getChapter(
    bookName: string,
    chapterNumber: number,
    translationCode: string
  ): Promise<readonly ScriptureVerse[]> {
    return Promise.resolve(
      MOCK_VERSES.filter(
        (verse) =>
          verse.reference.bookName === bookName &&
          verse.reference.chapter === chapterNumber &&
          verse.reference.translationCode === translationCode
      )
    );
  }

  listBooks(): Promise<readonly Book[]> {
    return Promise.resolve(MOCK_BOOKS);
  }

  getChapterInfo(bookName: string, chapterNumber: number): Promise<Chapter> {
    const verseCount = MOCK_VERSES.filter(
      (verse) => verse.reference.bookName === bookName && verse.reference.chapter === chapterNumber
    ).length;
    return Promise.resolve({ bookName, chapterNumber, verseCount });
  }

  listChapters(bookName: string, translationCode: string): Promise<readonly Chapter[]> {
    const chapterNumbers = new Set(
      MOCK_VERSES.filter(
        (verse) => verse.reference.bookName === bookName && verse.reference.translationCode === translationCode
      ).map((verse) => verse.reference.chapter)
    );
    return Promise.resolve(
      Array.from(chapterNumbers)
        .sort((a, b) => a - b)
        .map((chapterNumber) => ({
          bookName,
          chapterNumber,
          verseCount: MOCK_VERSES.filter(
            (verse) => verse.reference.bookName === bookName && verse.reference.chapter === chapterNumber
          ).length,
        }))
    );
  }
}

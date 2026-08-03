import type { ScriptureReference, ScriptureVerse } from "@the-garden/shared-types";
import type { Book, Chapter } from "@/domain/gameplay/scripture/Book";
import type { ScriptureProvider } from "@/domain/gameplay/scripture/ScriptureProvider";
import type { ApiClient } from "@/infrastructure/api/ApiClient";

export interface BibleVersionResponse {
  readonly translationCode: string;
  readonly title: string;
  readonly languageTag: string;
  readonly copyright: string;
}

interface BookResponse {
  readonly name: string;
  readonly fullTitle: string;
  readonly abbreviation: string;
  readonly canon: string;
}

interface ChapterResponse {
  readonly bookName: string;
  readonly chapterNumber: number;
  readonly verseCount: number;
}

/**
 * Implements ScriptureProvider (the same interface MockScriptureProvider
 * implements) against our backend's /api/scripture/* endpoints — which
 * in turn call the real YouVersion Platform API server-side. Gameplay
 * code depends only on ScriptureRepository/ScriptureProvider and never
 * knows this class, YouVersion, or our backend exist.
 */
export class BackendScriptureProvider implements ScriptureProvider {
  constructor(private readonly apiClient: ApiClient) {}

  async getVerse(reference: ScriptureReference): Promise<ScriptureVerse> {
    return this.apiClient.post<ScriptureVerse>("/scripture/verse", reference);
  }

  async getChapter(
    bookName: string,
    chapterNumber: number,
    translationCode: string
  ): Promise<readonly ScriptureVerse[]> {
    // The backend doesn't expose a dedicated "verses in a chapter" text
    // endpoint (YouVersion's own API separates chapter *metadata* from
    // passage *text* — see getChapterInfo), so this composes chapter
    // info with a single passage request covering every verse.
    const info = await this.getChapterInfo(bookName, chapterNumber);
    if (info.verseCount === 0) {
      return [];
    }
    const verse = await this.getVerse({
      bookName,
      chapter: chapterNumber,
      verseStart: 1,
      verseEnd: info.verseCount,
      translationCode,
    });
    return [verse];
  }

  async listBooks(): Promise<readonly Book[]> {
    const response = await this.apiClient.get<readonly BookResponse[]>(
      "/scripture/books?translationCode=BSB"
    );
    return response.map((book) => ({
      name: book.name,
      testament: inferTestament(book.canon),
      chapterCount: 0, // Not returned by the books listing; resolved per-book via getChapterInfo when needed.
    }));
  }

  async getChapterInfo(bookName: string, chapterNumber: number): Promise<Chapter> {
    const chapters = await this.apiClient.get<readonly ChapterResponse[]>(
      `/scripture/chapters?translationCode=BSB&bookName=${encodeURIComponent(bookName)}`
    );
    const match = chapters.find((chapter) => chapter.chapterNumber === chapterNumber);
    return {
      bookName,
      chapterNumber,
      verseCount: match?.verseCount ?? 0,
    };
  }

  async listChapters(bookName: string, translationCode: string): Promise<readonly Chapter[]> {
    const chapters = await this.apiClient.get<readonly ChapterResponse[]>(
      `/scripture/chapters?translationCode=${encodeURIComponent(translationCode)}&bookName=${encodeURIComponent(bookName)}`
    );
    return chapters.map((chapter) => ({
      bookName,
      chapterNumber: chapter.chapterNumber,
      verseCount: chapter.verseCount,
    }));
  }

  async listBibleVersions(): Promise<readonly BibleVersionResponse[]> {
    return this.apiClient.get<readonly BibleVersionResponse[]>("/scripture/versions?languages=en");
  }
}

function inferTestament(canon: string): "OLD" | "NEW" {
  return canon.toUpperCase().includes("NT") ? "NEW" : "OLD";
}

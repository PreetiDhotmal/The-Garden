import type { ScriptureReference } from "@the-garden/shared-types";

/** A book of the Bible, for browsing/selection UI — not the verse content itself. */
export interface Book {
  readonly name: string;
  readonly testament: "OLD" | "NEW";
  readonly chapterCount: number;
}

/** One chapter within a book — a container of verse numbers, not their text (fetched lazily via ScriptureProvider). */
export interface Chapter {
  readonly bookName: string;
  readonly chapterNumber: number;
  readonly verseCount: number;
}

export function referenceWithinChapter(reference: ScriptureReference, chapter: Chapter): boolean {
  return reference.bookName === chapter.bookName && reference.chapter === chapter.chapterNumber;
}

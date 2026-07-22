import type { ScriptureReference, ScriptureVerse } from "@the-garden/shared-types";

/** "John 3:16" or "John 3:16-18" for a verse range. */
export function formatReference(reference: ScriptureReference): string {
  const verseSpan =
    reference.verseEnd !== null && reference.verseEnd !== reference.verseStart
      ? `${reference.verseStart.toString()}-${reference.verseEnd.toString()}`
      : reference.verseStart.toString();
  return `${reference.bookName} ${reference.chapter.toString()}:${verseSpan}`;
}

/** A stable, unique string key for a reference — safe to use as a Map/cache key. Includes translation, since the same verse range differs by translation. */
export function referenceKey(reference: ScriptureReference): string {
  return `${reference.translationCode}:${formatReference(reference)}`;
}

export function formatVerseWithReference(verse: ScriptureVerse): string {
  return `"${verse.text}" — ${formatReference(verse.reference)}`;
}

const REFERENCE_KEY_PATTERN = /^([^:]+):(.+) (\d+):(\d+)(?:-(\d+))?$/;

export class InvalidReferenceKeyError extends Error {
  constructor(readonly key: string) {
    super(`Could not parse "${key}" as a scripture reference key.`);
    this.name = "InvalidReferenceKeyError";
  }
}

/**
 * The formal inverse of referenceKey — needed anywhere a UI has only a
 * stored key string (reading history, bookmarks, favorites) and needs
 * a fetchable ScriptureReference back. Kept alongside referenceKey so
 * the two stay in sync if the key format ever changes.
 */
export function parseReferenceKey(key: string): ScriptureReference {
  const match = REFERENCE_KEY_PATTERN.exec(key);
  if (!match) {
    throw new InvalidReferenceKeyError(key);
  }
  const [, translationCode, bookName, chapter, verseStart, verseEnd] = match;
  if (!translationCode || !bookName || !chapter || !verseStart) {
    throw new InvalidReferenceKeyError(key);
  }
  return {
    translationCode,
    bookName,
    chapter: Number.parseInt(chapter, 10),
    verseStart: Number.parseInt(verseStart, 10),
    verseEnd: verseEnd ? Number.parseInt(verseEnd, 10) : null,
  };
}

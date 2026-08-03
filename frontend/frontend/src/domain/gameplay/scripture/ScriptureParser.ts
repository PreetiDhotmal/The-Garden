import type { ScriptureReference } from "@the-garden/shared-types";

export class InvalidReferenceStringError extends Error {
  constructor(readonly input: string) {
    super(
      `Could not parse "${input}" as a scripture reference (expected e.g. "John 3:16" or "John 3:16-18").`
    );
    this.name = "InvalidReferenceStringError";
  }
}

const REFERENCE_PATTERN = /^([1-3]?\s?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?$/;

/**
 * Parses "John 3:16" / "1 John 3:16-18" into a ScriptureReference.
 * `translationCode` isn't part of the string format (it's selected
 * elsewhere, e.g. a translation picker), so it must be supplied.
 */
export function parseReferenceString(input: string, translationCode: string): ScriptureReference {
  const trimmed = input.trim();
  const match = REFERENCE_PATTERN.exec(trimmed);
  if (!match) {
    throw new InvalidReferenceStringError(input);
  }

  const [, bookNameRaw, chapterRaw, verseStartRaw, verseEndRaw] = match;
  if (!bookNameRaw || !chapterRaw || !verseStartRaw) {
    throw new InvalidReferenceStringError(input);
  }

  return {
    bookName: bookNameRaw.trim(),
    chapter: Number.parseInt(chapterRaw, 10),
    verseStart: Number.parseInt(verseStartRaw, 10),
    verseEnd: verseEndRaw ? Number.parseInt(verseEndRaw, 10) : null,
    translationCode,
  };
}

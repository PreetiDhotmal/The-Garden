/**
 * Mirrors backend DTO: com.thegarden.application.dto.ScriptureReferenceDto
 */
export interface ScriptureReference {
  readonly bookName: string;
  readonly chapter: number;
  readonly verseStart: number;
  readonly verseEnd: number | null;
  readonly translationCode: string;
}

/**
 * Mirrors backend DTO: com.thegarden.application.dto.ScriptureVerseDto
 * Represents a resolved verse of text, typically sourced from the
 * YouVersion Bible API via the backend infrastructure layer.
 */
export interface ScriptureVerse {
  readonly reference: ScriptureReference;
  readonly text: string;
  readonly copyrightNotice: string | null;
}

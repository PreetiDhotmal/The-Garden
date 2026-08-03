import { describe, expect, it } from "vitest";
import type { ScriptureReference } from "@the-garden/shared-types";
import { formatReference, InvalidReferenceKeyError, parseReferenceKey, referenceKey } from "./ScriptureFormatter";
import { InvalidReferenceStringError, parseReferenceString } from "./ScriptureParser";

describe("formatReference", () => {
  it("formats a single-verse reference", () => {
    const reference: ScriptureReference = {
      bookName: "John",
      chapter: 3,
      verseStart: 16,
      verseEnd: null,
      translationCode: "NIV",
    };
    expect(formatReference(reference)).toBe("John 3:16");
  });

  it("formats a verse-range reference", () => {
    const reference: ScriptureReference = {
      bookName: "John",
      chapter: 3,
      verseStart: 16,
      verseEnd: 18,
      translationCode: "NIV",
    };
    expect(formatReference(reference)).toBe("John 3:16-18");
  });
});

describe("referenceKey", () => {
  it("includes translation so the same verse differs by translation", () => {
    const base: ScriptureReference = {
      bookName: "John",
      chapter: 3,
      verseStart: 16,
      verseEnd: null,
      translationCode: "NIV",
    };
    const other: ScriptureReference = { ...base, translationCode: "ESV" };
    expect(referenceKey(base)).not.toBe(referenceKey(other));
  });
});

describe("parseReferenceKey", () => {
  it("round-trips a single-verse key", () => {
    const original: ScriptureReference = {
      bookName: "John",
      chapter: 3,
      verseStart: 16,
      verseEnd: null,
      translationCode: "NIV",
    };
    expect(parseReferenceKey(referenceKey(original))).toEqual(original);
  });

  it("round-trips a verse-range key", () => {
    const original: ScriptureReference = {
      bookName: "Proverbs",
      chapter: 3,
      verseStart: 5,
      verseEnd: 6,
      translationCode: "NIV",
    };
    expect(parseReferenceKey(referenceKey(original))).toEqual(original);
  });

  it("round-trips a multi-word book name", () => {
    const original: ScriptureReference = {
      bookName: "Song of Solomon",
      chapter: 2,
      verseStart: 1,
      verseEnd: null,
      translationCode: "NIV",
    };
    expect(parseReferenceKey(referenceKey(original))).toEqual(original);
  });

  it("throws on a malformed key", () => {
    expect(() => parseReferenceKey("not-a-valid-key")).toThrow(InvalidReferenceKeyError);
  });
});

describe("parseReferenceString", () => {
  it("parses a single-verse reference", () => {
    const reference = parseReferenceString("John 3:16", "NIV");
    expect(reference).toEqual({
      bookName: "John",
      chapter: 3,
      verseStart: 16,
      verseEnd: null,
      translationCode: "NIV",
    });
  });

  it("parses a verse-range reference", () => {
    const reference = parseReferenceString("John 3:16-18", "NIV");
    expect(reference.verseEnd).toBe(18);
  });

  it("parses a numbered book name", () => {
    const reference = parseReferenceString("1 John 3:16", "NIV");
    expect(reference.bookName).toBe("1 John");
  });

  it("throws on malformed input", () => {
    expect(() => parseReferenceString("not a reference", "NIV")).toThrow(
      InvalidReferenceStringError
    );
  });

  it("round-trips through formatReference", () => {
    const original = "John 3:16-18";
    const reference = parseReferenceString(original, "NIV");
    expect(formatReference(reference)).toBe(original);
  });
});

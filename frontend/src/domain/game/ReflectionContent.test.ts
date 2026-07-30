import { describe, expect, it } from "vitest";
import {
  DuplicateReflectionContentError,
  ReflectionContentRegistry,
  UnknownReflectionContentError,
} from "./ReflectionContent";

function buildRegistry() {
  const registry = new ReflectionContentRegistry();
  registry.register({
    levelId: "level:communication",
    lessonText: "Understanding takes both a voice and an ear.",
    summaryText: "You restored the aqueduct together.",
    scriptureReference: {
      bookName: "James",
      chapter: 1,
      verseStart: 19,
      verseEnd: 19,
      translationCode: "NIV",
    },
  });
  return registry;
}

describe("ReflectionContentRegistry", () => {
  it("retrieves registered content by level id", () => {
    const registry = buildRegistry();
    const content = registry.get("level:communication");
    expect(content.lessonText).toBe("Understanding takes both a voice and an ear.");
  });

  it("has() reports registration state correctly", () => {
    const registry = buildRegistry();
    expect(registry.has("level:communication")).toBe(true);
    expect(registry.has("level:trust")).toBe(false);
  });

  it("throws UnknownReflectionContentError for an unregistered level", () => {
    const registry = buildRegistry();
    expect(() => registry.get("level:trust")).toThrow(UnknownReflectionContentError);
  });

  it("throws DuplicateReflectionContentError registering the same level twice", () => {
    const registry = buildRegistry();
    expect(() => {
      registry.register({
        levelId: "level:communication",
        lessonText: "x",
        summaryText: "x",
        scriptureReference: null,
      });
    }).toThrow(DuplicateReflectionContentError);
  });

  it("supports a null scriptureReference for levels without an optional passage", () => {
    const registry = new ReflectionContentRegistry();
    registry.register({
      levelId: "level:teamwork",
      lessonText: "Two are better than one.",
      summaryText: "You rejoined the paths.",
      scriptureReference: null,
    });
    expect(registry.get("level:teamwork").scriptureReference).toBeNull();
  });
});

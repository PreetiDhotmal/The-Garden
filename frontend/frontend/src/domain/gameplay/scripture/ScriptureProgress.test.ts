import { describe, expect, it } from "vitest";
import type { ScriptureReference } from "@the-garden/shared-types";
import { ScriptureProgress } from "./ScriptureProgress";

const JOHN_3_16: ScriptureReference = {
  bookName: "John",
  chapter: 3,
  verseStart: 16,
  verseEnd: null,
  translationCode: "NIV",
};

describe("ScriptureProgress", () => {
  it("starts empty", () => {
    const progress = ScriptureProgress.empty();
    expect(progress.isUnlocked(JOHN_3_16)).toBe(false);
    expect(progress.unlockedCount()).toBe(0);
  });

  it("unlock() is idempotent and immutable", () => {
    const original = ScriptureProgress.empty();
    const unlocked = original.unlock(JOHN_3_16, "QUEST", "quest-1");

    expect(original.isUnlocked(JOHN_3_16)).toBe(false);
    expect(unlocked.isUnlocked(JOHN_3_16)).toBe(true);
    expect(unlocked.unlock(JOHN_3_16, "QUEST").unlockedCount()).toBe(1);
  });

  it("discover() tracks discovery separately from unlock", () => {
    const progress = ScriptureProgress.empty().discover(JOHN_3_16, "collectible:scroll-1");
    expect(progress.isDiscovered(JOHN_3_16)).toBe(true);
    expect(progress.isUnlocked(JOHN_3_16)).toBe(false);
  });

  it("becomes memorized after enough reviews", () => {
    let progress = ScriptureProgress.empty();
    for (let i = 0; i < 5; i += 1) {
      progress = progress.reviewForMemory(JOHN_3_16);
    }
    expect(progress.isMemorized(JOHN_3_16)).toBe(true);
    expect(progress.getMemory(JOHN_3_16)?.repetitions).toBe(5);
  });

  it("is not memorized before enough reviews", () => {
    const progress = ScriptureProgress.empty().reviewForMemory(JOHN_3_16);
    expect(progress.isMemorized(JOHN_3_16)).toBe(false);
  });

  it("counts unlocked/discovered/memorized independently", () => {
    let progress = ScriptureProgress.empty();
    progress = progress.unlock(JOHN_3_16, "QUEST");
    progress = progress.discover(JOHN_3_16, "quest:1");

    expect(progress.unlockedCount()).toBe(1);
    expect(progress.discoveredCount()).toBe(1);
    expect(progress.memorizedCount()).toBe(0);
  });

  it("lists unlocked/discovered/memorized reference keys", () => {
    let progress = ScriptureProgress.empty();
    progress = progress.unlock(JOHN_3_16, "QUEST");
    progress = progress.discover(JOHN_3_16, "quest:1");
    for (let i = 0; i < 5; i += 1) {
      progress = progress.reviewForMemory(JOHN_3_16);
    }

    expect(progress.listUnlockedKeys()).toEqual(["NIV:John 3:16"]);
    expect(progress.listDiscoveredKeys()).toEqual(["NIV:John 3:16"]);
    expect(progress.listMemorizedKeys()).toEqual(["NIV:John 3:16"]);
  });

  it("restore() rebuilds equivalent progress from saved key lists", () => {
    const restored = ScriptureProgress.restore(["NIV:John 3:16"], ["NIV:John 3:16"], ["NIV:John 3:16"]);

    expect(restored.isUnlocked(JOHN_3_16)).toBe(true);
    expect(restored.isDiscovered(JOHN_3_16)).toBe(true);
    expect(restored.isMemorized(JOHN_3_16)).toBe(true);
  });

  it("restore() with empty lists produces empty progress", () => {
    const restored = ScriptureProgress.restore([], [], []);
    expect(restored.unlockedCount()).toBe(0);
  });
});

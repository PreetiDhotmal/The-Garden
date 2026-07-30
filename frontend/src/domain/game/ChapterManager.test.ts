import { describe, expect, it } from "vitest";
import type { WorldProgressionQueryContext } from "@/domain/gameplay/progression/WorldUnlockCondition";
import { WorldProgressionStatus } from "@/domain/gameplay/progression/WorldProgressionManager";
import { ChapterManager, DuplicateChapterOrderError } from "./ChapterManager";

function createContext(
  overrides: Partial<WorldProgressionQueryContext> = {}
): WorldProgressionQueryContext {
  return {
    getQuestStatus: () => null,
    isScriptureUnlocked: () => false,
    hasStoryFlag: () => false,
    ...overrides,
  };
}

function registerTwoChapters(manager: ChapterManager): void {
  manager.registerAll([
    {
      chapterId: "chapter:communication",
      displayName: "Communication",
      order: 0,
      progression: {
        worldRegionId: "chapter:communication",
        displayName: "Communication",
        unlockConditions: [],
        completionConditions: [{ kind: "QUEST_COMPLETED", questId: "quest:communication" }],
        isFutureDlc: false,
      },
    },
    {
      chapterId: "chapter:trust",
      displayName: "Trust",
      order: 1,
      progression: {
        worldRegionId: "chapter:trust",
        displayName: "Trust",
        unlockConditions: [{ kind: "QUEST_COMPLETED", questId: "quest:communication" }],
        completionConditions: [{ kind: "QUEST_COMPLETED", questId: "quest:trust" }],
        isFutureDlc: false,
      },
    },
  ]);
}

describe("ChapterManager", () => {
  it("rejects two chapters registered with the same order", () => {
    const manager = new ChapterManager();
    registerTwoChapters(manager);
    expect(() => {
      manager.register({
        chapterId: "chapter:patience",
        displayName: "Patience",
        order: 0,
        progression: {
          worldRegionId: "chapter:patience",
          displayName: "Patience",
          unlockConditions: [],
          completionConditions: [],
          isFutureDlc: false,
        },
      });
    }).toThrow(DuplicateChapterOrderError);
  });

  it("lists chapters in fixed order regardless of registration order", () => {
    const manager = new ChapterManager();
    registerTwoChapters(manager);
    const ordered = manager.listInOrder(createContext());
    expect(ordered.map((c) => c.definition.chapterId)).toEqual([
      "chapter:communication",
      "chapter:trust",
    ]);
  });

  it("getNextChapter returns the first not-yet-completed chapter", () => {
    const manager = new ChapterManager();
    registerTwoChapters(manager);
    const next = manager.getNextChapter(createContext());
    expect(next?.chapterId).toBe("chapter:communication");
  });

  it("getNextChapter advances once the first chapter completes", () => {
    const manager = new ChapterManager();
    registerTwoChapters(manager);
    const context = createContext({
      getQuestStatus: (id) => (id === "quest:communication" ? "COMPLETED" : null),
    });
    const next = manager.getNextChapter(context);
    expect(next?.chapterId).toBe("chapter:trust");
  });

  it("getNextChapter returns null once every chapter is completed", () => {
    const manager = new ChapterManager();
    registerTwoChapters(manager);
    const context = createContext({ getQuestStatus: () => "COMPLETED" });
    expect(manager.getNextChapter(context)).toBeNull();
  });

  it("listReplayable never regresses once a chapter has been completed", () => {
    const manager = new ChapterManager();
    registerTwoChapters(manager);
    const completedContext = createContext({
      getQuestStatus: (id) => (id === "quest:communication" ? "COMPLETED" : null),
    });
    manager.listInOrder(completedContext);

    const laterContext = createContext();
    const replayable = manager.listReplayable(laterContext);
    expect(replayable.map((c) => c.chapterId)).toContain("chapter:communication");
  });

  it("getStatus delegates to the underlying WorldProgressionManager correctly", () => {
    const manager = new ChapterManager();
    registerTwoChapters(manager);
    expect(manager.getStatus("chapter:trust", createContext())).toBe(
      WorldProgressionStatus.LOCKED
    );
  });
});

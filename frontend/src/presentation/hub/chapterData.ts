import type { ChapterDefinition } from "@/domain/game/ChapterManager";
import type { ChapterRestorationEntry } from "@/domain/game/GardenRestorationManager";
import type { ReflectionContent } from "@/domain/game/ReflectionContent";
import { DORMANT_RESTORATION_PROFILE } from "@/domain/game/RestorationProfile";

export interface ChapterMeta {
  readonly chapterId: string;
  readonly displayName: string;
  readonly lessonSummary: string;
  readonly estimatedMinutes: number;
  readonly difficulty: "GENTLE" | "MODERATE" | "CHALLENGING";
}

export function completedFlag(chapterId: string): string {
  return `chapter-complete:${chapterId}`;
}

/**
 * The chapter popup's "short description" line - distinct from
 * ChapterMeta.lessonSummary, which is reused elsewhere (the
 * Reflection screen's one-line lesson, the Scripture Wall) for a
 * different, terser purpose. Falls back to lessonSummary for any
 * chapter without an explicit entry here.
 */
export const CHAPTER_POPUP_DESCRIPTIONS: ReadonlyMap<string, string> = new Map([
  ["chapter:communication", "Learn to listen, speak with grace, and build deeper connections."],
]);

/**
 * Maps a chapter to its playable level route. A chapter missing from
 * this map has no gameplay built yet (see chapterData.ts's own
 * comment on CHAPTER_ORDER) - the Hub route checks this map's
 * presence, not a hardcoded if/else chain, so adding a new playable
 * chapter is exactly one new entry here.
 */
export const CHAPTER_LEVEL_ROUTES: ReadonlyMap<string, string> = new Map([
  ["chapter:communication", "/level/communication"],
  ["chapter:trust", "/level/trust"],
]);

const CHAPTER_ORDER: readonly {
  chapterId: string;
  displayName: string;
  lessonSummary: string;
  estimatedMinutes: number;
  difficulty: ChapterMeta["difficulty"];
}[] = [
  {
    chapterId: "chapter:communication",
    displayName: "Communication",
    lessonSummary: "Understanding takes both a voice and an ear.",
    estimatedMinutes: 12,
    difficulty: "GENTLE",
  },
  {
    chapterId: "chapter:trust",
    displayName: "Trust",
    lessonSummary: "Trust grows stronger when we choose to rely on one another.",
    estimatedMinutes: 14,
    difficulty: "GENTLE",
  },
  {
    chapterId: "chapter:patience",
    displayName: "Patience",
    lessonSummary: "Love is patient.",
    estimatedMinutes: 12,
    difficulty: "MODERATE",
  },
  {
    chapterId: "chapter:sacrifice",
    displayName: "Sacrifice",
    lessonSummary: "Greater love has no one than this.",
    estimatedMinutes: 16,
    difficulty: "MODERATE",
  },
  {
    chapterId: "chapter:forgiveness",
    displayName: "Forgiveness",
    lessonSummary: "Love keeps no record of wrongs.",
    estimatedMinutes: 15,
    difficulty: "MODERATE",
  },
  {
    chapterId: "chapter:teamwork",
    displayName: "Teamwork",
    lessonSummary: "Two are better than one.",
    estimatedMinutes: 18,
    difficulty: "MODERATE",
  },
  {
    chapterId: "chapter:stewardship",
    displayName: "Stewardship",
    lessonSummary: "Whoever is faithful in little is faithful in much.",
    estimatedMinutes: 16,
    difficulty: "MODERATE",
  },
  {
    chapterId: "chapter:conflict-resolution",
    displayName: "Conflict Resolution",
    lessonSummary: "Be quick to listen, slow to speak, slow to become angry.",
    estimatedMinutes: 18,
    difficulty: "CHALLENGING",
  },
  {
    chapterId: "chapter:serving-one-another",
    displayName: "Serving One Another",
    lessonSummary: "Use whatever gift you have to serve others.",
    estimatedMinutes: 20,
    difficulty: "CHALLENGING",
  },
  {
    chapterId: "chapter:the-garden",
    displayName: "The Garden",
    lessonSummary: "The greatest of these is love.",
    estimatedMinutes: 14,
    difficulty: "GENTLE",
  },
];

export const CHAPTER_META_BY_ID: ReadonlyMap<string, ChapterMeta> = new Map(
  CHAPTER_ORDER.map((entry) => [
    entry.chapterId,
    {
      chapterId: entry.chapterId,
      displayName: entry.displayName,
      lessonSummary: entry.lessonSummary,
      estimatedMinutes: entry.estimatedMinutes,
      difficulty: entry.difficulty,
    },
  ])
);

/** ChapterManager registrations — each chapter (after the first) unlocks only once the previous chapter's completion story flag is set, matching GDD 7.2's fixed first-playthrough order. */
export const CHAPTER_DEFINITIONS: readonly ChapterDefinition[] = CHAPTER_ORDER.map(
  (entry, index) => {
    const previous = CHAPTER_ORDER[index - 1];
    return {
      chapterId: entry.chapterId,
      displayName: entry.displayName,
      order: index,
      progression: {
        worldRegionId: entry.chapterId,
        displayName: entry.displayName,
        unlockConditions: previous
          ? [{ kind: "STORY_FLAG" as const, flag: completedFlag(previous.chapterId) }]
          : [],
        completionConditions: [{ kind: "STORY_FLAG" as const, flag: completedFlag(entry.chapterId) }],
        isFutureDlc: false,
      },
    };
  }
);

/**
 * One Hub zone per chapter, radially arranged around the center
 * fountain (GDD Section 3.1). Restoration profiles are intentionally
 * modest placeholders (a visible-but-not-dramatic bloom) rather than
 * the specific per-category tuning each chapter's real Garden
 * Restoration effect will need — that tuning belongs with each
 * chapter's actual content in a future milestone, not the Hub shell.
 */
export const CHAPTER_RESTORATION_ENTRIES: readonly ChapterRestorationEntry[] = CHAPTER_ORDER.map(
  (entry) => ({
    chapterId: entry.chapterId,
    zoneId: `hub-zone:${entry.chapterId}`,
    profile: {
      ...DORMANT_RESTORATION_PROFILE,
      flowerDensity: 0.7,
      treeCanopyDensity: 0.8,
      waterLevel: 0.6,
      bridgeStable: true,
      lightingWarmth: 0.7,
      particleDensity: 0.6,
      animalPresence: 0.5,
    },
  })
);

/**
 * Reuses each chapter's existing lessonSummary (already the exact
 * one-sentence reflection line — "Understanding takes both a voice
 * and an ear" for Communication — rather than duplicating it as
 * separate reflection-specific text) as ReflectionContent's
 * lessonText. scriptureReference is only set for chapters whose
 * level content actually exists yet (Communication, Trust); every
 * other chapter's gameplay doesn't exist, so registering a scripture
 * link for it would be presenting something as ready that isn't.
 */

export interface ChapterScriptureEntry {
  readonly chapterId: string;
  readonly reference: { bookName: string; chapter: number; verseStart: number; verseEnd: number };
  readonly fallbackVerseText: string;
  readonly reflection: string;
  /** Only true for chapters with real, playable level content - every other entry exists so the table is ready for a future chapter without code changes, but is not wired into any UI yet. */
  readonly isImplemented: boolean;
}

/**
 * The reusable scripture reference for every chapter, per GDD-style
 * mapping - one entry per chapter regardless of build status, so
 * adding a chapter's gameplay later only requires flipping
 * isImplemented, not adding a new table.
 */
export const CHAPTER_SCRIPTURE_TABLE: readonly ChapterScriptureEntry[] = [
  {
    chapterId: "chapter:communication",
    reference: { bookName: "Colossians", chapter: 4, verseStart: 6, verseEnd: 6 },
    fallbackVerseText:
      "Let your conversation be always full of grace, seasoned with salt, so that you may know how to answer everyone.",
    reflection: "Strong communication grows when we listen carefully and speak with grace.",
    isImplemented: true,
  },
  {
    chapterId: "chapter:trust",
    reference: { bookName: "Proverbs", chapter: 3, verseStart: 5, verseEnd: 6 },
    fallbackVerseText:
      "Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
    reflection: "Trust grows stronger when we choose to rely on one another.",
    isImplemented: true,
  },
  {
    chapterId: "chapter:patience",
    reference: { bookName: "James", chapter: 1, verseStart: 2, verseEnd: 4 },
    fallbackVerseText:
      "Consider it pure joy whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance.",
    reflection: "Patience is grown, not given — one trial at a time.",
    isImplemented: false,
  },
  {
    chapterId: "chapter:sacrifice",
    reference: { bookName: "John", chapter: 15, verseStart: 13, verseEnd: 13 },
    fallbackVerseText: "Greater love has no one than this: to lay down one's life for one's friends.",
    reflection: "Love is proven in what we're willing to give up for one another.",
    isImplemented: false,
  },
  {
    chapterId: "chapter:forgiveness",
    reference: { bookName: "Colossians", chapter: 3, verseStart: 13, verseEnd: 13 },
    fallbackVerseText:
      "Bear with each other and forgive one another if any of you has a grievance against someone. Forgive as the Lord forgave you.",
    reflection: "Forgiveness is a choice we make again, not a feeling we wait for.",
    isImplemented: false,
  },
  {
    chapterId: "chapter:teamwork",
    reference: { bookName: "Psalm", chapter: 133, verseStart: 1, verseEnd: 1 },
    fallbackVerseText: "How good and pleasant it is when God's people live together in unity!",
    reflection: "Two are better than one — together we carry what neither could alone.",
    isImplemented: false,
  },
  {
    chapterId: "chapter:stewardship",
    reference: { bookName: "Matthew", chapter: 25, verseStart: 21, verseEnd: 21 },
    fallbackVerseText: "Well done, good and faithful servant! You have been faithful with a few things.",
    reflection: "Faithfulness in little things is what much is built on.",
    isImplemented: false,
  },
  {
    chapterId: "chapter:conflict-resolution",
    reference: { bookName: "Matthew", chapter: 18, verseStart: 15, verseEnd: 15 },
    fallbackVerseText:
      "If your brother or sister sins, go and point out their fault, just between the two of you.",
    reflection: "Peace is made, not avoided — quick to listen, slow to anger.",
    isImplemented: false,
  },
  {
    chapterId: "chapter:serving-one-another",
    reference: { bookName: "Mark", chapter: 10, verseStart: 45, verseEnd: 45 },
    fallbackVerseText:
      "For even the Son of Man did not come to be served, but to serve, and to give his life as a ransom for many.",
    reflection: "The greatest among us are the ones who serve.",
    isImplemented: false,
  },
  {
    chapterId: "chapter:the-garden",
    reference: { bookName: "Revelation", chapter: 21, verseStart: 4, verseEnd: 4 },
    fallbackVerseText:
      "He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain.",
    reflection: "The garden restored — every tear wiped away, made new together.",
    isImplemented: false,
  },
];

export function getChapterScripture(chapterId: string): ChapterScriptureEntry | null {
  return CHAPTER_SCRIPTURE_TABLE.find((entry) => entry.chapterId === chapterId) ?? null;
}

export const CHAPTER_REFLECTION_CONTENT: readonly ReflectionContent[] = CHAPTER_ORDER.map(
  (entry) => {
    const scripture = getChapterScripture(entry.chapterId);
    return {
      levelId: entry.chapterId,
      lessonText: entry.lessonSummary,
      summaryText: `You completed ${entry.displayName} together.`,
      scriptureReference:
        scripture?.isImplemented
          ? {
              bookName: scripture.reference.bookName,
              chapter: scripture.reference.chapter,
              verseStart: scripture.reference.verseStart,
              verseEnd: scripture.reference.verseEnd,
              translationCode: "NIV",
            }
          : null,
    };
  }
);

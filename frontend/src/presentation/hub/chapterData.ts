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
 * level content actually exists yet (Communication); every other
 * chapter's gameplay doesn't exist, so registering a scripture link
 * for it would be presenting something as ready that isn't.
 */
export const CHAPTER_REFLECTION_CONTENT: readonly ReflectionContent[] = CHAPTER_ORDER.map(
  (entry) => ({
    levelId: entry.chapterId,
    lessonText: entry.lessonSummary,
    summaryText: `You completed ${entry.displayName} together.`,
    scriptureReference:
      entry.chapterId === "chapter:communication"
        ? { bookName: "James", chapter: 1, verseStart: 19, verseEnd: 19, translationCode: "NIV" }
        : null,
  })
);

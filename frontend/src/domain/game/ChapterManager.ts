import {
  WorldProgressionManager,
  WorldProgressionStatus,
  type WorldProgressionDefinition,
} from "@/domain/gameplay/progression/WorldProgressionManager";
import type { WorldProgressionQueryContext } from "@/domain/gameplay/progression/WorldUnlockCondition";

export interface ChapterDefinition {
  readonly chapterId: string;
  readonly displayName: string;
  /** Fixed first-playthrough sequence position (GDD Section 7.2) — 0-indexed, must be contiguous and unique across all registered chapters. */
  readonly order: number;
  readonly progression: WorldProgressionDefinition;
}

export interface ChapterWithStatus {
  readonly definition: ChapterDefinition;
  readonly status: WorldProgressionStatus;
  /** True once status has ever reached COMPLETED — never regresses, satisfying "completed levels remain marked complete regardless of replay" (GDD 2.11). */
  readonly isReplayable: boolean;
}

export class DuplicateChapterOrderError extends Error {
  constructor(readonly order: number) {
    super(`Chapter order ${order.toString()} is already assigned to another chapter.`);
    this.name = "DuplicateChapterOrderError";
  }
}

/**
 * Thin orchestration layer over WorldProgressionManager (reused
 * verbatim, not reimplemented) — adds exactly what
 * WorldProgressionManager doesn't already do: fixed-order sequencing,
 * "has this chapter EVER been completed" (for replay eligibility,
 * which must never regress), and "what's the next locked chapter in
 * sequence" (used by the Hub's gate system, GDD Section 3.8).
 */
export class ChapterManager {
  private readonly progressionManager = new WorldProgressionManager();
  private readonly chaptersById = new Map<string, ChapterDefinition>();
  private readonly usedOrders = new Set<number>();
  private readonly everCompletedChapterIds = new Set<string>();

  register(definition: ChapterDefinition): void {
    if (this.usedOrders.has(definition.order)) {
      throw new DuplicateChapterOrderError(definition.order);
    }
    this.chaptersById.set(definition.chapterId, definition);
    this.usedOrders.add(definition.order);
    this.progressionManager.register(definition.progression);
  }

  registerAll(definitions: readonly ChapterDefinition[]): void {
    for (const definition of definitions) {
      this.register(definition);
    }
  }

  /** All chapters in their fixed GDD 7.2 sequence, each with live status and replay eligibility. */
  listInOrder(context: WorldProgressionQueryContext): readonly ChapterWithStatus[] {
    const chapters = Array.from(this.chaptersById.values()).sort((a, b) => a.order - b.order);
    return chapters.map((definition) => this.resolve(definition, context));
  }

  getStatus(chapterId: string, context: WorldProgressionQueryContext): WorldProgressionStatus {
    return this.progressionManager.getStatus(chapterId, context);
  }

  /**
   * The next chapter a first-time player should be routed to — the
   * lowest-order chapter that is not yet COMPLETED. Returns null once
   * every chapter is complete (Level 10 unlock condition, GDD 3.1).
   */
  getNextChapter(context: WorldProgressionQueryContext): ChapterDefinition | null {
    const ordered = this.listInOrder(context);
    const next = ordered.find((chapter) => chapter.status !== WorldProgressionStatus.COMPLETED);
    return next?.definition ?? null;
  }

  /** Every chapter ever completed, in fixed order — freely replayable per GDD 2.11, regardless of current live status. */
  listReplayable(context: WorldProgressionQueryContext): readonly ChapterDefinition[] {
    return this.listInOrder(context)
      .filter((chapter) => chapter.isReplayable)
      .map((chapter) => chapter.definition);
  }

  /** Call once, when a chapter's completion is first observed (e.g. on chapter:completed) — records the never-regressing replay flag. */
  markEverCompleted(chapterId: string): void {
    this.everCompletedChapterIds.add(chapterId);
  }

  private resolve(
    definition: ChapterDefinition,
    context: WorldProgressionQueryContext
  ): ChapterWithStatus {
    const status = this.progressionManager.getStatus(definition.chapterId, context);
    if (status === WorldProgressionStatus.COMPLETED) {
      this.everCompletedChapterIds.add(definition.chapterId);
    }
    return {
      definition,
      status,
      isReplayable: this.everCompletedChapterIds.has(definition.chapterId),
    };
  }
}

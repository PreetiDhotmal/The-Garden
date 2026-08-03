import type { GameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import type { StoryFlags } from "@/domain/gameplay/progression/StoryFlags";
import type { ReflectionContentRegistry } from "./ReflectionContent";

function watchedFlag(levelId: string): string {
  return `reflection-watched:${levelId}`;
}

/**
 * Reuses StoryFlags (already built for Milestone 7's NPC dialogue
 * conditions, already wired into PlayerSave/SaveManager) for "has
 * this level's Reflection been watched at least once" rather than
 * introducing a second persisted-boolean-set mechanism that would
 * need its own save-schema entry. GDD Section 2.7: 'Fully skippable
 * via a single button press after the first playthrough' — this
 * class is what "after the first playthrough" checks against.
 */
export class ReflectionManager {
  constructor(
    private readonly contentRegistry: ReflectionContentRegistry,
    private readonly storyFlags: StoryFlags,
    private readonly eventBus: GameplayEventBus
  ) {}

  hasBeenWatched(levelId: string): boolean {
    return this.storyFlags.has(watchedFlag(levelId));
  }

  /** True on a level's first-ever completion (skip is not offered), false on every subsequent replay (skip is offered) — the exact GDD 2.7 rule. */
  shouldForceWatch(levelId: string): boolean {
    return !this.hasBeenWatched(levelId);
  }

  open(levelId: string): void {
    this.eventBus.emit("reflection:opened", { levelId });
  }

  /** Call when the player actually views (does not skip) the reflection — marks it watched for future shouldForceWatch() calls. */
  markWatched(levelId: string): void {
    this.storyFlags.set(watchedFlag(levelId));
  }

  close(levelId: string): void {
    this.eventBus.emit("reflection:closed", { levelId });
  }

  getContent(levelId: string) {
    return this.contentRegistry.get(levelId);
  }
}

import type { ScriptureReference } from "@the-garden/shared-types";
import { parseReferenceKey, referenceKey } from "./ScriptureFormatter";
import {
  createScriptureUnlock,
  type ScriptureUnlock,
  type ScriptureUnlockSource,
} from "./ScriptureUnlock";
import { createScriptureDiscovery, type ScriptureDiscovery } from "./ScriptureDiscovery";
import { createScriptureMemory, recordReview, type ScriptureMemory } from "./ScriptureMemory";

/**
 * The player's cumulative scripture progress. Pure domain aggregate —
 * every mutating method returns a new ScriptureProgress rather than
 * mutating in place, so it composes cleanly with a future save system
 * (a snapshot at any point is just this object).
 */
export class ScriptureProgress {
  private constructor(
    private readonly unlocksByKey: ReadonlyMap<string, ScriptureUnlock>,
    private readonly discoveriesByKey: ReadonlyMap<string, ScriptureDiscovery>,
    private readonly memoryByKey: ReadonlyMap<string, ScriptureMemory>
  ) {}

  static empty(): ScriptureProgress {
    return new ScriptureProgress(new Map(), new Map(), new Map());
  }

  isUnlocked(reference: ScriptureReference): boolean {
    return this.unlocksByKey.has(referenceKey(reference));
  }

  isDiscovered(reference: ScriptureReference): boolean {
    return this.discoveriesByKey.has(referenceKey(reference));
  }

  isMemorized(reference: ScriptureReference): boolean {
    return this.memoryByKey.get(referenceKey(reference))?.isMemorized ?? false;
  }

  getMemory(reference: ScriptureReference): ScriptureMemory | null {
    return this.memoryByKey.get(referenceKey(reference)) ?? null;
  }

  unlock(
    reference: ScriptureReference,
    source: ScriptureUnlockSource,
    sourceId: string | null = null
  ): ScriptureProgress {
    const key = referenceKey(reference);
    if (this.unlocksByKey.has(key)) {
      return this;
    }
    const nextUnlocks = new Map(this.unlocksByKey);
    nextUnlocks.set(key, createScriptureUnlock(reference, source, sourceId));
    return new ScriptureProgress(nextUnlocks, this.discoveriesByKey, this.memoryByKey);
  }

  discover(reference: ScriptureReference, context: string): ScriptureProgress {
    const key = referenceKey(reference);
    if (this.discoveriesByKey.has(key)) {
      return this;
    }
    const nextDiscoveries = new Map(this.discoveriesByKey);
    nextDiscoveries.set(key, createScriptureDiscovery(reference, context));
    return new ScriptureProgress(this.unlocksByKey, nextDiscoveries, this.memoryByKey);
  }

  reviewForMemory(reference: ScriptureReference): ScriptureProgress {
    const key = referenceKey(reference);
    const existing = this.memoryByKey.get(key) ?? createScriptureMemory(reference);
    const nextMemory = new Map(this.memoryByKey);
    nextMemory.set(key, recordReview(existing));
    return new ScriptureProgress(this.unlocksByKey, this.discoveriesByKey, nextMemory);
  }

  unlockedCount(): number {
    return this.unlocksByKey.size;
  }

  discoveredCount(): number {
    return this.discoveriesByKey.size;
  }

  memorizedCount(): number {
    return Array.from(this.memoryByKey.values()).filter((memory) => memory.isMemorized).length;
  }

  listUnlocked(): readonly ScriptureUnlock[] {
    return Array.from(this.unlocksByKey.values());
  }

  listDiscoveredKeys(): readonly string[] {
    return Array.from(this.discoveriesByKey.keys());
  }

  listMemorizedKeys(): readonly string[] {
    return Array.from(this.memoryByKey.values())
      .filter((memory) => memory.isMemorized)
      .map((memory) => referenceKey(memory.reference));
  }

  listUnlockedKeys(): readonly string[] {
    return Array.from(this.unlocksByKey.keys());
  }

  /**
   * Rebuilds a ScriptureProgress from saved reference-key lists
   * (PlayerSave only stores keys, not full unlock/discovery records —
   * see ScriptureSave). Reviews each memorized key enough times to
   * cross the memorization threshold regardless of its exact value,
   * rather than duplicating that constant here.
   */
  static restore(
    unlockedKeys: readonly string[],
    discoveredKeys: readonly string[],
    memorizedKeys: readonly string[]
  ): ScriptureProgress {
    let progress = ScriptureProgress.empty();
    for (const key of unlockedKeys) {
      progress = progress.unlock(parseReferenceKey(key), "SAVE_RESTORE");
    }
    for (const key of discoveredKeys) {
      progress = progress.discover(parseReferenceKey(key), "save-restore");
    }
    for (const key of memorizedKeys) {
      const reference = parseReferenceKey(key);
      for (let i = 0; i < 10; i += 1) {
        progress = progress.reviewForMemory(reference);
      }
    }
    return progress;
  }
}

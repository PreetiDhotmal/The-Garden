import type { ScriptureReference, ScriptureVerse } from "@the-garden/shared-types";
import { referenceKey } from "./ScriptureFormatter";

export class ScriptureCache {
  private readonly versesByKey = new Map<string, ScriptureVerse>();

  get(reference: ScriptureReference): ScriptureVerse | undefined {
    return this.versesByKey.get(referenceKey(reference));
  }

  set(verse: ScriptureVerse): void {
    this.versesByKey.set(referenceKey(verse.reference), verse);
  }

  has(reference: ScriptureReference): boolean {
    return this.versesByKey.has(referenceKey(reference));
  }

  clear(): void {
    this.versesByKey.clear();
  }

  size(): number {
    return this.versesByKey.size;
  }
}

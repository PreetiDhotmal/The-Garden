import type { ScriptureReference } from "@the-garden/shared-types";

export interface ScriptureMemory {
  readonly reference: ScriptureReference;
  readonly repetitions: number;
  readonly lastReviewedAtIso: string | null;
  readonly isMemorized: boolean;
}

const MEMORIZED_AT_REPETITIONS = 5;

export function createScriptureMemory(reference: ScriptureReference): ScriptureMemory {
  return { reference, repetitions: 0, lastReviewedAtIso: null, isMemorized: false };
}

/** Records one review repetition, returning a new (possibly now-memorized) ScriptureMemory. */
export function recordReview(memory: ScriptureMemory): ScriptureMemory {
  const repetitions = memory.repetitions + 1;
  return {
    ...memory,
    repetitions,
    lastReviewedAtIso: new Date().toISOString(),
    isMemorized: repetitions >= MEMORIZED_AT_REPETITIONS,
  };
}

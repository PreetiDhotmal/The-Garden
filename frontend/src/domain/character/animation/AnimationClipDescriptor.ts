/**
 * Describes one animation clip as actually found embedded in a
 * character model, whatever it happens to be named. Nothing in this
 * module assumes clip names carry meaning — semantic mapping happens
 * entirely in CharacterAnimationConfig, authored per-model.
 */
export interface AnimationClipDescriptor {
  readonly name: string;
  readonly durationSeconds: number;
  readonly trackCount: number;
}

export class InvalidAnimationClipError extends Error {
  constructor(reason: string) {
    super(`Invalid animation clip: ${reason}`);
    this.name = "InvalidAnimationClipError";
  }
}

export function createAnimationClipDescriptor(
  name: string,
  durationSeconds: number,
  trackCount: number
): AnimationClipDescriptor {
  if (name.trim().length === 0) {
    throw new InvalidAnimationClipError("name must not be empty");
  }
  if (durationSeconds < 0) {
    throw new InvalidAnimationClipError("durationSeconds must not be negative");
  }
  if (trackCount < 0) {
    throw new InvalidAnimationClipError("trackCount must not be negative");
  }
  return { name, durationSeconds, trackCount };
}

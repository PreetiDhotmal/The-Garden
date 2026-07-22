import type { AnimationClipDescriptor } from "./AnimationClipDescriptor";

export class UnknownAnimationClipError extends Error {
  constructor(readonly clipName: string, readonly availableClips: readonly string[]) {
    super(
      `No animation clip named "${clipName}" was found. Available clips: ` +
        (availableClips.length > 0 ? availableClips.join(", ") : "(none)")
    );
    this.name = "UnknownAnimationClipError";
  }
}

/**
 * Holds every clip discovered on one loaded character model. This is
 * intentionally per-model (not global) — two different models may
 * both happen to have a clip named "NlaTrack" that mean entirely
 * different things, so registries are never merged across characters.
 */
export class AnimationClipRegistry {
  private readonly clipsByName = new Map<string, AnimationClipDescriptor>();

  registerAll(clips: readonly AnimationClipDescriptor[]): void {
    for (const clip of clips) {
      this.clipsByName.set(clip.name, clip);
    }
  }

  has(name: string): boolean {
    return this.clipsByName.has(name);
  }

  get(name: string): AnimationClipDescriptor {
    const clip = this.clipsByName.get(name);
    if (!clip) {
      throw new UnknownAnimationClipError(name, this.listNames());
    }
    return clip;
  }

  list(): readonly AnimationClipDescriptor[] {
    return Array.from(this.clipsByName.values());
  }

  listNames(): readonly string[] {
    return Array.from(this.clipsByName.keys());
  }

  size(): number {
    return this.clipsByName.size;
  }
}

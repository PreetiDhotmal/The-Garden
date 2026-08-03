import type { AnimationClip } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { loadModel } from "./ModelLoader";

export class AnimationNotFoundError extends Error {
  constructor(
    readonly clipName: string,
    readonly availableClips: readonly string[]
  ) {
    super(
      `Animation clip "${clipName}" was not found. Available clips: ` +
        (availableClips.length > 0 ? availableClips.join(", ") : "(none)")
    );
    this.name = "AnimationNotFoundError";
  }
}

/**
 * Loads a GLB file solely for its embedded animation clips (a common
 * pattern: a shared rig's animations authored/exported as a standalone
 * GLB separate from the character mesh itself).
 */
export async function loadAnimationClips(url: string): Promise<readonly AnimationClip[]> {
  const gltf = await loadModel(url);
  return gltf.animations;
}

/** Extracts a single named clip from an already-loaded GLTF result. */
export function getAnimationClip(gltf: GLTF, clipName: string): AnimationClip {
  const clip = gltf.animations.find((candidate) => candidate.name === clipName);
  if (!clip) {
    throw new AnimationNotFoundError(
      clipName,
      gltf.animations.map((candidate) => candidate.name)
    );
  }
  return clip;
}

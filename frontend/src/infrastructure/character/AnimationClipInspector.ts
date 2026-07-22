import type { AnimationClip } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { createAnimationClipDescriptor } from "@/domain/character/animation/AnimationClipDescriptor";
import { AnimationClipRegistry } from "@/domain/character/animation/AnimationClipRegistry";

/**
 * Builds an AnimationClipRegistry from whatever clips are actually
 * embedded in a loaded model — this is the "automatically inspect and
 * register all animation clips" requirement. It never assumes a clip
 * is named "Idle", "Walk", etc.; semantic meaning is layered on
 * separately via CharacterAnimationConfig.
 */
export function inspectAnimationClips(gltf: Pick<GLTF, "animations">): AnimationClipRegistry {
  const registry = new AnimationClipRegistry();
  registry.registerAll(gltf.animations.map(toDescriptor));
  return registry;
}

function toDescriptor(clip: AnimationClip) {
  return createAnimationClipDescriptor(clip.name, clip.duration, clip.tracks.length);
}

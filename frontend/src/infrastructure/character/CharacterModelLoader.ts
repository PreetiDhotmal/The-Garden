import type { Object3D } from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import type { AssetManager } from "@/infrastructure/engine/assets/AssetManager";
import { AnimationClipRegistry } from "@/domain/character/animation/AnimationClipRegistry";
import { inspectAnimationClips } from "./AnimationClipInspector";

export interface LoadedCharacterModel {
  readonly gltf: GLTF;
  readonly clipRegistry: AnimationClipRegistry;
}

/**
 * Loads (or reuses the cached load of) a character model through the
 * engine's shared AssetManager — this milestone does not duplicate
 * asset loading/caching, it only adds clip inspection on top of what
 * AssetManager.load already gives us for a MODEL-type asset.
 */
export async function loadCharacterModel(
  assetManager: AssetManager,
  modelAssetId: string
): Promise<LoadedCharacterModel> {
  const gltf = await assetManager.load<GLTF>(modelAssetId);
  return { gltf, clipRegistry: inspectAnimationClips(gltf) };
}

/**
 * Deep-clones a loaded model's scene graph for spawning a second
 * instance of the same character. Plain `Object3D.clone()` does not
 * correctly re-bind skinned-mesh bone references, which is why this
 * uses three.js's own SkeletonUtils rather than the built-in clone —
 * using the wrong one silently produces a T-posed, non-animating
 * clone.
 */
export function cloneCharacterScene(scene: Object3D): Object3D {
  return SkeletonUtils.clone(scene);
}

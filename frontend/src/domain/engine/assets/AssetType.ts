/**
 * Every kind of asset the pipeline knows how to load. Adding a new
 * asset type requires: a value here, a loader in
 * infrastructure/engine/assets/loaders, and a case in AssetManager's
 * loader dispatch — the compiler will flag the missing case via the
 * exhaustive switch there.
 */
export enum AssetType {
  MODEL = "MODEL",
  TEXTURE = "TEXTURE",
  HDRI = "HDRI",
  AUDIO = "AUDIO",
  ANIMATION = "ANIMATION",
}

import { useCallback } from "react";
import { useEngine } from "@/presentation/engine/hooks/useEngine";

export type UiSoundId =
  | "audio:ui:button-hover"
  | "audio:ui:button-confirm"
  | "audio:ui:screen-transition"
  | "audio:ui:chapter-gate-open";

/**
 * Same "wired but silent" pattern used throughout this project for
 * every sound trigger without a real asset yet (footsteps, landing,
 * seed collection, NPC voice) — the trigger point is real and correct
 * now; the sound activates automatically the moment an asset is
 * registered under the matching id, with zero further code changes.
 */
export function usePlayUiSound(): (soundId: UiSoundId) => void {
  const { assetManager, sfxManager } = useEngine();

  return useCallback(
    (soundId: UiSoundId) => {
      if (!assetManager.isCached(soundId)) {
        return;
      }
      const buffer = assetManager.getCached<AudioBuffer>(soundId);
      if (buffer) {
        sfxManager.play(buffer, { volume: 0.7 });
      }
    },
    [assetManager, sfxManager]
  );
}

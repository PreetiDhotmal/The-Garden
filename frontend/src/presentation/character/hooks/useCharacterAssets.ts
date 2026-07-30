import { useEffect, useState } from "react";
import { useEngine } from "@/presentation/engine/hooks/useEngine";
import {
  loadCharacterModel,
  type LoadedCharacterModel,
} from "@/infrastructure/character/CharacterModelLoader";
import { createPlaceholderCharacterModel } from "@/infrastructure/character/createPlaceholderCharacterModel";
import { inspectAnimationClips } from "@/infrastructure/character/AnimationClipInspector";
import { CHARACTER_MODEL_ASSET_IDS } from "@/presentation/character/characterModelAssets";

export interface CharacterAssetsState {
  readonly data: LoadedCharacterModel | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  /** True when data is the procedural fallback, not the real GLB — lets a caller show a subtle "couldn't load the full character model" notice if it wants to, without treating this as a hard failure. */
  readonly isPlaceholder: boolean;
}

function placeholderColorFor(modelAssetId: string): string {
  return modelAssetId === CHARACTER_MODEL_ASSET_IDS.GIRL ? "#c98ab0" : "#6b8fc9";
}

export function useCharacterAssets(modelAssetId: string | null): CharacterAssetsState {
  const { assetManager } = useEngine();
  const [state, setState] = useState<CharacterAssetsState>({
    data: null,
    isLoading: modelAssetId !== null,
    error: null,
    isPlaceholder: false,
  });

  useEffect(() => {
    if (!modelAssetId) {
      return;
    }
    let cancelled = false;
    setState({ data: null, isLoading: true, error: null, isPlaceholder: false });

    loadCharacterModel(assetManager, modelAssetId)
      .then((result) => {
        if (!cancelled) {
          setState({ data: result, isLoading: false, error: null, isPlaceholder: false });
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : String(error);
        console.error(
          `[CharacterAssets] Failed to load "${modelAssetId}" — falling back to a placeholder model so the game can continue instead of hanging. Original error: ${message}`
        );
        const gltf = createPlaceholderCharacterModel(placeholderColorFor(modelAssetId));
        setState({
          data: { gltf, clipRegistry: inspectAnimationClips(gltf) },
          isLoading: false,
          error: message,
          isPlaceholder: true,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [assetManager, modelAssetId]);

  return state;
}

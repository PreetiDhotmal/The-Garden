import { useEffect, useState } from "react";
import { useEngine } from "@/presentation/engine/hooks/useEngine";
import { loadCharacterModel, type LoadedCharacterModel } from "@/infrastructure/character/CharacterModelLoader";

export interface CharacterAssetsState {
  readonly data: LoadedCharacterModel | null;
  readonly isLoading: boolean;
  readonly error: string | null;
}

export function useCharacterAssets(modelAssetId: string | null): CharacterAssetsState {
  const { assetManager } = useEngine();
  const [state, setState] = useState<CharacterAssetsState>({
    data: null,
    isLoading: modelAssetId !== null,
    error: null,
  });

  useEffect(() => {
    if (!modelAssetId) {
      return;
    }
    let cancelled = false;
    setState({ data: null, isLoading: true, error: null });

    loadCharacterModel(assetManager, modelAssetId)
      .then((result) => {
        if (!cancelled) {
          setState({ data: result, isLoading: false, error: null });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : String(error);
          setState({ data: null, isLoading: false, error: message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [assetManager, modelAssetId]);

  return state;
}

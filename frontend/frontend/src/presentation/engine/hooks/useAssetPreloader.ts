import { useEffect, useState } from "react";
import { useEngine } from "./useEngine";

export interface PreloadState {
  readonly loaded: number;
  readonly total: number;
  readonly isComplete: boolean;
  readonly error: string | null;
  readonly currentAssetId: string | null;
}

const INITIAL_STATE: PreloadState = {
  loaded: 0,
  total: 0,
  isComplete: false,
  error: null,
  currentAssetId: null,
};

/**
 * Preloads the given asset ids on mount and tracks aggregate progress
 * by subscribing to the engine event bus. Re-runs if `assetIds`
 * changes (by reference — callers should memoize the array).
 */
export function useAssetPreloader(assetIds: readonly string[]): PreloadState {
  const { assetManager, eventBus } = useEngine();
  const [state, setState] = useState<PreloadState>(INITIAL_STATE);

  useEffect(() => {
    setState({
      loaded: 0,
      total: assetIds.length,
      isComplete: assetIds.length === 0,
      error: null,
      currentAssetId: null,
    });

    const unsubscribeProgress = eventBus.on("asset:preload-progress", ({ loaded, total, assetId }) => {
      setState((previous) => ({ ...previous, loaded, total, currentAssetId: assetId }));
    });
    const unsubscribeCompleted = eventBus.on("asset:preload-completed", () => {
      setState((previous) => ({ ...previous, isComplete: true }));
    });
    const unsubscribeFailed = eventBus.on("asset:load-failed", ({ error }) => {
      setState((previous) => ({ ...previous, error }));
    });

    if (assetIds.length > 0) {
      void assetManager.preload(assetIds);
    }

    return () => {
      unsubscribeProgress();
      unsubscribeCompleted();
      unsubscribeFailed();
    };
  }, [assetIds, assetManager, eventBus]);

  return state;
}

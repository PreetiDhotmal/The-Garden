import { useEffect, useState } from "react";
import type { Object3D } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { useEngine } from "@/presentation/engine/hooks/useEngine";

export interface EnvironmentPropState {
  readonly scene: Object3D | null;
  readonly isLoading: boolean;
}

/**
 * Loads one environment prop's GLTF scene by asset id. Deliberately
 * has no fallback-to-placeholder behavior the way useCharacterAssets
 * does — a missing decorative prop should simply not render (handled
 * by the caller checking `scene === null`), not force a synthetic
 * capsule into a forest scene. Decorative props failing to load is a
 * much lower-stakes failure than a player character failing to load.
 */
export function useEnvironmentPropModel(assetId: string): EnvironmentPropState {
  const { assetManager } = useEngine();
  const [scene, setScene] = useState<Object3D | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setScene(null);

    assetManager
      .load<GLTF>(assetId)
      .then((gltf) => {
        if (!cancelled) {
          setScene(gltf.scene);
          setIsLoading(false);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`[EnvironmentProp] Failed to load "${assetId}": ${message}`);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [assetManager, assetId]);

  return { scene, isLoading };
}

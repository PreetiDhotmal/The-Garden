import { useEffect, useState } from "react";
import type { PreloadState } from "@/presentation/engine/hooks/useAssetPreloader";

export interface LoadingScreenProps {
  readonly preload: PreloadState;
  readonly title?: string;
}

const FADE_DURATION_MS = 500;

/**
 * Fades out (rather than instantly disappearing) once preload becomes
 * complete — an instant cut reads as broken, a fade reads as
 * intentional. The parent is responsible for unmounting this
 * component after the fade finishes (see GardenOfBeginningsPage),
 * since this component itself has no way to know when it's safe to
 * stop rendering — that's the parent's call, not this one's.
 */
export function LoadingScreen({ preload, title = "The Garden" }: LoadingScreenProps) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (preload.isComplete) {
      setIsFadingOut(true);
    }
  }, [preload.isComplete]);

  const percentage = preload.total > 0 ? Math.round((preload.loaded / preload.total) * 100) : 0;

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[100] flex flex-col items-center justify-center bg-shadow-valley transition-opacity ${
        isFadingOut ? "opacity-0" : "opacity-100"
      }`}
      style={{ transitionDuration: `${FADE_DURATION_MS.toString()}ms` }}
    >
      {/* Background artwork placeholder — no key art asset exists yet
          (same documented gap as environment/character art elsewhere in
          this project); a soft radial gradient stands in rather than a
          flat color or a broken image tag. */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#2a3b28_0%,_#141d13_100%)]" />

      <div className="relative flex flex-col items-center gap-4">
        <h1 className="font-[var(--font-display)] text-3xl text-light-divine">{title}</h1>

        <div className="h-2 w-72 overflow-hidden rounded-full bg-garden-900">
          <div
            className="h-full rounded-full bg-garden-500 transition-all duration-200 ease-out"
            style={{ width: `${percentage.toString()}%` }}
          />
        </div>

        <div className="text-sm text-garden-300">{percentage}%</div>

        {preload.currentAssetId && (
          <div className="font-mono text-xs text-garden-700">Loading {preload.currentAssetId}…</div>
        )}

        {preload.error && (
          <div className="mt-2 max-w-sm text-center text-xs text-red-400">
            Some assets failed to load: {preload.error}. The garden may look incomplete.
          </div>
        )}
      </div>
    </div>
  );
}

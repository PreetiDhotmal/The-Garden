import { useEffect, useState } from "react";
import type { ScriptureReference, ScriptureVerse } from "@the-garden/shared-types";
import { formatReference } from "@/domain/gameplay/scripture/ScriptureFormatter";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { ScriptureRepositoryImpl } from "@/infrastructure/gameplay/scripture/ScriptureRepositoryImpl";
import { LoadingIndicator } from "./scripture/LoadingIndicator";
import { ErrorMessage } from "./scripture/ErrorMessage";

export interface VerseReaderProps {
  readonly reference: ScriptureReference;
  readonly onBack?: () => void;
}

/**
 * Fetches and displays a single verse through ScriptureRepository —
 * favorite/bookmark actions only appear when the active repository is
 * ScriptureRepositoryImpl (the production implementation); the base
 * ScriptureRepository interface intentionally doesn't expose those,
 * since MockScriptureProvider-backed setups (tests, isolated dev)
 * don't need them.
 */
export function VerseReader({ reference, onBack }: VerseReaderProps) {
  const { scriptureRepository } = useGameplay();
  const [verse, setVerse] = useState<ScriptureVerse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const isRepositoryImpl = scriptureRepository instanceof ScriptureRepositoryImpl;

  const load = () => {
    setIsLoading(true);
    setError(null);
    scriptureRepository
      .getVerse(reference)
      .then(async (result) => {
        setVerse(result);
        if (isRepositoryImpl) {
          setIsFavorite(await scriptureRepository.isFavorite(reference));
        }
      })
      .catch(() => {
        setError("This verse isn't available right now — it may not be cached for offline reading.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(load, [reference, scriptureRepository, isRepositoryImpl]);

  return (
    <div className="flex flex-col gap-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="self-start text-xs text-garden-300 hover:text-light-divine"
        >
          ← Back
        </button>
      )}

      {isLoading && <LoadingIndicator label="Loading verse…" />}
      {error && <ErrorMessage message={error} onRetry={load} />}

      {verse && !isLoading && (
        <>
          <p className="font-[var(--font-display)] text-lg italic">&ldquo;{verse.text}&rdquo;</p>
          <p className="text-sm text-garden-300">{formatReference(verse.reference)}</p>
          {isRepositoryImpl && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  scriptureRepository
                    .toggleFavorite(reference)
                    .then(setIsFavorite)
                    .catch(() => {
                      // Best-effort UI action; a failed toggle just leaves state unchanged.
                    });
                }}
                className="rounded-md border border-garden-700 px-3 py-1 text-xs"
              >
                {isFavorite ? "★ Favorited" : "☆ Add to Favorites"}
              </button>
              <button
                type="button"
                onClick={() => {
                  void scriptureRepository.addBookmark(reference);
                }}
                className="rounded-md border border-garden-700 px-3 py-1 text-xs"
              >
                🔖 Bookmark
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

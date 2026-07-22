import { useEffect, useState } from "react";
import type { ScriptureVerse } from "@the-garden/shared-types";
import { formatReference, parseReferenceKey } from "@/domain/gameplay/scripture/ScriptureFormatter";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { ScriptureRepositoryImpl } from "@/infrastructure/gameplay/scripture/ScriptureRepositoryImpl";
import type { BookmarkEntry } from "@/infrastructure/gameplay/scripture/OfflineScriptureStorage";
import { LoadingIndicator } from "./scripture/LoadingIndicator";
import { ErrorMessage } from "./scripture/ErrorMessage";

export interface BookmarksPanelProps {
  readonly onSelectVerse: (verse: ScriptureVerse) => void;
}

type Tab = "bookmarks" | "favorites";

export function BookmarksPanel({ onSelectVerse }: BookmarksPanelProps) {
  const { scriptureRepository } = useGameplay();
  const [tab, setTab] = useState<Tab>("bookmarks");
  const [bookmarks, setBookmarks] = useState<readonly BookmarkEntry[]>([]);
  const [favorites, setFavorites] = useState<readonly ScriptureVerse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isRepositoryImpl = scriptureRepository instanceof ScriptureRepositoryImpl;

  const load = () => {
    if (!isRepositoryImpl) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    Promise.all([
      scriptureRepository.getBookmarks(),
      scriptureRepository
        .getFavoriteKeys()
        .then((keys) =>
          Promise.all(
            keys.map((key) => scriptureRepository.getVerse(parseReferenceKey(key)).catch(() => null))
          )
        ),
    ])
      .then(([bookmarkEntries, favoriteVerses]) => {
        setBookmarks(bookmarkEntries);
        setFavorites(favoriteVerses.filter((verse): verse is ScriptureVerse => verse !== null));
      })
      .catch(() => {
        setError("Couldn't load your bookmarks and favorites.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(load, [scriptureRepository, isRepositoryImpl]);

  if (!isRepositoryImpl) {
    return <p className="text-sm text-garden-300">Bookmarks aren&apos;t available in this mode.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 text-xs">
        <button
          type="button"
          onClick={() => {
            setTab("bookmarks");
          }}
          className={tab === "bookmarks" ? "font-semibold text-light-divine" : "text-garden-300"}
        >
          Bookmarks ({bookmarks.length})
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("favorites");
          }}
          className={tab === "favorites" ? "font-semibold text-light-divine" : "text-garden-300"}
        >
          Favorites ({favorites.length})
        </button>
      </div>

      {isLoading && <LoadingIndicator label="Loading…" />}
      {error && <ErrorMessage message={error} onRetry={load} />}

      {!isLoading && !error && tab === "bookmarks" && (
        <>
          {bookmarks.length === 0 && <p className="text-sm text-garden-300">No bookmarks saved yet.</p>}
          <ul className="flex flex-col gap-1">
            {bookmarks.map((bookmark) => (
              <li key={bookmark.key}>
                <button
                  type="button"
                  onClick={() => {
                    scriptureRepository
                      .getVerse(parseReferenceKey(bookmark.key))
                      .then(onSelectVerse)
                      .catch(() => {
                        // Best-effort — a stale bookmark that fails to load just doesn't navigate.
                      });
                  }}
                  className="w-full rounded border border-garden-700 px-3 py-1.5 text-left text-xs hover:border-garden-500"
                >
                  {bookmark.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {!isLoading && !error && tab === "favorites" && (
        <>
          {favorites.length === 0 && <p className="text-sm text-garden-300">No favorites yet.</p>}
          <ul className="flex flex-col gap-1">
            {favorites.map((verse) => (
              <li key={formatReference(verse.reference)}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectVerse(verse);
                  }}
                  className="w-full rounded border border-garden-700 px-3 py-1.5 text-left text-xs hover:border-garden-500"
                >
                  {formatReference(verse.reference)}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

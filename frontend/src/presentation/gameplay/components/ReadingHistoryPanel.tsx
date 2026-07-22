import { useEffect, useState } from "react";
import type { ScriptureVerse } from "@the-garden/shared-types";
import { formatReference, parseReferenceKey } from "@/domain/gameplay/scripture/ScriptureFormatter";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { ScriptureRepositoryImpl } from "@/infrastructure/gameplay/scripture/ScriptureRepositoryImpl";
import { LoadingIndicator } from "./scripture/LoadingIndicator";
import { ErrorMessage } from "./scripture/ErrorMessage";

export interface ReadingHistoryPanelProps {
  readonly onSelectVerse: (verse: ScriptureVerse) => void;
}

export function ReadingHistoryPanel({ onSelectVerse }: ReadingHistoryPanelProps) {
  const { scriptureRepository } = useGameplay();
  const [verses, setVerses] = useState<readonly ScriptureVerse[]>([]);
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
    scriptureRepository
      .getRecentlyReadKeys()
      .then(async (keys) => {
        const resolved = await Promise.all(
          keys.map((key) =>
            scriptureRepository.getVerse(parseReferenceKey(key)).catch(() => null)
          )
        );
        setVerses(resolved.filter((verse): verse is ScriptureVerse => verse !== null));
      })
      .catch(() => {
        setError("Couldn't load your reading history.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(load, [scriptureRepository, isRepositoryImpl]);

  if (!isRepositoryImpl) {
    return <p className="text-sm text-garden-300">Reading history isn&apos;t available in this mode.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {isLoading && <LoadingIndicator label="Loading history…" />}
      {error && <ErrorMessage message={error} onRetry={load} />}
      {!isLoading && !error && verses.length === 0 && (
        <p className="text-sm text-garden-300">You haven&apos;t read any scripture yet.</p>
      )}
      <ul className="flex flex-col gap-1">
        {verses.map((verse) => (
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
    </div>
  );
}

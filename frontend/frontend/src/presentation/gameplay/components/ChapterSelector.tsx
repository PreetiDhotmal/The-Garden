import { useEffect, useState } from "react";
import type { Chapter } from "@/domain/gameplay/scripture/Book";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { LoadingIndicator } from "./scripture/LoadingIndicator";
import { ErrorMessage } from "./scripture/ErrorMessage";

export interface ChapterSelectorProps {
  readonly bookName: string;
  readonly translationCode: string;
  readonly onSelect: (chapterNumber: number) => void;
  readonly onBack: () => void;
}

export function ChapterSelector({
  bookName,
  translationCode,
  onSelect,
  onBack,
}: ChapterSelectorProps) {
  const { scriptureRepository } = useGameplay();
  const [chapters, setChapters] = useState<readonly Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setIsLoading(true);
    setError(null);
    scriptureRepository
      .listChapters(bookName, translationCode)
      .then(setChapters)
      .catch(() => {
        setError("Couldn't load chapters for this book — check your connection.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(load, [bookName, translationCode, scriptureRepository]);

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onBack}
        className="self-start text-xs text-garden-300 hover:text-light-divine"
      >
        ← Back to Books
      </button>
      <h3 className="text-sm font-semibold text-garden-300">{bookName}</h3>

      {isLoading && <LoadingIndicator label="Loading chapters…" />}
      {error && <ErrorMessage message={error} onRetry={load} />}

      {!isLoading && !error && chapters.length === 0 && (
        <p className="text-sm text-garden-300">No chapters available offline for this book yet.</p>
      )}

      <div className="grid grid-cols-6 gap-1">
        {chapters.map((chapter) => (
          <button
            key={chapter.chapterNumber}
            type="button"
            onClick={() => {
              onSelect(chapter.chapterNumber);
            }}
            className="rounded border border-garden-700 py-1 text-center text-xs hover:border-garden-500"
          >
            {chapter.chapterNumber}
          </button>
        ))}
      </div>
    </div>
  );
}

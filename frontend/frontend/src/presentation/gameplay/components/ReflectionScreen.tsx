import { useEffect, useState } from "react";
import { useGameFramework } from "@/presentation/game/hooks/useGameFramework";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { usePopupStore } from "@/presentation/gameplay/stores/popupStore";
import { formatReference } from "@/domain/gameplay/scripture/ScriptureFormatter";
import { ScriptureWindow } from "@/presentation/gameplay/components/ScriptureWindow";

export interface ReflectionScreenProps {
  readonly levelId: string;
  readonly onContinue: () => void;
}

/**
 * "No preaching. Very short. One sentence." — this screen shows
 * exactly one line (ReflectionContent.lessonText, already authored to
 * that standard) plus a brief summary, never more. Scripture is
 * fetched live from the real backend only if the player asks for it,
 * never shown automatically.
 */
export function ReflectionScreen({ levelId, onContinue }: ReflectionScreenProps) {
  const { reflectionManager } = useGameFramework();
  const { scriptureRepository } = useGameplay();
  const showVersePopup = usePopupStore((state) => state.showVersePopup);
  const [isVisible, setIsVisible] = useState(false);
  const [isFetchingScripture, setIsFetchingScripture] = useState(false);

  const content = reflectionManager.getContent(levelId);

  useEffect(() => {
    reflectionManager.open(levelId);
    const fadeInTimeout = window.setTimeout(() => {
      setIsVisible(true);
    }, 50);
    return () => {
      window.clearTimeout(fadeInTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId]);

  const handleReadScripture = () => {
    if (!content.scriptureReference) {
      return;
    }
    setIsFetchingScripture(true);
    scriptureRepository
      .getVerse(content.scriptureReference)
      .then((verse) => {
        showVersePopup({
          referenceText: formatReference(verse.reference),
          verseText: verse.text,
        });
      })
      .catch(() => {
        // Backend unavailable — the reflection itself already stands on its own without it.
      })
      .finally(() => {
        setIsFetchingScripture(false);
      });
  };

  const handleContinue = () => {
    reflectionManager.markWatched(levelId);
    reflectionManager.close(levelId);
    onContinue();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-700 ${
        isVisible ? "bg-opacity-80 opacity-100" : "bg-opacity-100 opacity-0"
      }`}
    >
      <div className="flex max-w-lg flex-col items-center gap-6 px-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-garden-500">
          {content.summaryText}
        </p>
        <p className="font-[var(--font-display)] text-3xl italic text-light-divine">
          &ldquo;{content.lessonText}&rdquo;
        </p>

        <div className="mt-4 flex flex-col items-center gap-3">
          {content.scriptureReference && (
            <button
              type="button"
              onClick={handleReadScripture}
              disabled={isFetchingScripture}
              className="text-sm text-garden-300 underline hover:text-light-divine disabled:opacity-50"
            >
              {isFetchingScripture ? "Reading…" : "Read Related Scripture"}
            </button>
          )}
          <button
            type="button"
            onClick={handleContinue}
            className="rounded bg-garden-700 px-8 py-2.5 text-light-divine hover:bg-garden-500"
          >
            Continue
          </button>
        </div>
      </div>
      <ScriptureWindow />
    </div>
  );
}

import type { DialogueSessionSnapshot } from "@/domain/gameplay/dialogue/DialogueManager";
import { useTypewriter } from "@/presentation/gameplay/hooks/useTypewriter";

export interface DialogueBoxProps {
  readonly snapshot: DialogueSessionSnapshot;
  readonly onAdvance: () => void;
  readonly onChoose: (choiceId: string) => void;
  readonly onClose: () => void;
}

export function DialogueBox({ snapshot, onAdvance, onChoose, onClose }: DialogueBoxProps) {
  const { displayedText, isComplete, skip } = useTypewriter(snapshot.currentPageText);
  const showChoices = snapshot.isOnLastPage && isComplete && snapshot.availableChoices.length > 0;
  const showContinue = !showChoices;

  const handlePrimaryAction = () => {
    if (!isComplete) {
      skip();
      return;
    }
    if (snapshot.isOnLastPage) {
      if (snapshot.availableChoices.length === 0) {
        onClose();
      }
      // If there are choices, the player must pick one — no-op here.
      return;
    }
    onAdvance();
  };

  return (
    <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-50 flex justify-center p-6">
      <div className="w-full max-w-2xl rounded-lg border border-garden-700 bg-shadow-valley/95 p-5 text-light-divine shadow-xl">
        <div className="mb-2 flex items-center gap-3">
          {snapshot.node.portraitAssetId && (
            <div className="h-12 w-12 shrink-0 rounded-full border border-garden-700 bg-garden-900" />
          )}
          <span className="font-[var(--font-display)] text-lg">{snapshot.node.speakerName}</span>
        </div>

        <button
          type="button"
          onClick={handlePrimaryAction}
          className="min-h-[3rem] w-full cursor-pointer text-left text-sm leading-relaxed"
        >
          {displayedText}
          {!isComplete && <span className="animate-pulse">▌</span>}
        </button>

        {showChoices && (
          <div className="mt-4 flex flex-col gap-2">
            {snapshot.availableChoices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => {
                  onChoose(choice.id);
                }}
                className="rounded border border-garden-700 px-3 py-1.5 text-left text-sm hover:border-garden-500"
              >
                {choice.text}
              </button>
            ))}
          </div>
        )}

        {showContinue && (
          <div className="mt-3 flex items-center justify-between text-xs text-garden-300">
            <span>{isComplete ? "Press to continue" : "Press to skip"}</span>
            <button type="button" onClick={onClose} className="hover:text-light-divine">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

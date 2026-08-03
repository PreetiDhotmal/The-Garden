import type { TutorialStep } from "@/domain/gameplay/tutorial/TutorialStep";

export interface TutorialOverlayProps {
  readonly step: TutorialStep;
  readonly onSkip: () => void;
}

export function TutorialOverlay({ step, onSkip }: TutorialOverlayProps) {
  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2">
      <div className="rounded-lg border border-garden-500 bg-black/70 px-5 py-3 text-center text-light-divine shadow-lg">
        {step.instruction}
      </div>
      <button
        type="button"
        onClick={onSkip}
        className="pointer-events-auto text-xs text-garden-700 underline hover:text-garden-300"
      >
        Skip Tutorial
      </button>
    </div>
  );
}

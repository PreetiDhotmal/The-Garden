import type { TrustTutorialStep } from "./TrustTutorial";

export interface TrustTutorialOverlayProps {
  readonly step: TrustTutorialStep;
}

const STEP_TEXT: Record<Exclude<TrustTutorialStep, null | "DONE">, string> = {
  MOVE: "Walk forward — each of you, in your own half of the screen.",
  TRUST: "You won't always see everything here. Sometimes you'll simply have to trust each other.",
};

export function TrustTutorialOverlay({ step }: TrustTutorialOverlayProps) {
  if (!step || step === "DONE") {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-lg border border-garden-500 bg-black/70 px-5 py-3 text-center text-light-divine shadow-lg">
      {STEP_TEXT[step]}
    </div>
  );
}

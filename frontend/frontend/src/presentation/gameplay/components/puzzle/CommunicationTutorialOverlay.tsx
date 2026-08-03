import type { TutorialStep } from "./CommunicationTutorial";

export interface CommunicationTutorialOverlayProps {
  readonly step: TutorialStep;
}

const STEP_TEXT: Record<Exclude<TutorialStep, null | "DONE">, string> = {
  MOVE: "Walk forward — each of you, in your own half of the screen.",
  TALK: "You'll need to talk to each other from here on. Out loud, not just in the game.",
  OBJECTIVE:
    "One of you sees the pattern on the totems. The other stands at the switches, out of sight of them. Describe what you see — match the switches to the pattern, then pull the lever together.",
};

export function CommunicationTutorialOverlay({ step }: CommunicationTutorialOverlayProps) {
  if (!step || step === "DONE") {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-lg border border-garden-500 bg-black/70 px-5 py-3 text-center text-light-divine shadow-lg">
      {STEP_TEXT[step]}
    </div>
  );
}

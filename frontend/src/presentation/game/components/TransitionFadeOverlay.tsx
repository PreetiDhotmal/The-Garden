import { useEffect, useState } from "react";

export interface TransitionFadeOverlayProps {
  readonly opacity: number;
  readonly phase: string;
}

const LOADING_TIPS: readonly string[] = [
  "Every gate in the Garden opens only once you've completed the one before it.",
  "Some puzzles ask you to listen more than to act.",
  "The Garden remembers everything you restore together.",
  "You can always find the nearest gate from the Shrine's overlook.",
];

export function TransitionFadeOverlay({ opacity, phase }: TransitionFadeOverlayProps) {
  const [tip, setTip] = useState(() => LOADING_TIPS[0]);

  useEffect(() => {
    if (phase !== "LOADING") {
      return;
    }
    setTip(LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)]);
  }, [phase]);

  if (opacity <= 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity"
      style={{ opacity }}
    >
      {phase === "LOADING" && (
        <p className="max-w-md px-8 text-center text-sm italic text-garden-300">{tip}</p>
      )}
    </div>
  );
}

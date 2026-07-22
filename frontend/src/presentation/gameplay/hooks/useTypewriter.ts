import { useEffect, useRef, useState } from "react";

const DEFAULT_CHARS_PER_SECOND = 45;

export interface TypewriterState {
  readonly displayedText: string;
  readonly isComplete: boolean;
  readonly skip: () => void;
}

export function useTypewriter(
  fullText: string,
  charsPerSecond = DEFAULT_CHARS_PER_SECOND
): TypewriterState {
  const [displayedLength, setDisplayedLength] = useState(0);
  const skippedRef = useRef(false);

  useEffect(() => {
    setDisplayedLength(0);
    skippedRef.current = false;

    if (fullText.length === 0) {
      return;
    }

    const intervalMs = 1000 / charsPerSecond;
    const interval = window.setInterval(() => {
      setDisplayedLength((current) => {
        if (skippedRef.current || current >= fullText.length) {
          window.clearInterval(interval);
          return fullText.length;
        }
        return current + 1;
      });
    }, intervalMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [fullText, charsPerSecond]);

  return {
    displayedText: fullText.slice(0, displayedLength),
    isComplete: displayedLength >= fullText.length,
    skip: () => {
      skippedRef.current = true;
      setDisplayedLength(fullText.length);
    },
  };
}

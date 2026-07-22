import { useState } from "react";
import { formatReference } from "@/domain/gameplay/scripture/ScriptureFormatter";
import { useGameplay } from "../hooks/useGameplay";
import { useGameplayVersion } from "../hooks/useGameplayVersion";
import { ScriptureBrowser } from "./ScriptureBrowser";

export function ScriptureWindow() {
  const { scriptureProgressRef } = useGameplay();
  const [isOpen, setIsOpen] = useState(false);
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  useGameplayVersion(["scripture:collected", "scripture:discovered", "scripture:memorized"]);

  const unlocked = scriptureProgressRef.current.listUnlocked();

  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-30">
      <button
        type="button"
        onClick={() => {
          setIsOpen((open) => !open);
        }}
        className="rounded-md border border-garden-700 bg-black/70 px-3 py-1 font-mono text-xs text-light-divine"
      >
        Scripture ({unlocked.length})
      </button>
      {isOpen && (
        <div className="mt-2 max-h-64 w-64 overflow-y-auto rounded-md border border-garden-700 bg-black/80 p-3 text-sm text-light-divine">
          {unlocked.length === 0 ? (
            <div className="text-garden-300">No scripture discovered yet.</div>
          ) : (
            <ul className="space-y-1">
              {unlocked.map((unlock) => (
                <li key={formatReference(unlock.reference)}>{formatReference(unlock.reference)}</li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => {
              setIsBrowserOpen(true);
            }}
            className="mt-2 w-full rounded border border-garden-700 py-1 text-xs text-garden-300 hover:text-light-divine"
          >
            Browse All Scripture
          </button>
        </div>
      )}
      {isBrowserOpen && (
        <ScriptureBrowser
          onClose={() => {
            setIsBrowserOpen(false);
          }}
        />
      )}
    </div>
  );
}

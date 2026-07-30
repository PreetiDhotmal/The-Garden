import { useEffect, useState } from "react";
import { DEFAULT_KEYBOARD_BINDINGS } from "@/domain/input/InputMap";
import {
  REBINDABLE_ACTIONS,
  useKeyBindingsStore,
  type RebindableAction,
} from "@/presentation/settings/keyBindingsStore";

export interface ControlsScreenProps {
  readonly onBack: () => void;
}

function defaultKeyLabel(action: RebindableAction): string {
  const binding = DEFAULT_KEYBOARD_BINDINGS.find((candidate) => candidate.action === action);
  return binding?.physicalInput ?? "—";
}

export function ControlsScreen({ onBack }: ControlsScreenProps) {
  const overrides = useKeyBindingsStore((state) => state.overrides);
  const rebind = useKeyBindingsStore((state) => state.rebind);
  const resetToDefaults = useKeyBindingsStore((state) => state.resetToDefaults);
  const [listeningFor, setListeningFor] = useState<RebindableAction | null>(null);

  useEffect(() => {
    if (!listeningFor) {
      return;
    }
    const handleKeydown = (event: KeyboardEvent) => {
      event.preventDefault();
      if (event.key !== "Escape") {
        rebind(listeningFor, event.code);
      }
      setListeningFor(null);
    };
    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [listeningFor, rebind]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-shadow-valley">
      <h1 className="font-[var(--font-display)] text-3xl text-light-divine">Controls</h1>

      <div className="flex w-80 flex-col gap-2">
        {REBINDABLE_ACTIONS.map(({ action, label }) => (
          <div key={action} className="flex items-center justify-between">
            <span className="text-sm text-garden-300">{label}</span>
            <button
              type="button"
              onClick={() => {
                setListeningFor(action);
              }}
              className={`w-32 rounded border px-2 py-1 text-center font-mono text-xs ${
                listeningFor === action
                  ? "border-garden-500 bg-garden-900 text-light-divine"
                  : "border-garden-700 text-garden-200 hover:border-garden-500"
              }`}
            >
              {listeningFor === action
                ? "Press a key…"
                : (overrides[action] ?? defaultKeyLabel(action))}
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={resetToDefaults}
          className="rounded border border-garden-700 px-3 py-1.5 text-sm text-garden-300 hover:text-light-divine"
        >
          Reset to Defaults
        </button>
        <button
          type="button"
          onClick={onBack}
          className="rounded border border-garden-700 px-3 py-1.5 text-sm text-light-divine hover:border-garden-500"
        >
          Back
        </button>
      </div>
    </div>
  );
}

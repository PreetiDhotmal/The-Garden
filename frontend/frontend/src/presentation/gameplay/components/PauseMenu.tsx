import { useState } from "react";
import { useNavigate } from "react-router";
import { SettingsScreen } from "@/presentation/gameFlow/screens/SettingsScreen";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";

export interface PauseMenuProps {
  readonly onResume: () => void;
}

export function PauseMenu({ onResume }: PauseMenuProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const navigate = useNavigate();
  const { saveManager, eventBus } = useGameplay();

  const handleSave = () => {
    setSaveStatus("saving");
    saveManager
      .saveToStorage()
      .then(() => {
        setSaveStatus("saved");
        eventBus.emit("save:completed", {});
        window.setTimeout(() => {
          setSaveStatus("idle");
        }, 1500);
      })
      .catch(() => {
        setSaveStatus("idle");
      });
  };

  if (showSettings) {
    return (
      <div className="fixed inset-0 z-[90]">
        <SettingsScreen
          onBack={() => {
            setShowSettings(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70">
      <div className="flex w-64 flex-col gap-3 rounded-lg border border-garden-700 bg-shadow-valley p-6">
        <h2 className="mb-2 text-center font-[var(--font-display)] text-2xl text-light-divine">
          Paused
        </h2>
        <PauseButton label="Resume" onClick={onResume} />
        <PauseButton
          label={saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved ✓" : "Save"}
          onClick={handleSave}
        />
        <PauseButton
          label="Settings"
          onClick={() => {
            setShowSettings(true);
          }}
        />
        <PauseButton
          label="Return to Main Menu"
          onClick={() => {
            void navigate("/");
          }}
        />
        <PauseButton
          label="Quit"
          onClick={() => {
            // window.close() only succeeds for windows/tabs opened via
            // script — browsers deliberately forbid a page from closing
            // a tab the user opened themselves. That's a real browser
            // security boundary, not something to fake around; falling
            // back to the main menu is the honest next-best action.
            window.close();
            void navigate("/");
          }}
        />
      </div>
    </div>
  );
}

function PauseButton({ label, onClick }: { readonly label: string; readonly onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-garden-700 px-4 py-2 text-light-divine transition-colors hover:border-garden-500 hover:bg-garden-900"
    >
      {label}
    </button>
  );
}

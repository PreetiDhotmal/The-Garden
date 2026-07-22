import { useState } from "react";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";

export function SaveDataPanel() {
  const { saveManager } = useGameplay();
  const [status, setStatus] = useState<string>("");

  const handleSave = () => {
    saveManager
      .saveToStorage()
      .then(() => {
        setStatus(`Saved at ${new Date().toLocaleTimeString()}`);
      })
      .catch(() => {
        setStatus("Save failed.");
      });
  };

  const handleLoad = () => {
    saveManager
      .loadFromStorage()
      .then((save) => {
        if (!save) {
          setStatus("No save data found.");
          return;
        }
        saveManager.restoreFromSnapshot(save);
        setStatus(`Loaded save from ${save.savedAtIso}`);
      })
      .catch(() => {
        setStatus("Load failed.");
      });
  };

  const handleClear = () => {
    saveManager
      .clearStorage()
      .then(() => {
        setStatus("Save data cleared.");
      })
      .catch(() => {
        setStatus("Clear failed.");
      });
  };

  const snapshot = saveManager.captureSnapshot();

  return (
    <div className="flex flex-col gap-2 rounded-md border border-garden-700 bg-black/70 p-3 font-mono text-xs text-light-divine">
      <div className="font-semibold text-garden-300">Current Save Data</div>
      <div>Level: {snapshot.progress.level}</div>
      <div>Quests tracked: {snapshot.quests.length}</div>
      <div>Scripture unlocked: {snapshot.scripture.unlockedReferenceKeys.length}</div>
      <div>NPC states: {snapshot.npcStates.length}</div>
      <div>Story flags: {snapshot.storyFlags.length}</div>
      <div className="mt-1 flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="rounded border border-garden-700 px-2 py-1"
        >
          Save
        </button>
        <button
          type="button"
          onClick={handleLoad}
          className="rounded border border-garden-700 px-2 py-1"
        >
          Load
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded border border-garden-700 px-2 py-1"
        >
          Clear
        </button>
      </div>
      {status && <div className="text-garden-500">{status}</div>}
    </div>
  );
}

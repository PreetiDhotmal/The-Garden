import { useState } from "react";
import { InteractableObject } from "@/presentation/gameplay/components/InteractableObject";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { useGameFramework } from "@/presentation/game/hooks/useGameFramework";
import { CHAPTER_META_BY_ID } from "../chapterData";
import { WorldProgressionStatus } from "@/domain/gameplay/progression/WorldProgressionManager";
import type { WorldProgressionQueryContext } from "@/domain/gameplay/progression/WorldUnlockCondition";

export const SAVE_SHRINE_ID = "interactable:hub-save-shrine";

export interface HubSaveShrineProps {
  readonly position: readonly [number, number, number];
  readonly getProgressionContext: () => WorldProgressionQueryContext;
}

export function HubSaveShrine({ position, getProgressionContext }: HubSaveShrineProps) {
  const { saveManager } = useGameplay();
  const { chapterManager, gardenRestorationManager } = useGameFramework();
  const [isOpen, setIsOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const handleSave = () => {
    setSaveStatus("saving");
    saveManager
      .saveToStorage()
      .then(() => {
        setSaveStatus("saved");
        window.setTimeout(() => {
          setSaveStatus("idle");
        }, 1500);
      })
      .catch(() => {
        setSaveStatus("idle");
      });
  };

  const chapters = chapterManager.listInOrder(getProgressionContext());
  const completedCount = chapters.filter(
    (chapter) => chapter.status === WorldProgressionStatus.COMPLETED
  ).length;
  const gardenCompletionPercent = Math.round(
    gardenRestorationManager.getOverallRestorationScalar() * 100
  );

  return (
    <>
      <InteractableObject
        id={SAVE_SHRINE_ID}
        position={position}
        promptText="Visit the Shrine"
        color="#e8d090"
        radius={3}
        onInteract={() => {
          setIsOpen(true);
        }}
      />
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60">
          <div className="flex w-80 flex-col gap-4 rounded-lg border border-garden-700 bg-shadow-valley p-6">
            <h2 className="font-[var(--font-display)] text-2xl text-light-divine">The Shrine</h2>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-garden-300">Garden Restoration</span>
                <span className="text-light-divine">{gardenCompletionPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-garden-300">Chapters Completed</span>
                <span className="text-light-divine">
                  {completedCount} / {CHAPTER_META_BY_ID.size}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSave}
              className="rounded bg-garden-700 px-4 py-2 text-sm text-light-divine hover:bg-garden-500"
            >
              {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved ✓" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
              }}
              className="rounded border border-garden-700 px-4 py-2 text-sm text-garden-300 hover:text-light-divine"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

import { useEffect, useState } from "react";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { referenceKey } from "@/domain/gameplay/scripture/ScriptureFormatter";

export function WorldUnlockViewerPanel() {
  const { worldProgressionManager, questRegistry, scriptureProgressRef, storyFlags, eventBus } =
    useGameplay();
  const [, forceTick] = useState(0);

  useEffect(
    () =>
      eventBus.onAny(() => {
        forceTick((tick) => tick + 1);
      }),
    [eventBus]
  );

  const results = worldProgressionManager.listAllWithStatus({
    getQuestStatus: (questId) =>
      questRegistry.has(questId) ? questRegistry.get(questId).status : null,
    isScriptureUnlocked: (key) =>
      scriptureProgressRef.current
        .listUnlocked()
        .some((unlock) => referenceKey(unlock.reference) === key),
    hasStoryFlag: (flag) => storyFlags.has(flag),
  });

  return (
    <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-md border border-garden-700 bg-black/70 p-3 font-mono text-xs text-light-divine">
      <div className="font-semibold text-garden-300">World Unlock Viewer ({results.length})</div>
      {results.length === 0 && <div className="text-garden-700">No worlds registered.</div>}
      {results.map(({ definition, status }) => (
        <div
          key={definition.worldRegionId}
          className="flex justify-between border-t border-garden-900 pt-1"
        >
          <span>{definition.displayName}</span>
          <span className="text-garden-300">{status}</span>
        </div>
      ))}
    </div>
  );
}

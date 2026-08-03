import { useEffect, useState } from "react";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";

export function QuestDebugPanel() {
  const { questRegistry, eventBus } = useGameplay();
  const [, forceTick] = useState(0);

  useEffect(
    () =>
      eventBus.onAny(() => {
        forceTick((tick) => tick + 1);
      }),
    [eventBus]
  );

  const quests = questRegistry.list();

  return (
    <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-md border border-garden-700 bg-black/70 p-3 font-mono text-xs text-light-divine">
      <div className="font-semibold text-garden-300">Quest Debugger ({quests.length})</div>
      {quests.length === 0 && <div className="text-garden-700">No quests registered.</div>}
      {quests.map((quest) => (
        <div key={quest.id} className="border-t border-garden-900 pt-1">
          <div>
            {quest.title} — <span className="text-garden-300">{quest.status}</span>
          </div>
          {quest.objectives.map((objective) => (
            <div key={objective.id} className="pl-2 text-garden-500">
              {objective.id}: {objective.currentCount}/{objective.targetCount} ({objective.objectiveType})
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

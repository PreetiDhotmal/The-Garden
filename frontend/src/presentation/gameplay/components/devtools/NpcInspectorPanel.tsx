import { useEffect, useState } from "react";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";

export function NpcInspectorPanel() {
  const { npcRegistry, npcManager, eventBus } = useGameplay();
  const [, forceTick] = useState(0);

  useEffect(
    () =>
      eventBus.onAny(() => {
        forceTick((tick) => tick + 1);
      }),
    [eventBus]
  );

  const npcs = npcRegistry.list();

  return (
    <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-md border border-garden-700 bg-black/70 p-3 font-mono text-xs text-light-divine">
      <div className="font-semibold text-garden-300">NPC Inspector ({npcs.length})</div>
      {npcs.length === 0 && <div className="text-garden-700">No NPCs registered.</div>}
      {npcs.map((npc) => {
        const state = npcManager.getState(npc.id);
        return (
          <div key={npc.id} className="border-t border-garden-900 pt-1">
            <div>{npc.name}</div>
            <div className="pl-2 text-garden-500">
              region: {npc.worldRegionId} · quest-giver: {npc.isQuestGiver ? "yes" : "no"}
            </div>
            <div className="pl-2 text-garden-500">
              talked to: {state.hasBeenTalkedToOnce ? `yes (${String(state.talkCount)}x)` : "no"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

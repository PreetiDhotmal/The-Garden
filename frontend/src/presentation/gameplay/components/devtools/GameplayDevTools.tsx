import { useState } from "react";
import type { CharacterEntity } from "@/domain/character/CharacterEntity";
import type { DialogueSessionSnapshot } from "@/domain/gameplay/dialogue/DialogueManager";
import { QuestDebugPanel } from "./QuestDebugPanel";
import { NpcInspectorPanel } from "./NpcInspectorPanel";
import { DialogueViewerPanel } from "./DialogueViewerPanel";
import { WorldUnlockViewerPanel } from "./WorldUnlockViewerPanel";
import { EventLogPanel } from "./EventLogPanel";
import { PlayerPositionPanel } from "./PlayerPositionPanel";
import { SaveDataPanel } from "./SaveDataPanel";
import { useDebugSettingsStore } from "@/presentation/engine/stores/debugSettingsStore";

export interface GameplayDevToolsProps {
  readonly playerEntity: CharacterEntity | null;
  readonly dialogueSnapshot: DialogueSessionSnapshot | null;
}

type Tab = "quests" | "npcs" | "dialogue" | "worlds" | "events" | "player" | "save";

const TABS: readonly { id: Tab; label: string }[] = [
  { id: "quests", label: "Quests" },
  { id: "npcs", label: "NPCs" },
  { id: "dialogue", label: "Dialogue" },
  { id: "worlds", label: "Worlds" },
  { id: "events", label: "Events" },
  { id: "player", label: "Player" },
  { id: "save", label: "Save" },
];

/** Dev-only. Not rendered in production builds — see the route's DEV guard. */
export function GameplayDevTools({ playerEntity, dialogueSnapshot }: GameplayDevToolsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("quests");

  const isDebugPanelOpen = useDebugSettingsStore((state) => state.isPanelOpen);

  if (!import.meta.env.DEV || !isDebugPanelOpen) {
    return null;
  }

  return (
    <div className="pointer-events-auto fixed bottom-4 right-1/2 z-40 w-72 translate-x-1/2">
      <button
        type="button"
        onClick={() => {
          setIsOpen((open) => !open);
        }}
        className="w-full rounded-md border border-garden-700 bg-black/80 px-3 py-1 font-mono text-xs text-light-divine"
      >
        Dev Tools {isOpen ? "▲" : "▼"}
      </button>
      {isOpen && (
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex flex-wrap gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                }}
                className={`rounded px-2 py-0.5 text-[10px] font-mono ${
                  tab === t.id ? "bg-garden-700 text-light-divine" : "bg-black/60 text-garden-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tab === "quests" && <QuestDebugPanel />}
          {tab === "npcs" && <NpcInspectorPanel />}
          {tab === "dialogue" && <DialogueViewerPanel snapshot={dialogueSnapshot} />}
          {tab === "worlds" && <WorldUnlockViewerPanel />}
          {tab === "events" && <EventLogPanel />}
          {tab === "player" && <PlayerPositionPanel entity={playerEntity} />}
          {tab === "save" && <SaveDataPanel />}
        </div>
      )}
    </div>
  );
}

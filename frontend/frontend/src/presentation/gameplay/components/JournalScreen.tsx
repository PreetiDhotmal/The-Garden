import { useMemo, useState } from "react";
import { QuestStatus } from "@/domain/gameplay/quest/QuestTypes";
import { CollectibleCategory } from "@/domain/gameplay/collectible/CollectibleCategory";
import { parseReferenceKey, formatReference } from "@/domain/gameplay/scripture/ScriptureFormatter";
import { levelForExperience } from "@/domain/gameplay/reward/PlayerProgressTotals";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { useGameplayVersion } from "@/presentation/gameplay/hooks/useGameplayVersion";

export interface JournalScreenProps {
  readonly onClose: () => void;
}

type JournalTab =
  | "CURRENT_QUESTS"
  | "COMPLETED_QUESTS"
  | "SCRIPTURE_READ"
  | "FAITH_JOURNEY"
  | "COLLECTED_ITEMS"
  | "STATISTICS"
  | "MAP";

const TABS: readonly { id: JournalTab; label: string }[] = [
  { id: "CURRENT_QUESTS", label: "Current Quests" },
  { id: "COMPLETED_QUESTS", label: "Completed Quests" },
  { id: "SCRIPTURE_READ", label: "Scripture Read" },
  { id: "FAITH_JOURNEY", label: "Faith Journey" },
  { id: "COLLECTED_ITEMS", label: "Collected Items" },
  { id: "STATISTICS", label: "Statistics" },
  { id: "MAP", label: "Map" },
];

const COLLECTIBLE_CATEGORIES = Object.values(CollectibleCategory);

export function JournalScreen({ onClose }: JournalScreenProps) {
  const { questRegistry, scriptureProgressRef, collectibleInventory, rewardEngine } = useGameplay();
  const [activeTab, setActiveTab] = useState<JournalTab>("CURRENT_QUESTS");
  const [searchText, setSearchText] = useState("");
  // Re-renders this component whenever anything journal-relevant changes — see useGameplayVersion's docstring.
  useGameplayVersion();

  const quests = questRegistry.list();
  const activeQuests = quests.filter((q) => q.status === QuestStatus.ACTIVE);
  const completedQuests = quests.filter((q) => q.status === QuestStatus.COMPLETED);
  const discoveredScripture = scriptureProgressRef.current.listDiscoveredKeys();
  const memorizedScripture = new Set(scriptureProgressRef.current.listMemorizedKeys());
  const totals = rewardEngine.getTotals();
  const currentLevel = levelForExperience(totals.experience);

  const filteredActiveQuests = useMemo(
    () => filterByTitle(activeQuests, searchText),
    [activeQuests, searchText]
  );
  const filteredCompletedQuests = useMemo(
    () => filterByTitle(completedQuests, searchText),
    [completedQuests, searchText]
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60">
      <div className="flex h-[85vh] w-[90vw] max-w-4xl flex-col overflow-hidden rounded-lg border border-garden-700 bg-shadow-valley">
        <div className="flex items-center justify-between border-b border-garden-700 px-6 py-4">
          <h1 className="font-[var(--font-display)] text-2xl text-light-divine">Journal</h1>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-garden-700 px-3 py-1 text-sm text-garden-300 hover:text-light-divine"
          >
            Close
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <nav className="flex w-48 flex-shrink-0 flex-col gap-1 border-r border-garden-700 p-3">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                }}
                className={`rounded px-3 py-2 text-left text-sm transition-colors ${
                  activeTab === tab.id
                    ? "bg-garden-900 text-light-divine"
                    : "text-garden-300 hover:bg-garden-900/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto p-6">
            {(activeTab === "CURRENT_QUESTS" || activeTab === "COMPLETED_QUESTS") && (
              <input
                type="text"
                placeholder="Search quests…"
                value={searchText}
                onChange={(event) => {
                  setSearchText(event.target.value);
                }}
                className="mb-4 w-full rounded border border-garden-700 bg-black/30 px-3 py-1.5 text-sm text-light-divine placeholder:text-garden-700"
              />
            )}

            {activeTab === "CURRENT_QUESTS" && (
              <div className="flex flex-col gap-4">
                {filteredActiveQuests.length === 0 && <EmptyState text="No active quests." />}
                {filteredActiveQuests.map((quest) => (
                  <div key={quest.id} className="rounded border border-garden-700 p-3">
                    <div className="font-semibold text-light-divine">{quest.title}</div>
                    <p className="mt-1 text-xs text-garden-300">{quest.description}</p>
                    <ul className="mt-2 flex flex-col gap-1">
                      {quest.objectives.map((objective) => (
                        <li key={objective.id} className="flex items-center gap-2 text-xs">
                          <span
                            className={
                              objective.currentCount >= objective.targetCount
                                ? "text-garden-500"
                                : "text-garden-300"
                            }
                          >
                            {objective.currentCount >= objective.targetCount ? "✓" : "○"}
                          </span>
                          <span className="text-garden-200">{objective.description}</span>
                          {objective.targetCount > 1 && (
                            <span className="font-mono text-garden-700">
                              ({objective.currentCount}/{objective.targetCount})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "COMPLETED_QUESTS" && (
              <div className="flex flex-col gap-3">
                {filteredCompletedQuests.length === 0 && <EmptyState text="No completed quests yet." />}
                {filteredCompletedQuests.map((quest) => (
                  <div
                    key={quest.id}
                    className="flex items-center gap-2 rounded border border-garden-700 p-3"
                  >
                    <span className="text-garden-500">✓</span>
                    <span className="text-light-divine">{quest.title}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "SCRIPTURE_READ" && (
              <div className="flex flex-col gap-2">
                {discoveredScripture.length === 0 && <EmptyState text="No scripture discovered yet." />}
                {discoveredScripture.map((key) => {
                  const reference = parseReferenceKey(key);
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-2 rounded border border-garden-700 p-2 text-sm"
                    >
                      <span className="text-light-divine">{formatReference(reference)}</span>
                      {memorizedScripture.has(key) && (
                        <span className="text-xs text-garden-500">Memorized</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "FAITH_JOURNEY" && (
              <div className="flex flex-col gap-4">
                <div className="rounded border border-garden-700 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-garden-300">Level {currentLevel}</span>
                    <span className="font-mono text-garden-700">{totals.experience} XP</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-garden-900">
                    <div
                      className="h-full rounded-full bg-garden-500"
                      style={{ width: `${String(totals.experience % 100)}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <StatCard label="Faith Points" value={totals.faithPoints} />
                  <StatCard label="Coins" value={totals.coins} />
                </div>
              </div>
            )}

            {activeTab === "COLLECTED_ITEMS" && (
              <div className="grid grid-cols-2 gap-3">
                {COLLECTIBLE_CATEGORIES.map((category) => (
                  <StatCard
                    key={category}
                    label={category.replaceAll("_", " ")}
                    value={collectibleInventory.countOf(category)}
                  />
                ))}
              </div>
            )}

            {activeTab === "STATISTICS" && (
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Quests Completed" value={completedQuests.length} />
                <StatCard label="Items Collected" value={collectibleInventory.totalCollected()} />
                <StatCard label="Scripture Discovered" value={discoveredScripture.length} />
                <StatCard label="Scripture Memorized" value={memorizedScripture.size} />
              </div>
            )}

            {activeTab === "MAP" && (
              <EmptyState text="The map will chart your journey through the seven worlds — coming in a future update." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function filterByTitle<T extends { title: string }>(
  items: readonly T[],
  searchText: string
): readonly T[] {
  if (!searchText.trim()) {
    return items;
  }
  const needle = searchText.toLowerCase();
  return items.filter((item) => item.title.toLowerCase().includes(needle));
}

function EmptyState({ text }: { readonly text: string }) {
  return <p className="text-sm text-garden-700">{text}</p>;
}

function StatCard({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div className="rounded border border-garden-700 p-3">
      <div className="text-xs uppercase tracking-wide text-garden-300">{label}</div>
      <div className="text-lg text-light-divine">{value}</div>
    </div>
  );
}

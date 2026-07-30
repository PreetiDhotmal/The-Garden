import { useState } from "react";
import { CollectibleCategory } from "@/domain/gameplay/collectible/CollectibleCategory";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { useGameplayVersion } from "@/presentation/gameplay/hooks/useGameplayVersion";

export interface InventoryScreenProps {
  readonly onClose: () => void;
}

const CATEGORY_ICONS: Readonly<Record<CollectibleCategory, string>> = {
  [CollectibleCategory.FLOWER]: "❀",
  [CollectibleCategory.SEED]: "◆",
  [CollectibleCategory.SCROLL]: "📜",
  [CollectibleCategory.COIN]: "●",
  [CollectibleCategory.KEY]: "🔑",
  [CollectibleCategory.ARTIFACT]: "◈",
  [CollectibleCategory.SCRIPTURE_FRAGMENT]: "✦",
};

const ALL_CATEGORIES = Object.values(CollectibleCategory);

export function InventoryScreen({ onClose }: InventoryScreenProps) {
  const { collectibleInventory } = useGameplay();
  const [filter, setFilter] = useState<CollectibleCategory | "ALL">("ALL");
  const [sortDescending, setSortDescending] = useState(true);
  useGameplayVersion();

  const categoriesWithCounts = ALL_CATEGORIES.map((category) => ({
    category,
    count: collectibleInventory.countOf(category),
  }))
    .filter(({ category }) => filter === "ALL" || category === filter)
    .sort((a, b) => (sortDescending ? b.count - a.count : a.count - b.count));

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60">
      <div className="flex h-[80vh] w-[80vw] max-w-3xl flex-col overflow-hidden rounded-lg border border-garden-700 bg-shadow-valley">
        <div className="flex items-center justify-between border-b border-garden-700 px-6 py-4">
          <h1 className="font-[var(--font-display)] text-2xl text-light-divine">Inventory</h1>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-garden-700 px-3 py-1 text-sm text-garden-300 hover:text-light-divine"
          >
            Close
          </button>
        </div>

        <div className="flex items-center gap-3 border-b border-garden-700 px-6 py-3">
          <select
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value as CollectibleCategory | "ALL");
            }}
            className="rounded border border-garden-700 bg-black/30 px-2 py-1 text-sm text-light-divine"
          >
            <option value="ALL">All Categories</option>
            {ALL_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setSortDescending((current) => !current);
            }}
            className="rounded border border-garden-700 px-2 py-1 text-sm text-garden-300 hover:text-light-divine"
          >
            Sort: {sortDescending ? "Most first" : "Least first"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-3">
            {categoriesWithCounts.map(({ category, count }) => (
              <div
                key={category}
                className="flex flex-col items-center gap-1 rounded border border-garden-700 p-4"
                title={`${category.replaceAll("_", " ")} — collected during exploration`}
              >
                <span className="text-2xl text-garden-300">{CATEGORY_ICONS[category]}</span>
                <span className="text-xs uppercase tracking-wide text-garden-300">
                  {category.replaceAll("_", " ")}
                </span>
                <span className="font-mono text-light-divine">×{count}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-garden-700 pt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-garden-500">
              Future Expansion
            </h2>
            <p className="text-sm text-garden-700">Equipment — coming in a future update.</p>
            <p className="text-sm text-garden-700">Crafting — coming in a future update.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

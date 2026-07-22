import { useState } from "react";
import { useGameplay } from "../hooks/useGameplay";
import { useGameplayVersion } from "../hooks/useGameplayVersion";

export function InventoryWindow() {
  const { inventory, itemDatabase } = useGameplay();
  const [isOpen, setIsOpen] = useState(false);
  useGameplayVersion(["inventory:item-added", "inventory:item-removed"]);

  return (
    <div className="pointer-events-auto fixed bottom-4 left-1/2 z-30 -translate-x-1/2">
      <button
        type="button"
        onClick={() => {
          setIsOpen((open) => !open);
        }}
        className="rounded-md border border-garden-700 bg-black/70 px-3 py-1 font-mono text-xs text-light-divine"
      >
        Inventory (I)
      </button>
      {isOpen && (
        <div className="mt-2 grid grid-cols-5 gap-2 rounded-md border border-garden-700 bg-black/80 p-3">
          {inventory.getSlots().map((slot) => (
            <div
              key={slot.index}
              className="flex h-14 w-14 flex-col items-center justify-center rounded border border-garden-700 bg-garden-900/60 text-center text-[10px] text-light-divine"
            >
              {slot.stack ? (
                <>
                  <span className="truncate px-1">{itemDatabase.get(slot.stack.itemId).name}</span>
                  <span className="text-garden-300">x{slot.stack.quantity}</span>
                </>
              ) : (
                <span className="text-garden-700">—</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import type { ItemStack } from "./ItemStack";
import type { Inventory } from "./Inventory";

export interface InventorySave {
  readonly capacity: number;
  readonly slots: readonly (ItemStack | null)[];
}

export interface InventorySerializer {
  serialize: (inventory: Inventory) => InventorySave;
}

export function serializeInventory(inventory: Inventory): InventorySave {
  return {
    capacity: inventory.capacity,
    slots: inventory.getSlots().map((slot) => slot.stack),
  };
}

import type { ItemStack } from "./ItemStack";

export interface InventorySlot {
  readonly index: number;
  readonly stack: ItemStack | null;
}

export function isSlotEmpty(slot: InventorySlot): boolean {
  return slot.stack === null;
}

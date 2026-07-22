import type { GameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import type { ItemDatabase } from "./ItemDatabase";
import type { InventorySlot } from "./InventorySlot";
import type { ItemStack } from "./ItemStack";

export class InventoryFullError extends Error {
  constructor(
    readonly itemId: string,
    readonly remainingQuantity: number
  ) {
    super(`Inventory is full — ${String(remainingQuantity)} of item "${itemId}" could not be added.`);
    this.name = "InventoryFullError";
  }
}

export class InsufficientItemsError extends Error {
  constructor(
    readonly itemId: string,
    readonly requested: number,
    readonly available: number
  ) {
    super(
      `Cannot remove ${String(requested)} of item "${itemId}" — only ${String(available)} available.`
    );
    this.name = "InsufficientItemsError";
  }
}

/**
 * Fixed-capacity slot-based inventory with stack merging. Depends on
 * ItemDatabase for each item's maxStackSize/stackable rules — it
 * never hardcodes stacking behavior per item.
 */
export class Inventory {
  private slots: InventorySlot[];

  constructor(
    readonly capacity: number,
    private readonly itemDatabase: ItemDatabase,
    private readonly eventBus: GameplayEventBus
  ) {
    if (capacity <= 0) {
      throw new RangeError("capacity must be greater than zero");
    }
    this.slots = Array.from({ length: capacity }, (_, index) => ({ index, stack: null }));
  }

  getSlots(): readonly InventorySlot[] {
    return this.slots;
  }

  /** For save/load — replaces slot contents wholesale from a saved InventorySave, bypassing addItem's stacking logic since this is a direct restore, not a new pickup. */
  restoreSlots(savedSlots: readonly (ItemStack | null)[]): void {
    this.slots = savedSlots.map((stack, index) => ({ index, stack }));
  }

  quantityOf(itemId: string): number {
    return this.slots.reduce(
      (total, slot) => total + (slot.stack?.itemId === itemId ? slot.stack.quantity : 0),
      0
    );
  }

  hasItem(itemId: string, quantity = 1): boolean {
    return this.quantityOf(itemId) >= quantity;
  }

  /** Adds as much of `quantity` as fits (merging into existing stacks first, then empty slots), throwing if any remainder can't fit. */
  addItem(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      throw new RangeError("quantity must be greater than zero");
    }
    const definition = this.itemDatabase.get(itemId);
    let remaining = quantity;

    if (definition.stackable) {
      this.slots = this.slots.map((slot) => {
        if (remaining <= 0 || slot.stack?.itemId !== itemId) {
          return slot;
        }
        const spaceInStack = definition.maxStackSize - slot.stack.quantity;
        const amountToAdd = Math.min(spaceInStack, remaining);
        remaining -= amountToAdd;
        return { ...slot, stack: { itemId, quantity: slot.stack.quantity + amountToAdd } };
      });
    }

    this.slots = this.slots.map((slot) => {
      if (remaining <= 0 || slot.stack !== null) {
        return slot;
      }
      const amountToAdd = Math.min(definition.maxStackSize, remaining);
      remaining -= amountToAdd;
      return { ...slot, stack: { itemId, quantity: amountToAdd } };
    });

    if (remaining > 0) {
      throw new InventoryFullError(itemId, remaining);
    }
    this.eventBus.emit("inventory:item-added", { itemId, quantity });
  }

  /** Removes `quantity` of an item, draining from stacks in slot order. Throws if not enough is available. */
  removeItem(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      throw new RangeError("quantity must be greater than zero");
    }
    const available = this.quantityOf(itemId);
    if (available < quantity) {
      throw new InsufficientItemsError(itemId, quantity, available);
    }

    let remaining = quantity;
    this.slots = this.slots.map((slot) => {
      if (remaining <= 0 || slot.stack?.itemId !== itemId) {
        return slot;
      }
      const amountToRemove = Math.min(slot.stack.quantity, remaining);
      remaining -= amountToRemove;
      const newQuantity = slot.stack.quantity - amountToRemove;
      return { ...slot, stack: newQuantity > 0 ? { itemId, quantity: newQuantity } : null };
    });

    this.eventBus.emit("inventory:item-removed", { itemId, quantity });
  }

  findFirstSlot(itemId: string): InventorySlot | null {
    return this.slots.find((slot) => slot.stack?.itemId === itemId) ?? null;
  }

  isFull(): boolean {
    return this.slots.every((slot) => slot.stack !== null);
  }
}

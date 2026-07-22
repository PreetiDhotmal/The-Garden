import type { ItemDatabase } from "./ItemDatabase";

export interface ItemStack {
  readonly itemId: string;
  readonly quantity: number;
}

export class InvalidItemStackError extends Error {
  constructor(reason: string) {
    super(`Invalid item stack: ${reason}`);
    this.name = "InvalidItemStackError";
  }
}

export class ItemFactory {
  constructor(private readonly itemDatabase: ItemDatabase) {}

  createStack(itemId: string, quantity: number): ItemStack {
    const definition = this.itemDatabase.get(itemId);
    if (quantity <= 0) {
      throw new InvalidItemStackError("quantity must be greater than zero");
    }
    if (quantity > definition.maxStackSize) {
      throw new InvalidItemStackError(
        `quantity ${String(quantity)} exceeds maxStackSize ${String(definition.maxStackSize)} for item "${itemId}"`
      );
    }
    return { itemId, quantity };
  }
}

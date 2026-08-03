import { describe, expect, it } from "vitest";
import { createGameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import { ItemCategory } from "./ItemCategory";
import { createItemDefinition } from "./ItemDefinition";
import { ItemDatabase } from "./ItemDatabase";
import { Inventory, InsufficientItemsError, InventoryFullError } from "./Inventory";

function buildDatabase(): ItemDatabase {
  const database = new ItemDatabase();
  database.registerAll([
    createItemDefinition({
      id: "seed",
      name: "Seed",
      description: "A small seed.",
      category: ItemCategory.MATERIAL,
      stackable: true,
      maxStackSize: 10,
    }),
    createItemDefinition({
      id: "key",
      name: "Key",
      description: "A rusty key.",
      category: ItemCategory.KEY,
      stackable: false,
    }),
  ]);
  return database;
}

describe("Inventory", () => {
  it("adds an item into an empty slot", () => {
    const inventory = new Inventory(4, buildDatabase(), createGameplayEventBus());
    inventory.addItem("seed", 3);
    expect(inventory.quantityOf("seed")).toBe(3);
  });

  it("merges into an existing stack before using a new slot", () => {
    const inventory = new Inventory(4, buildDatabase(), createGameplayEventBus());
    inventory.addItem("seed", 3);
    inventory.addItem("seed", 4);

    expect(inventory.quantityOf("seed")).toBe(7);
    expect(inventory.getSlots().filter((slot) => slot.stack !== null)).toHaveLength(1);
  });

  it("overflows into a new slot once a stack is full", () => {
    const inventory = new Inventory(4, buildDatabase(), createGameplayEventBus());
    inventory.addItem("seed", 10);
    inventory.addItem("seed", 5);

    expect(inventory.quantityOf("seed")).toBe(15);
    expect(inventory.getSlots().filter((slot) => slot.stack !== null)).toHaveLength(2);
  });

  it("gives non-stackable items their own slot each", () => {
    const inventory = new Inventory(4, buildDatabase(), createGameplayEventBus());
    inventory.addItem("key", 1);
    inventory.addItem("key", 1);

    expect(inventory.getSlots().filter((slot) => slot.stack !== null)).toHaveLength(2);
  });

  it("throws InventoryFullError when there is no room", () => {
    const inventory = new Inventory(1, buildDatabase(), createGameplayEventBus());
    inventory.addItem("seed", 10);

    expect(() => {
      inventory.addItem("seed", 1);
    }).toThrow(InventoryFullError);
  });

  it("removes items, draining stacks in slot order", () => {
    const inventory = new Inventory(4, buildDatabase(), createGameplayEventBus());
    inventory.addItem("seed", 10);
    inventory.addItem("seed", 5);

    inventory.removeItem("seed", 12);

    expect(inventory.quantityOf("seed")).toBe(3);
  });

  it("clears a slot entirely once its stack reaches zero", () => {
    const inventory = new Inventory(4, buildDatabase(), createGameplayEventBus());
    inventory.addItem("seed", 5);
    inventory.removeItem("seed", 5);

    expect(inventory.quantityOf("seed")).toBe(0);
    expect(inventory.getSlots().every((slot) => slot.stack === null)).toBe(true);
  });

  it("throws InsufficientItemsError when removing more than available", () => {
    const inventory = new Inventory(4, buildDatabase(), createGameplayEventBus());
    inventory.addItem("seed", 2);

    expect(() => {
      inventory.removeItem("seed", 5);
    }).toThrow(InsufficientItemsError);
  });

  it("hasItem() checks total quantity across stacks", () => {
    const inventory = new Inventory(4, buildDatabase(), createGameplayEventBus());
    inventory.addItem("seed", 10);
    inventory.addItem("seed", 5);

    expect(inventory.hasItem("seed", 15)).toBe(true);
    expect(inventory.hasItem("seed", 16)).toBe(false);
  });
});

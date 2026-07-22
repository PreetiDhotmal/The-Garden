import type { ItemCategory } from "./ItemCategory";
import type { EquipmentSlot } from "./EquipmentSlot";

export interface ItemDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: ItemCategory;
  readonly stackable: boolean;
  readonly maxStackSize: number;
  readonly iconAssetId: string | null;
  /** Which equipment slot this item occupies when equipped, if any — most items (materials, quest items) are never equippable. */
  readonly equipmentSlot: EquipmentSlot | null;
}

export class InvalidItemDefinitionError extends Error {
  constructor(reason: string) {
    super(`Invalid item definition: ${reason}`);
    this.name = "InvalidItemDefinitionError";
  }
}

export interface CreateItemDefinitionInput {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: ItemCategory;
  readonly stackable?: boolean;
  readonly maxStackSize?: number;
  readonly iconAssetId?: string | null;
  readonly equipmentSlot?: EquipmentSlot | null;
}

export function createItemDefinition(input: CreateItemDefinitionInput): ItemDefinition {
  if (input.id.trim().length === 0) {
    throw new InvalidItemDefinitionError("id must not be empty");
  }
  const stackable = input.stackable ?? true;
  const maxStackSize = input.maxStackSize ?? (stackable ? 99 : 1);
  if (maxStackSize <= 0) {
    throw new InvalidItemDefinitionError("maxStackSize must be greater than zero");
  }
  if (!stackable && maxStackSize !== 1) {
    throw new InvalidItemDefinitionError("a non-stackable item must have maxStackSize 1");
  }

  return {
    id: input.id,
    name: input.name,
    description: input.description,
    category: input.category,
    stackable,
    maxStackSize,
    iconAssetId: input.iconAssetId ?? null,
    equipmentSlot: input.equipmentSlot ?? null,
  };
}

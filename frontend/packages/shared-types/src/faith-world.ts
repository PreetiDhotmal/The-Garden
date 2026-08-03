/**
 * The seven symbolic worlds representing stages of faith the player
 * progresses through. Order is significant — it defines unlock sequence.
 *
 * Mirrors backend enum: com.thegarden.domain.world.FaithWorld
 */
export const FAITH_WORLDS = [
  "GARDEN_OF_BEGINNINGS",
  "WILDERNESS_OF_TESTING",
  "VALLEY_OF_SHADOWS",
  "MOUNTAIN_OF_REVELATION",
  "RIVER_OF_LIVING_WATER",
  "FIELDS_OF_HARVEST",
  "CITY_OF_LIGHT",
] as const;

export type FaithWorld = (typeof FAITH_WORLDS)[number];

export function isFaithWorld(value: string): value is FaithWorld {
  return (FAITH_WORLDS as readonly string[]).includes(value);
}

export function faithWorldOrder(world: FaithWorld): number {
  return FAITH_WORLDS.indexOf(world);
}

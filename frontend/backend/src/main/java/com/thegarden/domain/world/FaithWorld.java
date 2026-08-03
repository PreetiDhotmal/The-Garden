package com.thegarden.domain.world;

/**
 * The seven symbolic worlds representing stages of faith the player
 * progresses through. Declaration order is significant — it defines
 * the required unlock sequence.
 *
 * <p>Mirrors the frontend contract: packages/shared-types/src/faith-world.ts
 */
public enum FaithWorld {
    GARDEN_OF_BEGINNINGS,
    WILDERNESS_OF_TESTING,
    VALLEY_OF_SHADOWS,
    MOUNTAIN_OF_REVELATION,
    RIVER_OF_LIVING_WATER,
    FIELDS_OF_HARVEST,
    CITY_OF_LIGHT;

    public static final FaithWorld[] ORDERED_WORLDS = values();
}

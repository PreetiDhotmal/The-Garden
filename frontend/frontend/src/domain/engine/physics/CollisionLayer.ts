/**
 * Named collision layers. Values are indices (0–15) rather than
 * pre-shifted bits — Rapier's `interactionGroups(memberships, filters)`
 * helper (see infrastructure/engine/physics) takes group indices
 * directly, so this maps onto it with no translation.
 *
 * Only 16 layers are supported — this is a Rapier engine limit, not an
 * arbitrary one. Adding a 17th layer is a compile error via the
 * exhaustiveness of `ALL_COLLISION_LAYERS`.
 */
export enum CollisionLayer {
  TERRAIN = 0,
  STATIC_SCENERY = 1,
  PLAYER = 2,
  NPC = 3,
  INTERACTABLE = 4,
  TRIGGER_ZONE = 5,
  PROJECTILE = 6,
  DEBUG_ONLY = 7,
}

export const ALL_COLLISION_LAYERS: readonly CollisionLayer[] = [
  CollisionLayer.TERRAIN,
  CollisionLayer.STATIC_SCENERY,
  CollisionLayer.PLAYER,
  CollisionLayer.NPC,
  CollisionLayer.INTERACTABLE,
  CollisionLayer.TRIGGER_ZONE,
  CollisionLayer.PROJECTILE,
  CollisionLayer.DEBUG_ONLY,
];

/**
 * A pure bitmask over collision layers (0–15). This is intentionally
 * decoupled from Rapier's `InteractionGroups` type — see
 * infrastructure/engine/physics/collisionLayerAdapter.ts for the
 * translation — so this class can be unit tested without a physics
 * engine and reused if the physics backend ever changes.
 */
export class LayerMask {
  private constructor(private readonly bits: number) {}

  static none(): LayerMask {
    return new LayerMask(0);
  }

  static of(...layers: readonly CollisionLayer[]): LayerMask {
    let bits = 0;
    for (const layer of layers) {
      LayerMask.assertValidLayer(layer);
      bits |= 1 << layer;
    }
    return new LayerMask(bits);
  }

  private static assertValidLayer(layer: CollisionLayer): void {
    const layerValue: number = layer;
    if (layerValue < 0 || layerValue > 15) {
      throw new RangeError(`Collision layer index ${layerValue.toString()} is outside the valid 0–15 range.`);
    }
  }

  with(layer: CollisionLayer): LayerMask {
    LayerMask.assertValidLayer(layer);
    return new LayerMask(this.bits | (1 << layer));
  }

  without(layer: CollisionLayer): LayerMask {
    return new LayerMask(this.bits & ~(1 << layer));
  }

  has(layer: CollisionLayer): boolean {
    return (this.bits & (1 << layer)) !== 0;
  }

  /** True if this mask and `other` share at least one layer. */
  intersects(other: LayerMask): boolean {
    return (this.bits & other.bits) !== 0;
  }

  toLayerIndices(): readonly CollisionLayer[] {
    return ALL_COLLISION_LAYERS.filter((layer) => this.has(layer));
  }

  toBits(): number {
    return this.bits;
  }
}

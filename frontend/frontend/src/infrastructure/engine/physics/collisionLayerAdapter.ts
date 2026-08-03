import { interactionGroups } from "@react-three/rapier";
import type { InteractionGroups } from "@dimforge/rapier3d-compat";
import { LayerMask } from "@/domain/engine/physics/CollisionLayer";

/**
 * Translates our engine-agnostic LayerMask into Rapier's
 * InteractionGroups bitmask, for use in a RigidBody/Collider's
 * `collisionGroups`/`solverGroups` props.
 *
 * @param membership Layers this body belongs to.
 * @param filter Layers this body should collide with. Defaults to
 *   colliding with every layer in `membership`'s complement — pass
 *   explicitly to restrict further.
 */
export function toInteractionGroups(membership: LayerMask, filter?: LayerMask): InteractionGroups {
  const membershipIndices = [...membership.toLayerIndices()];
  const filterIndices = filter ? [...filter.toLayerIndices()] : undefined;
  return interactionGroups(membershipIndices, filterIndices);
}

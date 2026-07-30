import { useLayoutEffect, useRef, type ReactNode } from "react";
import type { Group } from "three";
import {
  layerForPlayer,
  type VisibilityLayerPlayer,
} from "@/domain/game/trust/playerVisibilityLayers";

export interface VisibleToPlayerProps {
  readonly player: VisibilityLayerPlayer;
  readonly children: ReactNode;
}

/**
 * Restricts everything inside to one player's camera by setting the
 * Three.js layer bitmask on every descendant object, not just the
 * wrapping group — layers.set() only affects the object it's called
 * on, and a bridge/platform is almost always a group of several
 * meshes, so this must traverse. Runs in useLayoutEffect (before
 * paint) so nothing is visible-then-hidden for even one frame.
 * "BOTH" is a deliberate no-op — content stays on the default layer
 * (0), which every camera already has enabled, so mixing
 * VisibleToPlayer with ordinary always-visible content in the same
 * puzzle needs no special-casing at the call site.
 */
export function VisibleToPlayer({ player, children }: VisibleToPlayerProps) {
  const groupRef = useRef<Group>(null);

  useLayoutEffect(() => {
    const layer = layerForPlayer(player);
    if (layer === null || !groupRef.current) {
      return;
    }
    groupRef.current.traverse((object) => {
      object.layers.set(layer);
    });
  }, [player, children]);

  return <group ref={groupRef}>{children}</group>;
}

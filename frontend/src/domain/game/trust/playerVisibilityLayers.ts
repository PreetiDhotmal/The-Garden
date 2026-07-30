/**
 * Layer 0 (Three.js's default) stays the shared world every camera
 * always sees — terrain, other players, puzzle mechanisms both
 * players should see. These two additional layers are reserved for
 * content visible to exactly one player's camera.
 */
export const PLAYER_A_ONLY_LAYER = 1;
export const PLAYER_B_ONLY_LAYER = 2;

export type VisibilityLayerPlayer = "A" | "B" | "BOTH";

export function layerForPlayer(player: VisibilityLayerPlayer): number | null {
  if (player === "A") {
    return PLAYER_A_ONLY_LAYER;
  }
  if (player === "B") {
    return PLAYER_B_ONLY_LAYER;
  }
  return null;
}

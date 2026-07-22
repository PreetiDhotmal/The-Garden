import { AnimationRole } from "@/domain/character/animation/AnimationRole";
import {
  createCharacterAnimationConfig,
  type CharacterAnimationConfig,
} from "@/domain/character/animation/CharacterAnimationConfig";
import type { AnimationClipRegistry } from "@/domain/character/animation/AnimationClipRegistry";
import { CHARACTER_MODEL_ASSET_IDS } from "@/presentation/character/characterModelAssets";

/**
 * ⚠ PROVISIONAL MAPPINGS — NOT VISUALLY VERIFIED.
 *
 * Boy.glb and Girl.glb embed 5 clips each, exported from Blender as
 * raw NLA tracks ("NlaTrack", "NlaTrack.001", ...) with no semantic
 * names. Inspecting the glTF JSON directly (not guessed) showed:
 *
 *   Boy:  NlaTrack=17.08s  .001=15.38s  .002=1.29s  .003=2.25s  .004=2.38s
 *   Girl: NlaTrack=2.38s   .001=1.29s   .002=15.58s .003=2.25s  .004=4.00s
 *
 * Note the clip *order differs between the two models* — Boy's two
 * long (multi-action-looking) clips are first; Girl's are in the
 * middle. A positional/shared mapping would have been silently wrong
 * for one of the two characters. These mappings are a best-effort
 * guess from duration alone:
 *   - The two short clips (~1.3s, ~2.25s) are plausible single-action
 *     one-shots -> mapped to JUMP and LAND.
 *   - The remaining short-ish clip (~2.3-4s) is plausibly a loopable
 *     IDLE.
 *   - The long clip(s) (15-17s) are very likely *not* clean single
 *     loops (most probably multiple actions baked into one NLA
 *     track) -> mapped to WALK/RUN/SPRINT as a functional placeholder
 *     so locomotion isn't silently unanimated, but this is the
 *     highest-risk guess here.
 *   - FALL and TURN_LEFT/TURN_RIGHT have no plausible candidate left
 *     and are intentionally left unmapped — CharacterAnimationController
 *     no-ops gracefully when a role has no mapping (holds last pose)
 *     rather than guessing further.
 *
 * REQUIRED MANUAL TASK: open the Animation Debug Panel (this
 * milestone), scrub through each clip, and correct this mapping.
 */
export function createBoyAnimationConfig(
  clipRegistry: AnimationClipRegistry
): CharacterAnimationConfig {
  return createCharacterAnimationConfig(
    {
      id: "anim-config:boy",
      characterModelAssetId: CHARACTER_MODEL_ASSET_IDS.BOY,
      mappings: [
        { role: AnimationRole.IDLE, clipName: "NlaTrack.004", loop: true },
        { role: AnimationRole.WALK, clipName: "NlaTrack", loop: true },
        { role: AnimationRole.RUN, clipName: "NlaTrack.001", loop: true },
        { role: AnimationRole.SPRINT, clipName: "NlaTrack.001", loop: true },
        { role: AnimationRole.JUMP, clipName: "NlaTrack.002", loop: false },
        { role: AnimationRole.LAND, clipName: "NlaTrack.003", loop: false },
      ],
    },
    clipRegistry
  );
}

export function createGirlAnimationConfig(
  clipRegistry: AnimationClipRegistry
): CharacterAnimationConfig {
  return createCharacterAnimationConfig(
    {
      id: "anim-config:girl",
      characterModelAssetId: CHARACTER_MODEL_ASSET_IDS.GIRL,
      mappings: [
        { role: AnimationRole.IDLE, clipName: "NlaTrack", loop: true },
        { role: AnimationRole.WALK, clipName: "NlaTrack.004", loop: true },
        { role: AnimationRole.RUN, clipName: "NlaTrack.002", loop: true },
        { role: AnimationRole.SPRINT, clipName: "NlaTrack.002", loop: true },
        { role: AnimationRole.JUMP, clipName: "NlaTrack.001", loop: false },
        { role: AnimationRole.LAND, clipName: "NlaTrack.003", loop: false },
      ],
    },
    clipRegistry
  );
}

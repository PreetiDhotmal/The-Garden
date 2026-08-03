import { AnimationRole } from "@/domain/character/animation/AnimationRole";
import {
  createCharacterAnimationConfig,
  type CharacterAnimationConfig,
} from "@/domain/character/animation/CharacterAnimationConfig";
import type { AnimationClipRegistry } from "@/domain/character/animation/AnimationClipRegistry";
import { CHARACTER_MODEL_ASSET_IDS } from "@/presentation/character/characterModelAssets";

/**
 * Boy.glb and Girl.glb embed 5 clips each, exported from Blender as
 * raw NLA tracks ("NlaTrack", "NlaTrack.001", ...) with no semantic
 * names. Inspecting the glTF JSON directly (not guessed) showed:
 *
 *   Boy:  NlaTrack=17.08s  .001=15.38s  .002=1.29s  .003=2.25s  .004=2.38s
 *   Girl: NlaTrack=2.38s   .001=1.29s   .002=15.58s .003=2.25s  .004=4.00s
 *
 * IDLE and WALK were previously mapped by a duration-only guess (the
 * short ~2.3-4s clip assumed IDLE, the long ~15-17s clip assumed
 * WALK) that was explicitly flagged as unverified. Confirmed visually
 * wrong: standing still played the walk cycle and walking played the
 * idle pose - i.e. the guess had it exactly backwards. Swapped the
 * IDLE and WALK clipName values below for both characters; RUN,
 * SPRINT, JUMP, and LAND are unchanged from the original guess.
 *
 * REQUIRED MANUAL TASK: open the Animation Debug Panel and confirm
 * RUN/SPRINT/JUMP/LAND are also visually correct - only IDLE/WALK
 * were confirmed and fixed this pass.
 */
export function createBoyAnimationConfig(
  clipRegistry: AnimationClipRegistry
): CharacterAnimationConfig {
  return createCharacterAnimationConfig(
    {
      id: "anim-config:boy",
      characterModelAssetId: CHARACTER_MODEL_ASSET_IDS.BOY,
      mappings: [
        { role: AnimationRole.IDLE, clipName: "NlaTrack", loop: true },
        { role: AnimationRole.WALK, clipName: "NlaTrack.004", loop: true },
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
        { role: AnimationRole.IDLE, clipName: "NlaTrack.004", loop: true },
        { role: AnimationRole.WALK, clipName: "NlaTrack", loop: true },
        { role: AnimationRole.RUN, clipName: "NlaTrack.002", loop: true },
        { role: AnimationRole.SPRINT, clipName: "NlaTrack.002", loop: true },
        { role: AnimationRole.JUMP, clipName: "NlaTrack.001", loop: false },
        { role: AnimationRole.LAND, clipName: "NlaTrack.003", loop: false },
      ],
    },
    clipRegistry
  );
}

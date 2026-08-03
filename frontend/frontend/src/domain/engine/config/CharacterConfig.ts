import { CharacterType } from "@/domain/character/CharacterType";
import { createMovementTuning, type MovementTuning } from "@/domain/character/movement/MovementTuning";

/**
 * Describes a character's physical/visual shell and movement tuning —
 * the reusable configuration every character (player, NPC, animal,
 * enemy, companion) needs regardless of its behavior. AI, dialogue,
 * quests, and combat remain out of scope; this covers what the engine
 * needs to spawn, move, and animate a capsule-collider character.
 *
 * Extended in Milestone 3 from its Milestone 2 form: the three raw
 * `*AnimationId` strings were replaced by `animationConfigId` (a
 * reference to a validated CharacterAnimationConfig, since clip names
 * are model-specific and unknown at config-authoring time — see
 * domain/character/animation/CharacterAnimationConfig.ts), and the
 * flat walkSpeed/runSpeed fields were replaced by a composed
 * MovementTuning (which also adds sprint, jump, gravity, and slope
 * tuning that Milestone 2 didn't yet need).
 */
export interface CharacterConfig {
  readonly id: string;
  readonly type: CharacterType;
  readonly modelAssetId: string;
  readonly animationConfigId: string;
  readonly capsuleRadius: number;
  readonly capsuleHeight: number;
  readonly movementTuning: MovementTuning;
}

export class InvalidCharacterConfigError extends Error {
  constructor(reason: string) {
    super(`Invalid character config: ${reason}`);
    this.name = "InvalidCharacterConfigError";
  }
}

export interface CreateCharacterConfigInput {
  readonly id: string;
  readonly type?: CharacterType;
  readonly modelAssetId: string;
  readonly animationConfigId: string;
  readonly capsuleRadius?: number;
  readonly capsuleHeight?: number;
  readonly movementTuning?: Partial<MovementTuning>;
}

export function createCharacterConfig(input: CreateCharacterConfigInput): CharacterConfig {
  if (input.id.trim().length === 0) {
    throw new InvalidCharacterConfigError("id must not be empty");
  }
  if (input.modelAssetId.trim().length === 0) {
    throw new InvalidCharacterConfigError("modelAssetId must not be empty");
  }
  if (input.animationConfigId.trim().length === 0) {
    throw new InvalidCharacterConfigError("animationConfigId must not be empty");
  }

  const capsuleRadius = input.capsuleRadius ?? 0.3;
  const capsuleHeight = input.capsuleHeight ?? 1.8;

  if (capsuleRadius <= 0) {
    throw new InvalidCharacterConfigError("capsuleRadius must be greater than zero");
  }
  if (capsuleHeight <= 0) {
    throw new InvalidCharacterConfigError("capsuleHeight must be greater than zero");
  }
  if (capsuleHeight <= capsuleRadius * 2) {
    throw new InvalidCharacterConfigError(
      "capsuleHeight must be greater than the capsule's diameter (2 * capsuleRadius)"
    );
  }

  return {
    id: input.id,
    type: input.type ?? CharacterType.NPC,
    modelAssetId: input.modelAssetId,
    animationConfigId: input.animationConfigId,
    capsuleRadius,
    capsuleHeight,
    movementTuning: createMovementTuning(input.movementTuning),
  };
}

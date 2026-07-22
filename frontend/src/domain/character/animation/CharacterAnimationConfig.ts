import { AnimationRole } from "./AnimationRole";
import type { AnimationClipRegistry } from "./AnimationClipRegistry";

export interface AnimationRoleMapping {
  readonly role: AnimationRole;
  readonly clipName: string;
  readonly loop: boolean;
  readonly crossfadeSeconds: number;
}

export interface CharacterAnimationConfig {
  readonly id: string;
  readonly characterModelAssetId: string;
  readonly mappings: ReadonlyMap<AnimationRole, AnimationRoleMapping>;
}

export class InvalidAnimationConfigError extends Error {
  constructor(reason: string) {
    super(`Invalid character animation config: ${reason}`);
    this.name = "InvalidAnimationConfigError";
  }
}

export interface AnimationRoleMappingInput {
  readonly role: AnimationRole;
  readonly clipName: string;
  readonly loop?: boolean;
  readonly crossfadeSeconds?: number;
}

export interface CreateCharacterAnimationConfigInput {
  readonly id: string;
  readonly characterModelAssetId: string;
  readonly mappings: readonly AnimationRoleMappingInput[];
}

const DEFAULT_CROSSFADE_SECONDS = 0.25;

/** Roles that make sense as continuous loops rather than one-shots, when `loop` isn't specified explicitly. */
const DEFAULT_LOOPING_ROLES: ReadonlySet<AnimationRole> = new Set([
  AnimationRole.IDLE,
  AnimationRole.WALK,
  AnimationRole.RUN,
  AnimationRole.SPRINT,
  AnimationRole.FALL,
]);

/**
 * Builds a validated role -> clip mapping. Every `clipName` referenced
 * must exist on `clipRegistry` (the actual clips discovered on the
 * model) — this is what prevents the animation config from silently
 * referencing a clip that doesn't exist, e.g. after an asset re-export
 * changes clip names.
 */
export function createCharacterAnimationConfig(
  input: CreateCharacterAnimationConfigInput,
  clipRegistry: AnimationClipRegistry
): CharacterAnimationConfig {
  if (input.id.trim().length === 0) {
    throw new InvalidAnimationConfigError("id must not be empty");
  }
  if (input.mappings.length === 0) {
    throw new InvalidAnimationConfigError("at least one role mapping is required");
  }

  const mappings = new Map<AnimationRole, AnimationRoleMapping>();
  for (const mappingInput of input.mappings) {
    if (!clipRegistry.has(mappingInput.clipName)) {
      const availableClips = clipRegistry.listNames().join(", ") || "(none)";
      throw new InvalidAnimationConfigError(
        `role ${mappingInput.role} references clip "${mappingInput.clipName}", which does not ` +
          `exist on model "${input.characterModelAssetId}". Available clips: ${availableClips}`
      );
    }
    if (mappingInput.crossfadeSeconds !== undefined && mappingInput.crossfadeSeconds < 0) {
      throw new InvalidAnimationConfigError("crossfadeSeconds must not be negative");
    }

    mappings.set(mappingInput.role, {
      role: mappingInput.role,
      clipName: mappingInput.clipName,
      loop: mappingInput.loop ?? DEFAULT_LOOPING_ROLES.has(mappingInput.role),
      crossfadeSeconds: mappingInput.crossfadeSeconds ?? DEFAULT_CROSSFADE_SECONDS,
    });
  }

  return { id: input.id, characterModelAssetId: input.characterModelAssetId, mappings };
}

export function getRoleMapping(
  config: CharacterAnimationConfig,
  role: AnimationRole
): AnimationRoleMapping | undefined {
  return config.mappings.get(role);
}

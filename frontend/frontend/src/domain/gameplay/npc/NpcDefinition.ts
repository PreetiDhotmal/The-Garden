export interface NpcDefinition {
  readonly id: string;
  readonly name: string;
  /** World region id this NPC belongs to (see WorldRegion, Milestone 5) — which region streams it in. */
  readonly worldRegionId: string;
  readonly dialogueTreeId: string;
  readonly isQuestGiver: boolean;
  /** Quest ids this NPC can offer, if isQuestGiver. Empty for non-quest-giving NPCs. */
  readonly questIds: readonly string[];
  readonly interactionRadius: number;
  readonly idleAnimationRole: string;
  readonly talkAnimationRole: string;
  /** Optional — not every NPC wanders. */
  readonly walkAnimationRole: string | null;
  readonly spawnPosition: { readonly x: number; readonly y: number; readonly z: number };
  /** If set, the NPC wanders within this radius of spawnPosition when idle; null means stationary. */
  readonly wanderRadius: number | null;
}

export class InvalidNpcDefinitionError extends Error {
  constructor(reason: string) {
    super(`Invalid NPC definition: ${reason}`);
    this.name = "InvalidNpcDefinitionError";
  }
}

export function createNpcDefinition(input: NpcDefinition): NpcDefinition {
  if (input.id.trim().length === 0) {
    throw new InvalidNpcDefinitionError("id must not be empty");
  }
  if (input.interactionRadius <= 0) {
    throw new InvalidNpcDefinitionError("interactionRadius must be greater than zero");
  }
  if (input.isQuestGiver && input.questIds.length === 0) {
    throw new InvalidNpcDefinitionError("a quest-giver NPC must list at least one questId");
  }
  return input;
}

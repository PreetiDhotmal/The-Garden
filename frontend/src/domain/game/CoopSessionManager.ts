import type { GameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";

/**
 * Deliberately NOT imported from the presentation-layer
 * characterSelectionStore (which has its own PlayableCharacterId with
 * the same two string values) — domain code must not depend on
 * presentation code under any circumstances, per this milestone's own
 * "strict separation, no circular dependencies" architecture
 * requirement. The two types are structurally identical by
 * convention, not by import, which is the correct way for a domain
 * concept and its presentation-layer store to agree on a shape
 * without domain reaching upward.
 */
export type CoopCharacterId = "boy" | "girl";

export type CoopPlayerSlot = "PLAYER_ONE" | "PLAYER_TWO";

export interface CoopPlayerMembership {
  readonly slot: CoopPlayerSlot;
  readonly playerId: string;
  readonly characterId: CoopCharacterId;
}

export class SlotAlreadyOccupiedError extends Error {
  constructor(readonly slot: CoopPlayerSlot) {
    super(`Coop slot ${slot} is already occupied — leave() it first before joining again.`);
    this.name = "SlotAlreadyOccupiedError";
  }
}

export class DuplicateCharacterSelectionError extends Error {
  constructor(readonly characterId: CoopCharacterId) {
    super(
      `Character "${characterId}" is already taken by the other player — the GDD requires one Boy, one Girl, never both players on the same character.`
    );
    this.name = "DuplicateCharacterSelectionError";
  }
}

/**
 * Owns "who is in this local co-op session" — nothing more. It
 * deliberately does NOT own progression, objectives, or checkpoints,
 * because none of those are actually per-player in this
 * architecture: QuestRegistry, ObjectiveManager, and
 * GameplayProvider are each already a single shared instance the
 * whole session plays through together (verified true of every
 * system built so far in this milestone — there is no per-player
 * quest/objective state anywhere to "share"). Respawning together is
 * RespawnCoordinator's job (reused, not reimplemented here).
 */
export class CoopSessionManager {
  private readonly membershipBySlot = new Map<CoopPlayerSlot, CoopPlayerMembership>();

  constructor(private readonly eventBus: GameplayEventBus) {}

  join(slot: CoopPlayerSlot, playerId: string, characterId: CoopCharacterId): void {
    if (this.membershipBySlot.has(slot)) {
      throw new SlotAlreadyOccupiedError(slot);
    }
    const existingCharacterOwner = Array.from(this.membershipBySlot.values()).find(
      (membership) => membership.characterId === characterId
    );
    if (existingCharacterOwner) {
      throw new DuplicateCharacterSelectionError(characterId);
    }
    this.membershipBySlot.set(slot, { slot, playerId, characterId });
    this.eventBus.emit("coop:player-joined", { playerId });
  }

  leave(slot: CoopPlayerSlot): void {
    const membership = this.membershipBySlot.get(slot);
    if (!membership) {
      return;
    }
    this.membershipBySlot.delete(slot);
    this.eventBus.emit("coop:player-left", { playerId: membership.playerId });
  }

  getMembership(slot: CoopPlayerSlot): CoopPlayerMembership | null {
    return this.membershipBySlot.get(slot) ?? null;
  }

  /** True once both PLAYER_ONE and PLAYER_TWO slots are occupied — the gate LevelManager/GameManager should check before allowing entry into the Hub or a level, matching the GDD's "a gate only opens once both players are standing at its threshold" principle applied to session start as well. */
  isSessionReady(): boolean {
    return this.membershipBySlot.has("PLAYER_ONE") && this.membershipBySlot.has("PLAYER_TWO");
  }

  listMembers(): readonly CoopPlayerMembership[] {
    return Array.from(this.membershipBySlot.values());
  }

  /** Both players' ids, in slot order — the exact shape RespawnCoordinator.notifyRespawned expects, so the two classes compose directly rather than needing an adapter. */
  getPlayerIdsForRespawn(): readonly [string, string] | null {
    const playerOne = this.getMembership("PLAYER_ONE");
    const playerTwo = this.getMembership("PLAYER_TWO");
    if (!playerOne || !playerTwo) {
      return null;
    }
    return [playerOne.playerId, playerTwo.playerId];
  }
}

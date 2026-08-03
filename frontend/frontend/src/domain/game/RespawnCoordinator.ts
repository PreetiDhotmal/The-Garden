import type { CharacterSpawnPoint } from "@/domain/character/CharacterSpawnPoint";
import type { GameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import type { CheckpointManager } from "@/domain/world/checkpoint/CheckpointManager";
import type { SpawnManager } from "@/domain/world/spawn/SpawnManager";

/**
 * Bridges CheckpointManager (tracks which checkpoint ids have been
 * reached, already built and unchanged here) and SpawnManager
 * (resolves a checkpoint id to an actual position, already built and
 * unchanged here) into the one thing neither of them does on its
 * own: answering "where should the co-op pair respawn right now."
 *
 * Both players always respawn at the SAME point — there is
 * deliberately no per-player respawn resolution, since the GDD's
 * "shared checkpoints, respawn together" requirement means a co-op
 * failure state should never let the pair end up geographically
 * separated by a respawn, which would undercut every mechanic's
 * "impossible to solve alone" property immediately after the failure
 * it's meant to recover from.
 */
export class RespawnCoordinator {
  constructor(
    private readonly checkpointManager: CheckpointManager,
    private readonly spawnManager: SpawnManager,
    private readonly eventBus: GameplayEventBus
  ) {}

  /** The checkpoint the pair would currently respawn at — the most recently reached one, or the level's default spawn point if none has been reached yet this attempt. */
  resolveRespawnPoint(): CharacterSpawnPoint {
    const mostRecentCheckpointId = this.checkpointManager.getMostRecentCheckpointId();
    return this.spawnManager.resolveSpawnPoint(mostRecentCheckpointId);
  }

  /**
   * Call once both players' positions have actually been moved to
   * the resolved respawn point (a presentation-layer action this
   * class does not perform itself, matching CharacterEntity's
   * existing setPosition-is-the-caller's-job convention) — emits
   * player:respawned once for each of the two co-op player ids, since
   * both physically respawn together but remain two distinct
   * entities for animation/physics purposes.
   */
  notifyRespawned(playerIds: readonly [string, string]): void {
    const checkpointId = this.checkpointManager.getMostRecentCheckpointId() ?? "default";
    for (const playerId of playerIds) {
      this.eventBus.emit("player:respawned", { playerId, checkpointId });
    }
  }
}

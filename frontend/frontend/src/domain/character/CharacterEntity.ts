import type { CharacterConfig } from "@/domain/engine/config/CharacterConfig";
import { CharacterState } from "./CharacterState";
import { type CharacterStats } from "./CharacterStats";
import type { Vector3Tuple } from "./CharacterSpawnPoint";

export interface Velocity3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

const ZERO_VELOCITY: Velocity3 = { x: 0, y: 0, z: 0 };

/**
 * The runtime character aggregate — one instance per spawned
 * character (player, NPC, animal, enemy, or companion). Combines an
 * immutable CharacterConfig (the template: model, tuning, animation
 * mapping) with mutable runtime state (transform, velocity, stats,
 * locomotion state). Framework-free: no Three.js Object3D, no Rapier
 * RigidBody — those are owned by the presentation-layer component
 * that renders this entity, which reads from and writes to it via
 * these methods each frame.
 */
export class CharacterEntity {
  private position: Vector3Tuple;
  private yaw: number;
  private velocity: Velocity3 = ZERO_VELOCITY;
  private locomotionState: CharacterState = CharacterState.IDLE;
  private stats: CharacterStats;

  constructor(
    readonly instanceId: string,
    readonly config: CharacterConfig,
    initialPosition: Vector3Tuple,
    initialYaw: number,
    initialStats: CharacterStats
  ) {
    this.position = initialPosition;
    this.yaw = initialYaw;
    this.stats = initialStats;
  }

  getPosition(): Vector3Tuple {
    return this.position;
  }

  setPosition(position: Vector3Tuple): void {
    this.position = position;
  }

  getYaw(): number {
    return this.yaw;
  }

  setYaw(yaw: number): void {
    this.yaw = yaw;
  }

  getVelocity(): Velocity3 {
    return this.velocity;
  }

  setVelocity(velocity: Velocity3): void {
    this.velocity = velocity;
  }

  getLocomotionState(): CharacterState {
    return this.locomotionState;
  }

  setLocomotionState(state: CharacterState): void {
    this.locomotionState = state;
  }

  getStats(): CharacterStats {
    return this.stats;
  }

  setStats(stats: CharacterStats): void {
    this.stats = stats;
  }

  isAlive(): boolean {
    return this.stats.currentHealth > 0;
  }
}

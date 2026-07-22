/**
 * Classifies what a character is for, not what it looks like. The
 * same CharacterEntity/CharacterFactory pipeline spawns all of these —
 * only the CharacterConfig (model, stats, tuning) differs per
 * instance. Gameplay behavior (AI, dialogue, combat) for NPC/ANIMAL/
 * ENEMY types is out of scope for this milestone; this enum exists so
 * the character system doesn't have to be redesigned when that
 * behavior is added later.
 */
export enum CharacterType {
  PLAYER = "PLAYER",
  NPC = "NPC",
  ANIMAL = "ANIMAL",
  ENEMY = "ENEMY",
  COMPANION = "COMPANION",
}

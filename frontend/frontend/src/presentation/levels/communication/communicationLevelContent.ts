import { createSpawnPoint } from "@/domain/character/CharacterSpawnPoint";
import { createBoundingBox } from "@/domain/world/region/BoundingBox";
import { createWorldRegion } from "@/domain/world/region/WorldRegion";
import { createQuestObjective } from "@/domain/gameplay/quest/QuestObjective";
import { QuestObjectiveType } from "@/domain/gameplay/quest/QuestObjectiveType";
import type { PuzzleStage } from "@/domain/game/puzzle/PuzzleStage";
import type { WorldManager } from "@/infrastructure/world/WorldManager";

export const COMMUNICATION_LEVEL_ID = "chapter:communication";
export const COMMUNICATION_REGION_ID = "region:communication";

export const WORLD_WIDTH = 90;
export const WORLD_DEPTH = 220;

/** Player A's viewing point — has sightline to the symbol totems, no sightline to Player B's switches (blocked by SIGHT_WALL). */
export const PLAYER_A_SPAWN = { x: -6, y: 0, z: 20 };
/** Player B's viewing point — has sightline to the switches, no sightline to the symbol totems. */
export const PLAYER_B_SPAWN = { x: 6, y: 0, z: 20 };

export const SYMBOL_TOTEM_POSITIONS: readonly (readonly [number, number, number])[] = [
  [-8, 1.2, 4],
  [-6, 1.2, 3],
  [-4, 1.2, 4],
];
export const SWITCH_POSITIONS: readonly (readonly [number, number, number])[] = [
  [4, 1, 4],
  [6, 1, 3],
  [8, 1, 4],
];
export const SIGHT_WALL_POSITION: readonly [number, number, number] = [0, 2, 3.5];

/** The three symbol shapes every stage that needs a symbol vocabulary shares — deliberately just 3 primitive geometries (no new asset pipeline) so a switch and a totem can be verified as "matching" by comparing this enum, nothing more elaborate. */
export enum PuzzleSymbol {
  SPHERE = "SPHERE",
  BOX = "BOX",
  CONE = "CONE",
}
export const ALL_SYMBOLS: readonly PuzzleSymbol[] = [
  PuzzleSymbol.SPHERE,
  PuzzleSymbol.BOX,
  PuzzleSymbol.CONE,
];

const OBJECTIVE_SWITCH_1_ID = "objective:communication:switch-1";
const OBJECTIVE_SWITCH_2_ID = "objective:communication:switch-2";
const OBJECTIVE_SWITCH_3_ID = "objective:communication:switch-3";
export const SWITCH_OBJECTIVE_IDS: readonly string[] = [
  OBJECTIVE_SWITCH_1_ID,
  OBJECTIVE_SWITCH_2_ID,
  OBJECTIVE_SWITCH_3_ID,
];

/**
 * Deterministic shuffle from a numeric seed — both players' cameras
 * need to agree on what "correct" means for a given attempt, and a
 * fresh seed is supplied per attempt by the caller (not baked in as
 * one constant), so a reset (recordMissedAttempt) or a replay gets a
 * genuinely different arrangement rather than a memorizable one.
 */
export function shuffleSymbolOrder(seed: number): readonly PuzzleSymbol[] {
  const symbols = [...ALL_SYMBOLS];
  let currentSeed = seed;
  for (let i = symbols.length - 1; i > 0; i -= 1) {
    currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
    const j = currentSeed % (i + 1);
    const temp = symbols[i];
    const swapTarget = symbols[j];
    if (temp !== undefined && swapTarget !== undefined) {
      symbols[i] = swapTarget;
      symbols[j] = temp;
    }
  }
  return symbols;
}

export function buildPuzzleOneStage(targetOrder: readonly PuzzleSymbol[]): PuzzleStage {
  return {
    stageId: "stage:communication:symbols-and-switches",
    description: "Set the three switches to match the symbols Player A can see.",
    checkpointId: "checkpoint:communication:puzzle-one",
    createObjectives: () => [
      createQuestObjective({
        id: OBJECTIVE_SWITCH_1_ID,
        description: `Switch 1 -> ${targetOrder[0] ?? PuzzleSymbol.SPHERE}`,
        objectiveType: QuestObjectiveType.USE_OBJECT,
      }),
      createQuestObjective({
        id: OBJECTIVE_SWITCH_2_ID,
        description: `Switch 2 -> ${targetOrder[1] ?? PuzzleSymbol.BOX}`,
        objectiveType: QuestObjectiveType.USE_OBJECT,
      }),
      createQuestObjective({
        id: OBJECTIVE_SWITCH_3_ID,
        description: `Switch 3 -> ${targetOrder[2] ?? PuzzleSymbol.CONE}`,
        objectiveType: QuestObjectiveType.USE_OBJECT,
      }),
    ],
  };
}

/**
 * Puzzle 2 geometry — the exact x/z coordinates verified solvable by
 * LightBeamSimulator.test.ts's dedicated test before any of this 3D
 * content was written. Y=2 is the fixed beam height (roughly chest
 * height, above the mirrors' post bases); the greenhouse sits further
 * into the level (z around -40) than Puzzle 1's aqueduct area
 * (z around 0-20), so players physically walk from one to the other.
 */
export const PUZZLE_TWO_BEAM_HEIGHT = 2;
export const PUZZLE_TWO_LIGHT_SOURCE = {
  position: [-10, PUZZLE_TWO_BEAM_HEIGHT, -40] as readonly [number, number, number],
  direction: { x: 1, z: 0 },
};
export const PUZZLE_TWO_MIRROR_IDS: readonly string[] = [
  "interactable:communication:mirror-1",
  "interactable:communication:mirror-2",
];
export const PUZZLE_TWO_MIRROR_POSITIONS: readonly (readonly [number, number, number])[] = [
  [-2, PUZZLE_TWO_BEAM_HEIGHT, -40],
  [-2, PUZZLE_TWO_BEAM_HEIGHT, -34],
];
export const PUZZLE_TWO_TARGET: readonly [number, number, number] = [
  6,
  PUZZLE_TWO_BEAM_HEIGHT,
  -34,
];
/** Separates Player A's mirror room from Player B's crystal-viewing room — "Player A cannot see the crystal" (Part 3) enforced physically, matching Puzzle 1's SightBlockingWall pattern exactly. */
export const PUZZLE_TWO_SIGHT_WALL_POSITION: readonly [number, number, number] = [2, 2, -37];
export const PUZZLE_TWO_PLAYER_A_SPAWN = { x: -10, y: 0, z: -46 };
export const PUZZLE_TWO_PLAYER_B_SPAWN = { x: 6, y: 0, z: -28 };

const PUZZLE_TWO_OBJECTIVE_ID_VALUE = "objective:communication:crystal-activated";
export const PUZZLE_TWO_OBJECTIVE_ID = PUZZLE_TWO_OBJECTIVE_ID_VALUE;

export function buildPuzzleTwoStage(): PuzzleStage {
  return {
    stageId: "stage:communication:mirror-and-light",
    description: "Rotate the mirrors so the beam reaches the crystal.",
    checkpointId: "checkpoint:communication:puzzle-two",
    createObjectives: () => [
      createQuestObjective({
        id: PUZZLE_TWO_OBJECTIVE_ID_VALUE,
        description: "Guide the light to the crystal",
        objectiveType: QuestObjectiveType.USE_OBJECT,
      }),
    ],
  };
}

/**
 * Puzzle 3 geometry — further along the level than the greenhouse
 * (z around -70), so players physically walk from Puzzle 2's area to
 * this one. Player A's tablet shows the first two digits of a
 * 4-digit code; Player B's tablet shows the last two; only Player B
 * can reach the digit posts that actually enter the combined code.
 */
export const PUZZLE_THREE_PLAYER_A_TABLET_POSITION: readonly [number, number, number] = [
  -8, 1.4, -70,
];
export const PUZZLE_THREE_PLAYER_B_TABLET_POSITION: readonly [number, number, number] = [
  8, 1.4, -70,
];
export const PUZZLE_THREE_DIGIT_POST_POSITIONS: readonly (readonly [number, number, number])[] = [
  [4, 1, -74],
  [6, 1, -74],
  [8, 1, -74],
  [10, 1, -74],
];
export const PUZZLE_THREE_SIGHT_WALL_POSITION: readonly [number, number, number] = [0, 2, -70];
export const PUZZLE_THREE_COMMIT_LEVER_POSITION: readonly [number, number, number] = [7, 1, -78];
export const PUZZLE_THREE_PLAYER_A_SPAWN = { x: -8, y: 0, z: -66 };
export const PUZZLE_THREE_PLAYER_B_SPAWN = { x: 7, y: 0, z: -66 };

const PUZZLE_THREE_OBJECTIVE_ID_VALUE = "objective:communication:code-entered";
export const PUZZLE_THREE_OBJECTIVE_ID = PUZZLE_THREE_OBJECTIVE_ID_VALUE;

/**
 * Same seeded-shuffle honesty as shuffleSymbolOrder — a fresh seed
 * per attempt (supplied by the caller) means a reset or replay gets a
 * genuinely different code, not a memorizable one, while both split-
 * screen viewports still agree on what "correct" means for a given
 * attempt.
 */
export function generateSplitCode(seed: number): readonly number[] {
  let currentSeed = seed;
  const digits: number[] = [];
  for (let i = 0; i < 4; i += 1) {
    currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
    digits.push(currentSeed % 10);
  }
  return digits;
}

export function buildPuzzleThreeStage(): PuzzleStage {
  return {
    stageId: "stage:communication:split-information",
    description: "Enter the four-digit code — half known to each of you.",
    checkpointId: "checkpoint:communication:puzzle-three",
    createObjectives: () => [
      createQuestObjective({
        id: PUZZLE_THREE_OBJECTIVE_ID_VALUE,
        description: "Enter the shared code",
        objectiveType: QuestObjectiveType.USE_OBJECT,
      }),
    ],
  };
}

/**
 * Final Puzzle geometry — one combined mechanism drawing on all three
 * prior puzzles at once (a symbol-matched switch, a mirror-redirected
 * beam, a 2-digit split code), further along the level (z around
 * -100) than Puzzle 3. Genuinely timed, using ObjectiveManager's
 * timeLimitSeconds — built in the framework milestone but never
 * actually exercised by any level content until this puzzle.
 */
export const FINAL_PUZZLE_SWITCH_POSITION: readonly [number, number, number] = [4, 1, -96];
export const FINAL_PUZZLE_SYMBOL_TOTEM_POSITION: readonly [number, number, number] = [
  -8, 1.2, -96,
];
export const FINAL_PUZZLE_MIRROR_POSITION: readonly [number, number, number] = [8, 2, -100];
export const FINAL_PUZZLE_LIGHT_SOURCE = {
  position: [2, 2, -100] as readonly [number, number, number],
  direction: { x: 1, z: 0 },
};
export const FINAL_PUZZLE_TARGET: readonly [number, number, number] = [8, 2, -94];
export const FINAL_PUZZLE_TABLET_A_POSITION: readonly [number, number, number] = [-8, 1.4, -100];
export const FINAL_PUZZLE_DIGIT_POST_POSITIONS: readonly (readonly [number, number, number])[] = [
  [4, 1, -104],
  [6, 1, -104],
];
export const FINAL_PUZZLE_COMMIT_LEVER_POSITION: readonly [number, number, number] = [5, 1, -106];
/** Separates Player A's info-only area (totem+tablet, x=-8) from Player B's entire action area (switch/mirror/crystal/digits/lever, x=2 to x=8) — keeping the whole beam mechanism on B's side avoids the beam ever crossing this dividing line. */
export const FINAL_PUZZLE_SIGHT_WALL_POSITION: readonly [number, number, number] = [-2, 2, -100];
export const FINAL_PUZZLE_PLAYER_A_SPAWN = { x: -8, y: 0, z: -90 };
export const FINAL_PUZZLE_PLAYER_B_SPAWN = { x: 6, y: 0, z: -90 };

const FINAL_PUZZLE_OBJECTIVE_ID_VALUE = "objective:communication:final-combined";
export const FINAL_PUZZLE_OBJECTIVE_ID = FINAL_PUZZLE_OBJECTIVE_ID_VALUE;
export const FINAL_PUZZLE_TIME_LIMIT_SECONDS = 90;

export function buildFinalStage(): PuzzleStage {
  return {
    stageId: "stage:communication:final",
    description: "Combine everything — symbol, light, and code — before time runs out.",
    checkpointId: "checkpoint:communication:final",
    createObjectives: () => [
      createQuestObjective({
        id: FINAL_PUZZLE_OBJECTIVE_ID_VALUE,
        description: "Solve the combined mechanism together",
        objectiveType: QuestObjectiveType.USE_OBJECT,
        timeLimitSeconds: FINAL_PUZZLE_TIME_LIMIT_SECONDS,
      }),
    ],
  };
}

export function setupCommunicationLevel(
  worldManager: WorldManager,
  groundHeightAt: (x: number, z: number) => number
): void {
  if (
    !worldManager.regionRegistry.list().some((region) => region.id === COMMUNICATION_REGION_ID)
  ) {
    worldManager.regionRegistry.register(
      createWorldRegion({
        id: COMMUNICATION_REGION_ID,
        name: "Communication",
        bounds: createBoundingBox({ x: 0, y: 0, z: 0 }, { x: 50, y: 20, z: 50 }),
        streamingPriority: 10,
      })
    );
  }
  if (worldManager.spawnManager.list().length === 0) {
    const heightA = groundHeightAt(PLAYER_A_SPAWN.x, PLAYER_A_SPAWN.z);
    const heightB = groundHeightAt(PLAYER_B_SPAWN.x, PLAYER_B_SPAWN.z);
    worldManager.spawnManager.register(
      createSpawnPoint({
        id: "spawn:communication-a",
        position: { x: PLAYER_A_SPAWN.x, y: heightA + 1, z: PLAYER_A_SPAWN.z },
      }),
      true
    );
    worldManager.spawnManager.register(
      createSpawnPoint({
        id: "spawn:communication-b",
        position: { x: PLAYER_B_SPAWN.x, y: heightB + 1, z: PLAYER_B_SPAWN.z },
      })
    );

    // Puzzle 1's checkpoint resumes players at Puzzle 2's entrance —
    // Continue after Puzzle 1 should not re-spawn back at the level's
    // very start. CheckpointManager treats a checkpoint id as a spawn
    // point id directly (Milestone 1's established convention), so
    // this checkpoint id needs its own real spawn point registered —
    // one per player, since the two rooms have separate entrances.
    const heightPuzzleTwoA = groundHeightAt(
      PUZZLE_TWO_PLAYER_A_SPAWN.x,
      PUZZLE_TWO_PLAYER_A_SPAWN.z
    );
    const heightPuzzleTwoB = groundHeightAt(
      PUZZLE_TWO_PLAYER_B_SPAWN.x,
      PUZZLE_TWO_PLAYER_B_SPAWN.z
    );
    worldManager.spawnManager.register(
      createSpawnPoint({
        id: "checkpoint:communication:puzzle-one:a",
        position: {
          x: PUZZLE_TWO_PLAYER_A_SPAWN.x,
          y: heightPuzzleTwoA + 1,
          z: PUZZLE_TWO_PLAYER_A_SPAWN.z,
        },
      })
    );
    worldManager.spawnManager.register(
      createSpawnPoint({
        id: "checkpoint:communication:puzzle-one:b",
        position: {
          x: PUZZLE_TWO_PLAYER_B_SPAWN.x,
          y: heightPuzzleTwoB + 1,
          z: PUZZLE_TWO_PLAYER_B_SPAWN.z,
        },
      })
    );

    const heightPuzzleThreeA = groundHeightAt(
      PUZZLE_THREE_PLAYER_A_SPAWN.x,
      PUZZLE_THREE_PLAYER_A_SPAWN.z
    );
    const heightPuzzleThreeB = groundHeightAt(
      PUZZLE_THREE_PLAYER_B_SPAWN.x,
      PUZZLE_THREE_PLAYER_B_SPAWN.z
    );
    worldManager.spawnManager.register(
      createSpawnPoint({
        id: "checkpoint:communication:puzzle-two:a",
        position: {
          x: PUZZLE_THREE_PLAYER_A_SPAWN.x,
          y: heightPuzzleThreeA + 1,
          z: PUZZLE_THREE_PLAYER_A_SPAWN.z,
        },
      })
    );
    worldManager.spawnManager.register(
      createSpawnPoint({
        id: "checkpoint:communication:puzzle-two:b",
        position: {
          x: PUZZLE_THREE_PLAYER_B_SPAWN.x,
          y: heightPuzzleThreeB + 1,
          z: PUZZLE_THREE_PLAYER_B_SPAWN.z,
        },
      })
    );

    const heightFinalA = groundHeightAt(FINAL_PUZZLE_PLAYER_A_SPAWN.x, FINAL_PUZZLE_PLAYER_A_SPAWN.z);
    const heightFinalB = groundHeightAt(FINAL_PUZZLE_PLAYER_B_SPAWN.x, FINAL_PUZZLE_PLAYER_B_SPAWN.z);
    worldManager.spawnManager.register(
      createSpawnPoint({
        id: "checkpoint:communication:puzzle-three:a",
        position: {
          x: FINAL_PUZZLE_PLAYER_A_SPAWN.x,
          y: heightFinalA + 1,
          z: FINAL_PUZZLE_PLAYER_A_SPAWN.z,
        },
      })
    );
    worldManager.spawnManager.register(
      createSpawnPoint({
        id: "checkpoint:communication:puzzle-three:b",
        position: {
          x: FINAL_PUZZLE_PLAYER_B_SPAWN.x,
          y: heightFinalB + 1,
          z: FINAL_PUZZLE_PLAYER_B_SPAWN.z,
        },
      })
    );
  }
}

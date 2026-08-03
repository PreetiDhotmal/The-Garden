import { createSpawnPoint } from "@/domain/character/CharacterSpawnPoint";
import { createBoundingBox } from "@/domain/world/region/BoundingBox";
import { createWorldRegion } from "@/domain/world/region/WorldRegion";
import { createQuestObjective } from "@/domain/gameplay/quest/QuestObjective";
import { QuestObjectiveType } from "@/domain/gameplay/quest/QuestObjectiveType";
import type { PuzzleStage } from "@/domain/game/puzzle/PuzzleStage";
import type { WorldManager } from "@/infrastructure/world/WorldManager";

export const TRUST_LEVEL_ID = "chapter:trust";
export const TRUST_REGION_ID = "region:trust";

export const WORLD_WIDTH = 100;
export const WORLD_DEPTH = 320;

export const PLAYER_A_SPAWN = { x: -4, y: 0, z: 20 };
export const PLAYER_B_SPAWN = { x: 4, y: 0, z: 20 };
/** Checkpoint spawn once Puzzle 1 is complete — positioned clear of Puzzle 1's goal platform footprint (z=-11 to -17) and just short of Puzzle 2's start ledge (z=-18), resuming here rather than at the level's very start, matching Communication's established per-player checkpoint-spawn pattern. */
export const CHECKPOINT_AFTER_HIDDEN_BRIDGE_A_SPAWN = { x: -4, y: 0, z: -19 };
export const CHECKPOINT_AFTER_HIDDEN_BRIDGE_B_SPAWN = { x: 4, y: 0, z: -19 };
/** Checkpoint spawn once Puzzle 2 (Invisible Platforms) is complete, positioned just short of Puzzle 3's lever/lift area (z=-54). */
export const CHECKPOINT_AFTER_INVISIBLE_PLATFORMS_A_SPAWN = { x: -4, y: 0, z: -49 };
export const CHECKPOINT_AFTER_INVISIBLE_PLATFORMS_B_SPAWN = { x: 4, y: 0, z: -49 };
/** Checkpoint spawn once Puzzle 3 (Faith Lift) is complete, positioned just short of Puzzle 4's wind zone (z=-60 to -76). */
export const CHECKPOINT_AFTER_FAITH_LIFT_A_SPAWN = { x: -3, y: 0, z: -57 };
export const CHECKPOINT_AFTER_FAITH_LIFT_B_SPAWN = { x: 3, y: 0, z: -57 };
/** Checkpoint spawn once Puzzle 4 (Wind Crossing) is complete, positioned just short of the Final Puzzle's plate area (z=-86). */
export const CHECKPOINT_AFTER_WIND_CROSSING_A_SPAWN = { x: -6, y: 0, z: -82 };
export const CHECKPOINT_AFTER_WIND_CROSSING_B_SPAWN = { x: 6, y: 0, z: -82 };

/**
 * Puzzle 1's "chasm" — the goal platform is physically separate from
 * the main terrain (its own standalone collider, no connecting
 * ground), not a literal hole cut into the procedural heightmap.
 * Simpler to build and verify correct, and matches this milestone's
 * explicit "greybox first, do not spend time polishing graphics."
 */
export const PUZZLE_ONE_PLATE_POSITION: readonly [number, number, number] = [-9, 0.5, 4];
export const PUZZLE_ONE_BRIDGE_START_Z = 0;
export const PUZZLE_ONE_BRIDGE_LENGTH = 10;
/** Modest step-up (reached via a short ramp, not a jump) rather than a dramatic height — this project's default jump comfortably clears small ledges, so the ramp is what actually makes "unreachable without the bridge" true: there is no ground connecting the near ledge to the goal platform at all, only open space the bridge spans. */
export const PUZZLE_ONE_BRIDGE_HEIGHT = 1.1;
/** Rises from ground level (z=5) to the bridge's near edge (z=0) — length 5, height 1.1, positioned/rotated to connect the two exactly. */
export const PUZZLE_ONE_RAMP_LENGTH = 5;
export const PUZZLE_ONE_RAMP_POSITION: readonly [number, number, number] = [
  -4,
  PUZZLE_ONE_BRIDGE_HEIGHT / 2,
  PUZZLE_ONE_BRIDGE_START_Z + PUZZLE_ONE_RAMP_LENGTH / 2,
];
export const PUZZLE_ONE_RAMP_ROTATION_X = Math.atan2(
  PUZZLE_ONE_BRIDGE_HEIGHT,
  PUZZLE_ONE_RAMP_LENGTH
);
export const PUZZLE_ONE_BRIDGE_POSITION: readonly [number, number, number] = [
  0,
  PUZZLE_ONE_BRIDGE_HEIGHT,
  PUZZLE_ONE_BRIDGE_START_Z - PUZZLE_ONE_BRIDGE_LENGTH / 2,
];
export const PUZZLE_ONE_GOAL_PLATFORM_POSITION: readonly [number, number, number] = [
  0,
  PUZZLE_ONE_BRIDGE_HEIGHT - 0.5,
  PUZZLE_ONE_BRIDGE_START_Z - PUZZLE_ONE_BRIDGE_LENGTH - 4,
];
export const PUZZLE_ONE_GOAL_POSITION: readonly [number, number, number] =
  PUZZLE_ONE_GOAL_PLATFORM_POSITION;

const OBJECTIVE_HIDDEN_BRIDGE_ID = "objective:trust:hidden-bridge-crossed";
export const OBJECTIVE_HIDDEN_BRIDGE = OBJECTIVE_HIDDEN_BRIDGE_ID;

export function buildHiddenBridgeStage(): PuzzleStage {
  return {
    stageId: "stage:trust:hidden-bridge",
    description: "Player A: stand on the plate. Player B: trust the bridge is there.",
    checkpointId: "checkpoint:trust:hidden-bridge",
    createObjectives: () => [
      createQuestObjective({
        id: OBJECTIVE_HIDDEN_BRIDGE_ID,
        description: "Cross the hidden bridge together",
        objectiveType: QuestObjectiveType.REACH_LOCATION,
      }),
    ],
  };
}

/**
 * Puzzle 2's stepping stones deliberately zigzag rather than form a
 * straight line — a straight line could plausibly be crossed by luck
 * or by hugging one edge; a genuine zigzag requires Player A to
 * actually communicate each step, matching "Player B must walk
 * exactly where Player A guides."  Consecutive platforms are 4-6
 * units apart in Z and up to 5 units apart in X, deliberately wider
 * than anything reachable by an uninformed guess.
 */
export const PUZZLE_TWO_PLATFORM_HEIGHT = 1.1;
export const PUZZLE_TWO_PLATFORM_POSITIONS: readonly (readonly [number, number, number])[] = [
  [-3, PUZZLE_TWO_PLATFORM_HEIGHT, -22],
  [2, PUZZLE_TWO_PLATFORM_HEIGHT, -26],
  [-2, PUZZLE_TWO_PLATFORM_HEIGHT, -30],
  [3, PUZZLE_TWO_PLATFORM_HEIGHT, -34],
  [-3, PUZZLE_TWO_PLATFORM_HEIGHT, -38],
  [0, PUZZLE_TWO_PLATFORM_HEIGHT, -42],
];
export const PUZZLE_TWO_START_LEDGE_POSITION: readonly [number, number, number] = [
  0,
  PUZZLE_TWO_PLATFORM_HEIGHT - 0.5,
  -18,
];
/** Closes a gap noted in the previous commit: nothing previously connected ground level to Puzzle 2's first platform height. Same short-ramp approach as Puzzle 1's. */
export const PUZZLE_TWO_RAMP_LENGTH = 4;
export const PUZZLE_TWO_RAMP_POSITION: readonly [number, number, number] = [0, PUZZLE_TWO_PLATFORM_HEIGHT / 2, -16];
export const PUZZLE_TWO_RAMP_ROTATION_X = Math.atan2(
  PUZZLE_TWO_PLATFORM_HEIGHT,
  PUZZLE_TWO_RAMP_LENGTH
);
export const PUZZLE_TWO_GOAL_PLATFORM_POSITION: readonly [number, number, number] = [
  0,
  PUZZLE_TWO_PLATFORM_HEIGHT - 0.5,
  -46,
];
export const PUZZLE_TWO_GOAL_POSITION = PUZZLE_TWO_GOAL_PLATFORM_POSITION;
export const PUZZLE_TWO_PLAYER_B_RESPAWN_POSITION: readonly [number, number, number] = [
  0,
  PUZZLE_TWO_PLATFORM_HEIGHT + 1,
  -18,
];
/** Falling below this Y means Player B missed every platform and dropped into the gap — trigger a safe, punishment-free respawn rather than letting them fall indefinitely. */
export const PUZZLE_TWO_FALL_Y_THRESHOLD = -8;

const OBJECTIVE_INVISIBLE_PLATFORMS_ID = "objective:trust:invisible-platforms-crossed";
export const OBJECTIVE_INVISIBLE_PLATFORMS = OBJECTIVE_INVISIBLE_PLATFORMS_ID;

export function buildInvisiblePlatformsStage(): PuzzleStage {
  return {
    stageId: "stage:trust:invisible-platforms",
    description: "Player A: guide Player B across, one step at a time.",
    checkpointId: "checkpoint:trust:invisible-platforms",
    createObjectives: () => [
      createQuestObjective({
        id: OBJECTIVE_INVISIBLE_PLATFORMS_ID,
        description: "Cross the invisible platforms together",
        objectiveType: QuestObjectiveType.REACH_LOCATION,
      }),
    ],
  };
}

/**
 * Puzzle 3 (Faith Lift). "Player B cannot see whether the lift is
 * safe" — the lift mechanism itself is visible to Player A only.
 * "Player A cannot see where the lift goes" — the destination
 * platform is visible to Player B only. Genuine mutual asymmetry,
 * both halves reusing VisibleToPlayer. The lift's upward motion is a
 * visual animation (the mesh itself lerps position over time) paired
 * with a real teleport of Player B's character to the destination
 * once the animation completes — chosen deliberately over literal
 * kinematic-rigid-body platform-riding physics, which this project has
 * no prior working example of and which I cannot verify carries a
 * standing character correctly without a live browser to test against.
 */
export const PUZZLE_THREE_LEVER_POSITION: readonly [number, number, number] = [-4, 1, -54];
export const PUZZLE_THREE_LIFT_BASE_POSITION: readonly [number, number, number] = [4, 0.3, -54];
export const PUZZLE_THREE_LIFT_TOP_Y = 4;
export const PUZZLE_THREE_LIFT_TRAVEL_SECONDS = 3.5;
export const PUZZLE_THREE_DESTINATION_POSITION: readonly [number, number, number] = [
  4,
  PUZZLE_THREE_LIFT_TOP_Y - 0.3,
  -54,
];
/**
 * Closes an honest gap flagged in the previous commit: nothing
 * previously connected the lift's destination platform back to
 * ground level, so a player completing Puzzle 3 during ordinary play
 * (not via checkpoint resume, which correctly places players at
 * ground level regardless) could have been stranded. A short
 * staircase — 4 steps, each ~1 unit down and ~1.5 units toward
 * Puzzle 4's zone — descends from the destination platform toward
 * ground level near Puzzle 4's spawn area.
 */
export const PUZZLE_THREE_STAIRCASE_STEP_COUNT = 4;
export function getPuzzleThreeStaircaseStepPosition(
  stepIndex: number
): readonly [number, number, number] {
  const stepHeight = (PUZZLE_THREE_LIFT_TOP_Y - 0.3) / PUZZLE_THREE_STAIRCASE_STEP_COUNT;
  const stepDepth = 1.5;
  return [
    4,
    PUZZLE_THREE_LIFT_TOP_Y - 0.3 - stepHeight * (stepIndex + 1),
    -54 - stepDepth * (stepIndex + 1),
  ];
}
export const PUZZLE_THREE_PLAYER_B_READY_RADIUS = 2;
export const PUZZLE_THREE_GOAL_POSITION = PUZZLE_THREE_DESTINATION_POSITION;
export const PUZZLE_THREE_GOAL_RADIUS = 2.5;
export const PUZZLE_THREE_PLAYER_A_SPAWN = { x: -4, y: 0, z: -50 };
export const PUZZLE_THREE_PLAYER_B_SPAWN = { x: 4, y: 0, z: -50 };

const OBJECTIVE_FAITH_LIFT_ID = "objective:trust:faith-lift-ridden";
export const OBJECTIVE_FAITH_LIFT = OBJECTIVE_FAITH_LIFT_ID;

export function buildFaithLiftStage(): PuzzleStage {
  return {
    stageId: "stage:trust:faith-lift",
    description: "Player A: activate the lift once Player B is ready. Player B: trust the timing.",
    checkpointId: "checkpoint:trust:faith-lift",
    createObjectives: () => [
      createQuestObjective({
        id: OBJECTIVE_FAITH_LIFT_ID,
        description: "Ride the lift to the overlook together",
        objectiveType: QuestObjectiveType.REACH_LOCATION,
      }),
    ],
  };
}

/**
 * Puzzle 4 (Wind Crossing). "Only by walking together can they resist
 * it... cooperation directly affects physics" — wind strength scales
 * continuously with the distance between the two players (computed
 * fresh every frame in WindCrossingPuzzle), not a binary
 * together/apart flag, so the crossing genuinely rewards staying
 * close the whole way rather than only checking position at the end.
 */
export const PUZZLE_FOUR_ZONE_START_Z = -60;
export const PUZZLE_FOUR_ZONE_END_Z = -76;
export const PUZZLE_FOUR_ZONE_WIDTH = 10;
export const PUZZLE_FOUR_TOGETHER_DISTANCE = 4;
export const PUZZLE_FOUR_MAX_WIND_SPEED = 6;
export const PUZZLE_FOUR_PLAYER_A_SPAWN = { x: -3, y: 0, z: -56 };
export const PUZZLE_FOUR_PLAYER_B_SPAWN = { x: 3, y: 0, z: -56 };
export const PUZZLE_FOUR_GOAL_POSITION: readonly [number, number, number] = [
  0,
  0,
  PUZZLE_FOUR_ZONE_END_Z - 4,
];
export const PUZZLE_FOUR_GOAL_RADIUS = 4;

const OBJECTIVE_WIND_CROSSING_ID = "objective:trust:wind-crossing-completed";
export const OBJECTIVE_WIND_CROSSING = OBJECTIVE_WIND_CROSSING_ID;

export function buildWindCrossingStage(): PuzzleStage {
  return {
    stageId: "stage:trust:wind-crossing",
    description: "Stay close together — the wind is stronger the further apart you are.",
    checkpointId: "checkpoint:trust:wind-crossing",
    createObjectives: () => [
      createQuestObjective({
        id: OBJECTIVE_WIND_CROSSING_ID,
        description: "Cross the wind together",
        objectiveType: QuestObjectiveType.REACH_LOCATION,
      }),
    ],
  };
}

/**
 * Final Puzzle — the chapter's mastery challenge. Genuinely combines
 * all five mechanics in sequence, reusing the exact same components
 * and logic patterns already proven in Puzzles 1-4, not
 * reimplementing anything: pressure plate + hidden bridge (Puzzle 1),
 * invisible platforms with fall-and-respawn (Puzzle 2), the faith
 * lift (Puzzle 3), then a wind crossing to the goal (Puzzle 4) — all
 * under one continuous timer.
 */

// Segment 1: Pressure plate + hidden bridge.
export const FINAL_PUZZLE_PLATE_POSITION: readonly [number, number, number] = [-6, 0.5, -86];
export const FINAL_PUZZLE_BRIDGE_POSITION: readonly [number, number, number] = [0, 1.1, -92];
export const FINAL_PUZZLE_BRIDGE_LENGTH = 10;

// Segment 2: Invisible platforms (zigzag, matching Puzzle 2's proven layout pattern).
export const FINAL_PUZZLE_PLATFORM_HEIGHT = 1.1;
export const FINAL_PUZZLE_PLATFORM_POSITIONS: readonly (readonly [number, number, number])[] = [
  [-3, FINAL_PUZZLE_PLATFORM_HEIGHT, -101],
  [2, FINAL_PUZZLE_PLATFORM_HEIGHT, -105],
  [-2, FINAL_PUZZLE_PLATFORM_HEIGHT, -109],
  [0, FINAL_PUZZLE_PLATFORM_HEIGHT, -113],
];
export const FINAL_PUZZLE_PLATFORM_RESPAWN_POSITION: readonly [number, number, number] = [
  0,
  FINAL_PUZZLE_PLATFORM_HEIGHT + 1,
  -98,
];
export const FINAL_PUZZLE_PLATFORM_FALL_Y_THRESHOLD = -8;

// Segment 3: Faith lift.
export const FINAL_PUZZLE_LEVER_POSITION: readonly [number, number, number] = [-6, 1, -119];
export const FINAL_PUZZLE_LIFT_BASE_POSITION: readonly [number, number, number] = [4, 0.3, -119];
export const FINAL_PUZZLE_LIFT_TOP_Y = 3.5;
export const FINAL_PUZZLE_LIFT_TRAVEL_SECONDS = 3;
export const FINAL_PUZZLE_LIFT_DESTINATION_POSITION: readonly [number, number, number] = [
  4,
  FINAL_PUZZLE_LIFT_TOP_Y - 0.3,
  -119,
];
export const FINAL_PUZZLE_LIFT_READY_RADIUS = 2;
export const FINAL_PUZZLE_STAIRCASE_STEP_COUNT = 3;
export function getFinalPuzzleStaircaseStepPosition(
  stepIndex: number
): readonly [number, number, number] {
  const stepHeight = (FINAL_PUZZLE_LIFT_TOP_Y - 0.3) / FINAL_PUZZLE_STAIRCASE_STEP_COUNT;
  const stepDepth = 1.5;
  return [
    4,
    FINAL_PUZZLE_LIFT_TOP_Y - 0.3 - stepHeight * (stepIndex + 1),
    -119 - stepDepth * (stepIndex + 1),
  ];
}

// Segment 4: Wind crossing to the goal.
export const FINAL_PUZZLE_WIND_ZONE_START_Z = -124;
export const FINAL_PUZZLE_WIND_ZONE_END_Z = -136;
export const FINAL_PUZZLE_TOGETHER_DISTANCE = 4;
export const FINAL_PUZZLE_MAX_WIND_SPEED = 6;
export const FINAL_PUZZLE_GOAL_POSITION: readonly [number, number, number] = [
  0,
  0,
  FINAL_PUZZLE_WIND_ZONE_END_Z - 4,
];
export const FINAL_PUZZLE_GOAL_RADIUS = 4;

export const FINAL_PUZZLE_TIME_LIMIT_SECONDS = 150;
export const FINAL_PUZZLE_PLAYER_A_SPAWN = { x: -6, y: 0, z: -82 };
export const FINAL_PUZZLE_PLAYER_B_SPAWN = { x: 6, y: 0, z: -82 };

const OBJECTIVE_FINAL_ID = "objective:trust:final-combined";
export const OBJECTIVE_FINAL = OBJECTIVE_FINAL_ID;

export function buildTrustFinalStage(): PuzzleStage {
  return {
    stageId: "stage:trust:final",
    description: "Everything you've learned — trust the bridge, then trust each other.",
    checkpointId: "checkpoint:trust:final",
    createObjectives: () => [
      createQuestObjective({
        id: OBJECTIVE_FINAL_ID,
        description: "Cross together, against the wind, before time runs out",
        objectiveType: QuestObjectiveType.USE_OBJECT,
        timeLimitSeconds: FINAL_PUZZLE_TIME_LIMIT_SECONDS,
      }),
    ],
  };
}

export function setupTrustLevel(
  worldManager: WorldManager,
  groundHeightAt: (x: number, z: number) => number
): void {
  if (!worldManager.regionRegistry.list().some((region) => region.id === TRUST_REGION_ID)) {
    worldManager.regionRegistry.register(
      createWorldRegion({
        id: TRUST_REGION_ID,
        name: "Trust",
        bounds: createBoundingBox({ x: 0, y: 0, z: 0 }, { x: 60, y: 30, z: 80 }),
        streamingPriority: 10,
      })
    );
  }
  if (worldManager.spawnManager.list().length === 0) {
    const heightA = groundHeightAt(PLAYER_A_SPAWN.x, PLAYER_A_SPAWN.z);
    const heightB = groundHeightAt(PLAYER_B_SPAWN.x, PLAYER_B_SPAWN.z);
    worldManager.spawnManager.register(
      createSpawnPoint({
        id: "spawn:trust-a",
        position: { x: PLAYER_A_SPAWN.x, y: heightA + 1, z: PLAYER_A_SPAWN.z },
      }),
      true
    );
    worldManager.spawnManager.register(
      createSpawnPoint({
        id: "spawn:trust-b",
        position: { x: PLAYER_B_SPAWN.x, y: heightB + 1, z: PLAYER_B_SPAWN.z },
      })
    );

    const heightCheckpointA = groundHeightAt(
      CHECKPOINT_AFTER_HIDDEN_BRIDGE_A_SPAWN.x,
      CHECKPOINT_AFTER_HIDDEN_BRIDGE_A_SPAWN.z
    );
    const heightCheckpointB = groundHeightAt(
      CHECKPOINT_AFTER_HIDDEN_BRIDGE_B_SPAWN.x,
      CHECKPOINT_AFTER_HIDDEN_BRIDGE_B_SPAWN.z
    );
    worldManager.spawnManager.register(
      createSpawnPoint({
        id: "checkpoint:trust:hidden-bridge:a",
        position: {
          x: CHECKPOINT_AFTER_HIDDEN_BRIDGE_A_SPAWN.x,
          y: heightCheckpointA + 1,
          z: CHECKPOINT_AFTER_HIDDEN_BRIDGE_A_SPAWN.z,
        },
      })
    );
    worldManager.spawnManager.register(
      createSpawnPoint({
        id: "checkpoint:trust:hidden-bridge:b",
        position: {
          x: CHECKPOINT_AFTER_HIDDEN_BRIDGE_B_SPAWN.x,
          y: heightCheckpointB + 1,
          z: CHECKPOINT_AFTER_HIDDEN_BRIDGE_B_SPAWN.z,
        },
      })
    );

    const heightCheckpoint2A = groundHeightAt(
      CHECKPOINT_AFTER_INVISIBLE_PLATFORMS_A_SPAWN.x,
      CHECKPOINT_AFTER_INVISIBLE_PLATFORMS_A_SPAWN.z
    );
    const heightCheckpoint2B = groundHeightAt(
      CHECKPOINT_AFTER_INVISIBLE_PLATFORMS_B_SPAWN.x,
      CHECKPOINT_AFTER_INVISIBLE_PLATFORMS_B_SPAWN.z
    );
    worldManager.spawnManager.register(
      createSpawnPoint({
        id: "checkpoint:trust:invisible-platforms:a",
        position: {
          x: CHECKPOINT_AFTER_INVISIBLE_PLATFORMS_A_SPAWN.x,
          y: heightCheckpoint2A + 1,
          z: CHECKPOINT_AFTER_INVISIBLE_PLATFORMS_A_SPAWN.z,
        },
      })
    );
    worldManager.spawnManager.register(
      createSpawnPoint({
        id: "checkpoint:trust:invisible-platforms:b",
        position: {
          x: CHECKPOINT_AFTER_INVISIBLE_PLATFORMS_B_SPAWN.x,
          y: heightCheckpoint2B + 1,
          z: CHECKPOINT_AFTER_INVISIBLE_PLATFORMS_B_SPAWN.z,
        },
      })
    );

    const heightCheckpoint3A = groundHeightAt(
      CHECKPOINT_AFTER_FAITH_LIFT_A_SPAWN.x,
      CHECKPOINT_AFTER_FAITH_LIFT_A_SPAWN.z
    );
    const heightCheckpoint3B = groundHeightAt(
      CHECKPOINT_AFTER_FAITH_LIFT_B_SPAWN.x,
      CHECKPOINT_AFTER_FAITH_LIFT_B_SPAWN.z
    );
    worldManager.spawnManager.register(
      createSpawnPoint({
        id: "checkpoint:trust:faith-lift:a",
        position: {
          x: CHECKPOINT_AFTER_FAITH_LIFT_A_SPAWN.x,
          y: heightCheckpoint3A + 1,
          z: CHECKPOINT_AFTER_FAITH_LIFT_A_SPAWN.z,
        },
      })
    );
    worldManager.spawnManager.register(
      createSpawnPoint({
        id: "checkpoint:trust:faith-lift:b",
        position: {
          x: CHECKPOINT_AFTER_FAITH_LIFT_B_SPAWN.x,
          y: heightCheckpoint3B + 1,
          z: CHECKPOINT_AFTER_FAITH_LIFT_B_SPAWN.z,
        },
      })
    );

    const heightCheckpoint4A = groundHeightAt(
      CHECKPOINT_AFTER_WIND_CROSSING_A_SPAWN.x,
      CHECKPOINT_AFTER_WIND_CROSSING_A_SPAWN.z
    );
    const heightCheckpoint4B = groundHeightAt(
      CHECKPOINT_AFTER_WIND_CROSSING_B_SPAWN.x,
      CHECKPOINT_AFTER_WIND_CROSSING_B_SPAWN.z
    );
    worldManager.spawnManager.register(
      createSpawnPoint({
        id: "checkpoint:trust:wind-crossing:a",
        position: {
          x: CHECKPOINT_AFTER_WIND_CROSSING_A_SPAWN.x,
          y: heightCheckpoint4A + 1,
          z: CHECKPOINT_AFTER_WIND_CROSSING_A_SPAWN.z,
        },
      })
    );
    worldManager.spawnManager.register(
      createSpawnPoint({
        id: "checkpoint:trust:wind-crossing:b",
        position: {
          x: CHECKPOINT_AFTER_WIND_CROSSING_B_SPAWN.x,
          y: heightCheckpoint4B + 1,
          z: CHECKPOINT_AFTER_WIND_CROSSING_B_SPAWN.z,
        },
      })
    );
  }
}

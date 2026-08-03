import { createContext } from "react";
import type { GameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import type { GameManager } from "@/domain/game/GameManager";
import type { GameStateMachine } from "@/domain/game/GameStateMachine";
import type { ChapterManager } from "@/domain/game/ChapterManager";
import type { LevelManager } from "@/domain/game/LevelManager";
import type { GardenRestorationManager } from "@/domain/game/GardenRestorationManager";
import type { ReflectionManager } from "@/domain/game/ReflectionManager";
import type { CoopSessionManager } from "@/domain/game/CoopSessionManager";
import type { RespawnCoordinator } from "@/domain/game/RespawnCoordinator";
import type { TransitionManager } from "@/domain/game/TransitionManager";

export interface GameFrameworkServices {
  readonly eventBus: GameplayEventBus;
  readonly gameManager: GameManager;
  readonly gameStateMachine: GameStateMachine;
  readonly chapterManager: ChapterManager;
  readonly levelManager: LevelManager;
  readonly gardenRestorationManager: GardenRestorationManager;
  readonly reflectionManager: ReflectionManager;
  readonly coopSessionManager: CoopSessionManager;
  readonly respawnCoordinator: RespawnCoordinator;
  readonly transitionManager: TransitionManager;
}

export const GameFrameworkContext = createContext<GameFrameworkServices | null>(null);

import { createContext } from "react";
import type { AssetRegistry } from "@/domain/engine/assets/AssetRegistry";
import type { TimeSystem } from "@/domain/engine/time/TimeSystem";
import type { EngineEventBus } from "@/domain/engine/events/EngineEventBus";
import type { AssetManager } from "@/infrastructure/engine/assets/AssetManager";
import type { SceneManager } from "@/infrastructure/engine/scene/SceneManager";
import type { CameraManager } from "@/infrastructure/engine/camera/CameraManager";
import type { LightingManager } from "@/infrastructure/engine/lighting/LightingManager";
import type { AudioManager } from "@/infrastructure/engine/audio/AudioManager";
import type { MusicManager } from "@/infrastructure/engine/audio/MusicManager";
import type { SFXManager } from "@/infrastructure/engine/audio/SFXManager";
import type { AudioZoneManager } from "@/infrastructure/engine/audio/AudioZoneManager";

export interface EngineServices {
  readonly eventBus: EngineEventBus;
  readonly timeSystem: TimeSystem;
  readonly assetRegistry: AssetRegistry;
  readonly assetManager: AssetManager;
  readonly sceneManager: SceneManager;
  readonly cameraManager: CameraManager;
  readonly lightingManager: LightingManager;
  readonly audioManager: AudioManager;
  readonly musicManager: MusicManager;
  readonly sfxManager: SFXManager;
  readonly audioZoneManager: AudioZoneManager;
}

export const EngineContext = createContext<EngineServices | null>(null);

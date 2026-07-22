import { useMemo, type ReactNode } from "react";
import { AssetRegistry } from "@/domain/engine/assets/AssetRegistry";
import { TimeSystem } from "@/domain/engine/time/TimeSystem";
import { createEngineEventBus } from "@/domain/engine/events/EngineEventBus";
import { AssetManager } from "@/infrastructure/engine/assets/AssetManager";
import { SceneManager } from "@/infrastructure/engine/scene/SceneManager";
import { CameraManager } from "@/infrastructure/engine/camera/CameraManager";
import { LightingManager } from "@/infrastructure/engine/lighting/LightingManager";
import { AudioManager } from "@/infrastructure/engine/audio/AudioManager";
import { MusicManager } from "@/infrastructure/engine/audio/MusicManager";
import { SFXManager } from "@/infrastructure/engine/audio/SFXManager";
import { AudioZoneManager } from "@/infrastructure/engine/audio/AudioZoneManager";
import { EngineContext, type EngineServices } from "./EngineContext";

function createEngineServices(): EngineServices {
  const eventBus = createEngineEventBus();
  const assetRegistry = new AssetRegistry();
  const sceneManager = new SceneManager(eventBus);
  const audioManager = new AudioManager(eventBus);

  return {
    eventBus,
    timeSystem: new TimeSystem(),
    assetRegistry,
    assetManager: new AssetManager(assetRegistry, eventBus),
    sceneManager,
    cameraManager: new CameraManager(),
    lightingManager: new LightingManager(),
    audioManager,
    musicManager: new MusicManager(audioManager),
    sfxManager: new SFXManager(audioManager),
    audioZoneManager: new AudioZoneManager(),
  };
}

export interface EngineProviderProps {
  readonly children: ReactNode;
}

/**
 * Constructs every engine singleton exactly once per mount and shares
 * it via context. Deliberately outside `<Canvas>` — none of these
 * services require a WebGL context to exist, and keeping them outside
 * means they survive a Canvas remount (e.g. on a fatal render error
 * recovery) without losing state like the asset cache.
 */
export function EngineProvider({ children }: EngineProviderProps) {
  const services = useMemo(() => createEngineServices(), []);
  return <EngineContext.Provider value={services}>{children}</EngineContext.Provider>;
}

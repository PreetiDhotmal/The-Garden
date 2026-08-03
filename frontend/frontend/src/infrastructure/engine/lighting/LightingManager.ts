import { AmbientLight, Color, DirectionalLight, Fog, Vector3, type Scene } from "three";
import type { EnvironmentConfig } from "@/domain/engine/config/EnvironmentConfig";

export interface AppliedLighting {
  readonly directionalLight: DirectionalLight;
  readonly ambientLight: AmbientLight;
}

const SHADOW_MAP_SIZE = 2048;
const SHADOW_CAMERA_EXTENT = 30;

/**
 * Translates an EnvironmentConfig (pure data) into real Three.js light
 * objects and applies them — plus background color and fog — to a
 * Scene. HDRI-based image lighting is applied separately by whichever
 * component loads the HDRI texture (see AssetManager); this class
 * owns only the direct light + fog + background setup.
 */
export class LightingManager {
  applyToScene(scene: Scene, config: EnvironmentConfig): AppliedLighting {
    this.clearExistingLights(scene);

    const directionalLight = this.buildDirectionalLight(config);
    const ambientLight = this.buildAmbientLight(config);
    scene.add(directionalLight, directionalLight.target, ambientLight);

    scene.background = new Color(config.backgroundColorHex);
    scene.fog = config.fog
      ? new Fog(new Color(config.fog.colorHex).getHex(), config.fog.near, config.fog.far)
      : null;

    return { directionalLight, ambientLight };
  }

  private buildDirectionalLight(config: EnvironmentConfig): DirectionalLight {
    const light = new DirectionalLight(config.directionalLight.colorHex, config.directionalLight.intensity);
    const [dx, dy, dz] = config.directionalLight.direction;
    light.position.set(-dx, -dy, -dz).multiplyScalar(20);
    light.target.position.set(0, 0, 0);
    light.castShadow = config.directionalLight.castShadow;

    if (light.castShadow) {
      light.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
      light.shadow.camera.left = -SHADOW_CAMERA_EXTENT;
      light.shadow.camera.right = SHADOW_CAMERA_EXTENT;
      light.shadow.camera.top = SHADOW_CAMERA_EXTENT;
      light.shadow.camera.bottom = -SHADOW_CAMERA_EXTENT;
      light.shadow.bias = -0.0005;
    }

    return light;
  }

  private buildAmbientLight(config: EnvironmentConfig): AmbientLight {
    return new AmbientLight(config.ambientLight.colorHex, config.ambientLight.intensity);
  }

  private clearExistingLights(scene: Scene): void {
    const lights = scene.children.filter(
      (child) => child instanceof DirectionalLight || child instanceof AmbientLight
    );
    for (const light of lights) {
      scene.remove(light);
    }
  }
}

/** Exposed for tests / debug tooling that need the raw direction vector. */
export function directionArrayToVector3(direction: readonly [number, number, number]): Vector3 {
  return new Vector3(direction[0], direction[1], direction[2]);
}

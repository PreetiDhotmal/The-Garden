import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";

const DRACO_DECODER_PATH = "https://www.gstatic.com/draco/versioned/decoders/1.5.7/";

let cachedLoader: GLTFLoader | null = null;

function getLoader(): GLTFLoader {
  if (cachedLoader) {
    return cachedLoader;
  }
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(DRACO_DECODER_PATH);

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);
  cachedLoader = loader;
  return loader;
}

export interface ModelLoadProgress {
  readonly loadedBytes: number;
  readonly totalBytes: number;
}

/**
 * Loads a GLB/GLTF model from `url`, returning the full parsed GLTF
 * result (scene graph, animations, cameras). Callers that only need
 * the scene should destructure `.scene`; animation extraction is the
 * responsibility of AnimationLoader, which operates on this result.
 */
export function loadModel(
  url: string,
  onProgress?: (progress: ModelLoadProgress) => void
): Promise<GLTF> {
  return new Promise((resolve, reject) => {
    getLoader().load(
      url,
      (gltf) => {
        resolve(gltf);
      },
      (event) => {
        onProgress?.({ loadedBytes: event.loaded, totalBytes: event.total });
      },
      (error) => {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    );
  });
}

import { EquirectangularReflectionMapping, type DataTexture } from "three";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";

let cachedLoader: HDRLoader | null = null;

function getLoader(): HDRLoader {
  cachedLoader ??= new HDRLoader();
  return cachedLoader;
}

export function loadHdri(url: string): Promise<DataTexture> {
  return new Promise((resolve, reject) => {
    getLoader().load(
      url,
      (texture) => {
        texture.mapping = EquirectangularReflectionMapping;
        resolve(texture);
      },
      undefined,
      (error) => {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    );
  });
}

import { SRGBColorSpace, Texture, TextureLoader as ThreeTextureLoader } from "three";

let cachedLoader: ThreeTextureLoader | null = null;

function getLoader(): ThreeTextureLoader {
  cachedLoader ??= new ThreeTextureLoader();
  return cachedLoader;
}

export interface TextureLoadOptions {
  /** Defaults to true — most authored textures (albedo, emissive) are sRGB. Set false for data textures (normal/roughness/AO maps). */
  readonly isColorTexture?: boolean;
}

export function loadTexture(url: string, options: TextureLoadOptions = {}): Promise<Texture> {
  return new Promise((resolve, reject) => {
    getLoader().load(
      url,
      (texture) => {
        if (options.isColorTexture ?? true) {
          texture.colorSpace = SRGBColorSpace;
        }
        texture.needsUpdate = true;
        resolve(texture);
      },
      undefined,
      (error) => {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    );
  });
}

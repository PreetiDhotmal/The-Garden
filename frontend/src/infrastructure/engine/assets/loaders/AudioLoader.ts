import { AudioLoader as ThreeAudioLoader } from "three";

let cachedLoader: ThreeAudioLoader | null = null;

function getLoader(): ThreeAudioLoader {
  cachedLoader ??= new ThreeAudioLoader();
  return cachedLoader;
}

/**
 * Loads and decodes an audio file into an AudioBuffer. Uses
 * `THREE.AudioLoader` (built on the Web Audio API's decodeAudioData)
 * rather than a bare fetch, so decoding errors surface consistently
 * with the rest of the pipeline's loader interfaces.
 */
export function loadAudio(url: string): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    getLoader().load(
      url,
      (buffer) => {
        resolve(buffer);
      },
      undefined,
      (error) => {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    );
  });
}

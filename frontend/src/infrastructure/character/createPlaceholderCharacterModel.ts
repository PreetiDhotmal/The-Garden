import { Group, Mesh, CapsuleGeometry, MeshStandardMaterial } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";

/**
 * Builds a minimal, always-succeeds stand-in for a real character
 * GLB — a simple capsule, no animations. This exists purely so a
 * failed network/file load degrades to "an unanimated placeholder
 * character" instead of leaving the player on a loading screen
 * forever or crashing the app. It intentionally does not attempt to
 * fully replicate GLTFLoader's real return shape (cameras, parser,
 * userData, etc.) — only the fields this codebase's character
 * pipeline actually reads (`scene`, `animations`) — since a fallback
 * path's job is to keep the game running, not to be a complete GLTF
 * implementation.
 */
export function createPlaceholderCharacterModel(color: string): GLTF {
  const group = new Group();
  const mesh = new Mesh(
    new CapsuleGeometry(0.35, 1.1, 4, 8),
    new MeshStandardMaterial({ color, roughness: 0.8 })
  );
  mesh.position.y = 0.9;
  mesh.castShadow = true;
  group.add(mesh);
  group.name = "PlaceholderCharacter";

  return {
    scene: group,
    scenes: [group],
    animations: [],
    cameras: [],
    asset: { version: "2.0", generator: "PlaceholderCharacterModel" },
    userData: { isPlaceholder: true },
    parser: undefined,
  } as unknown as GLTF;
}

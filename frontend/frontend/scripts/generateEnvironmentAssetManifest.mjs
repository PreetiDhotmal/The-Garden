// Scans public/models/environment/<Category>/*.glb, picks the
// smallest file in each category folder, and computes a scale factor
// from its TRUE rendered bounding box - loaded via the exact same
// GLTFLoader class the running app uses, not raw vertex accessor
// bounds. Raw accessor bounds ignore node transform matrices in the
// GLTF hierarchy (translation/rotation/scale baked into a node, a
// common Sketchfab export convention for unit conversion) and were
// found to be wrong by 100x or more for multiple assets in this
// project - this script exists specifically to never repeat that.
// No filenames are hardcoded anywhere in this script or its output -
// everything is discovered from disk.
globalThis.self = globalThis;

import { readdirSync, statSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Box3, Vector3 } from "three";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENVIRONMENT_DIR = join(__dirname, "..", "public", "models", "environment");
const OUTPUT_FILE = join(
  __dirname,
  "..",
  "src",
  "presentation",
  "world",
  "environmentPropManifest.generated.ts"
);

// Canonical category id -> matcher against a folder's own name
// (case-insensitive substring match), so "Trees", "tree", "TREE_MODELS"
// etc. all resolve the same way without hardcoding an exact name.
const CATEGORY_MATCHERS = [
  { id: "tree", targetHeight: 5 },
  { id: "rock", targetHeight: 1.2 },
  { id: "bush", targetHeight: 1.2 },
  { id: "grass", targetHeight: 0.35 },
  { id: "flower", targetHeight: 0.3 },
];

function matchCategory(folderName) {
  const lower = folderName.toLowerCase();
  return CATEGORY_MATCHERS.find((category) => lower.includes(category.id)) ?? null;
}

/**
 * Loads a GLB with the real GLTFLoader and returns its true rendered
 * height (the Y extent of a Box3 computed from the actual scene
 * graph, with every node's transform correctly applied) - the same
 * value Object3D.clone() + <primitive> rendering in the running app
 * will produce, unlike raw accessor min/max which ignores node
 * transforms entirely.
 */
async function measureTrueRenderedHeight(filePath) {
  const buffer = readFileSync(filePath);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const loader = new GLTFLoader();
  // Textures can't load in this Node.js environment (no browser Image
  // decoding) and aren't needed for bounding box computation - GLTFLoader
  // logs a console.warn per failed texture, which would otherwise print
  // on every dev/build/test/typecheck run via the pre-hooks. Suppressed
  // only for the duration of this parse call.
  const originalWarn = console.warn;
  console.warn = () => {};
  let gltf;
  try {
    gltf = await new Promise((resolve, reject) => {
      loader.parse(arrayBuffer, "", resolve, reject);
    });
  } finally {
    console.warn = originalWarn;
  }
  const box = new Box3().setFromObject(gltf.scene);
  const size = new Vector3();
  box.getSize(size);
  if (!Number.isFinite(size.y) || size.y <= 0) {
    throw new Error(`computed a non-positive or non-finite height (${size.y.toString()})`);
  }
  return size.y;
}

async function discoverAssets() {
  if (!existsSync(ENVIRONMENT_DIR)) {
    throw new Error(`Environment asset directory not found: ${ENVIRONMENT_DIR}`);
  }

  const discovered = [];
  const skipped = [];

  for (const entry of readdirSync(ENVIRONMENT_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const category = matchCategory(entry.name);
    if (!category) {
      skipped.push(
        `Folder "${entry.name}" did not match any known category (tree/rock/bush/grass/flower) - skipped.`
      );
      continue;
    }

    const folderPath = join(ENVIRONMENT_DIR, entry.name);
    const glbFiles = readdirSync(folderPath)
      .filter((file) => file.toLowerCase().endsWith(".glb"))
      .map((file) => {
        const fullPath = join(folderPath, file);
        return { file, fullPath, size: statSync(fullPath).size };
      });

    if (glbFiles.length === 0) {
      skipped.push(
        `Folder "${entry.name}" (matched category "${category.id}") contains no .glb files - skipped.`
      );
      continue;
    }

    // Explicit instruction: use only the smallest file per category.
    glbFiles.sort((a, b) => a.size - b.size);
    const chosen = glbFiles[0];

    let trueHeight;
    try {
      trueHeight = await measureTrueRenderedHeight(chosen.fullPath);
    } catch (error) {
      skipped.push(`"${chosen.file}" in "${entry.name}": ${error.message} - could not compute scale, skipped.`);
      continue;
    }

    discovered.push({
      categoryId: category.id,
      folderName: entry.name,
      fileName: chosen.file,
      sizeBytes: chosen.size,
      publicUrl: `/models/environment/${entry.name}/${chosen.file}`,
      assetId: `models:environment:${category.id}`,
      trueHeight,
      baseScale: category.targetHeight / trueHeight,
      candidatesInFolder: glbFiles.map((f) => `${f.file} (${(f.size / 1024 / 1024).toFixed(1)} MB)`),
    });
  }

  return { discovered, skipped };
}

function generateManifestSource(discovered) {
  const entries = discovered
    .map(
      (asset) => `  {
    assetId: ${JSON.stringify(asset.assetId)},
    category: ${JSON.stringify(asset.categoryId)},
    url: ${JSON.stringify(asset.publicUrl)},
    // Auto-discovered: smallest file in "${asset.folderName}/" (${(asset.sizeBytes / 1024 / 1024).toFixed(1)} MB).
    // Other candidates found in this folder: ${asset.candidatesInFolder.join(", ")}
    // TRUE rendered height (real GLTFLoader + Box3, not raw accessor bounds): ${asset.trueHeight.toFixed(5)} units.
    baseScale: ${asset.baseScale},
  },`
    )
    .join("\n");

  return `// AUTO-GENERATED by scripts/generateEnvironmentAssetManifest.mjs
// Do not edit by hand - regenerate by running:
//   node scripts/generateEnvironmentAssetManifest.mjs
// from the frontend/ directory. Regenerated automatically on every
// pnpm dev / pnpm build via the predev/prebuild hooks.
//
// Scale is computed from each asset's TRUE rendered bounding box (via
// the real GLTFLoader + Box3, matching exactly how the running app
// loads these files) - not raw vertex accessor bounds, which ignore
// node transform matrices and were found to be wrong by 100x or more
// for multiple assets in this project.

export interface DiscoveredEnvironmentProp {
  readonly assetId: string;
  readonly category: string;
  readonly url: string;
  readonly baseScale: number;
}

export const DISCOVERED_ENVIRONMENT_PROPS: readonly DiscoveredEnvironmentProp[] = [
${entries}
];
`;
}

async function main() {
  const { discovered, skipped } = await discoverAssets();

  writeFileSync(OUTPUT_FILE, generateManifestSource(discovered), "utf8");

  console.log(`[EnvironmentAssetManifest] Discovered ${discovered.length.toString()} asset(s):`);
  for (const asset of discovered) {
    console.log(
      `  - ${asset.categoryId}: ${asset.folderName}/${asset.fileName} (${(asset.sizeBytes / 1024 / 1024).toFixed(1)} MB, trueHeight=${asset.trueHeight.toFixed(5)}, baseScale=${asset.baseScale.toFixed(6)})`
    );
  }
  if (skipped.length > 0) {
    console.log(`[EnvironmentAssetManifest] Skipped:`);
    for (const message of skipped) {
      console.log(`  - ${message}`);
    }
  }
  console.log(`[EnvironmentAssetManifest] Wrote ${OUTPUT_FILE}`);
}

await main();

import { AssetType } from "./AssetType";

export type AssetPriority = "critical" | "high" | "normal" | "low";

/**
 * Describes an asset the pipeline can load. This is pure metadata —
 * it carries no reference to the loaded resource itself (see
 * AssetCache in infrastructure for that). Two descriptors are equal
 * if their `id` matches; `id` is the only thing AssetRegistry keys on.
 */
export interface AssetDescriptor {
  readonly id: string;
  readonly type: AssetType;
  readonly url: string;
  readonly priority: AssetPriority;
  readonly tags: readonly string[];
}

export interface CreateAssetDescriptorInput {
  readonly id: string;
  readonly type: AssetType;
  readonly url: string;
  readonly priority?: AssetPriority;
  readonly tags?: readonly string[];
}

export class InvalidAssetDescriptorError extends Error {
  constructor(reason: string) {
    super(`Invalid asset descriptor: ${reason}`);
    this.name = "InvalidAssetDescriptorError";
  }
}

const EXPECTED_EXTENSIONS_BY_TYPE: Record<AssetType, readonly string[]> = {
  [AssetType.MODEL]: [".glb", ".gltf"],
  [AssetType.TEXTURE]: [".png", ".jpg", ".jpeg", ".webp", ".ktx2"],
  [AssetType.HDRI]: [".hdr", ".exr"],
  [AssetType.AUDIO]: [".mp3", ".ogg", ".wav"],
  [AssetType.ANIMATION]: [".glb", ".gltf"],
};

/**
 * Validates and constructs an AssetDescriptor. This is the only
 * supported way to create one — it guarantees every descriptor in the
 * system has a non-empty id/url and a type-appropriate extension,
 * catching pipeline authoring mistakes at registration time rather
 * than at load time.
 */
export function createAssetDescriptor(input: CreateAssetDescriptorInput): AssetDescriptor {
  const id = input.id.trim();
  const url = input.url.trim();

  if (id.length === 0) {
    throw new InvalidAssetDescriptorError("id must not be empty");
  }
  if (url.length === 0) {
    throw new InvalidAssetDescriptorError("url must not be empty");
  }

  const expectedExtensions = EXPECTED_EXTENSIONS_BY_TYPE[input.type];
  const hasExpectedExtension = expectedExtensions.some((extension) =>
    url.toLowerCase().endsWith(extension)
  );
  if (!hasExpectedExtension) {
    throw new InvalidAssetDescriptorError(
      `url "${url}" does not have an extension expected for asset type ${input.type} ` +
        `(expected one of: ${expectedExtensions.join(", ")})`
    );
  }

  return {
    id,
    type: input.type,
    url,
    priority: input.priority ?? "normal",
    tags: input.tags ?? [],
  };
}

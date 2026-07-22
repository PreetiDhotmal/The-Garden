import type { AssetDescriptor } from "./AssetDescriptor";
import type { AssetType } from "./AssetType";

export class DuplicateAssetIdError extends Error {
  constructor(readonly id: string) {
    super(`An asset with id "${id}" is already registered.`);
    this.name = "DuplicateAssetIdError";
  }
}

export class UnknownAssetIdError extends Error {
  constructor(readonly id: string) {
    super(`No asset is registered with id "${id}".`);
    this.name = "UnknownAssetIdError";
  }
}

/**
 * Catalog of every asset descriptor known to the pipeline. Registering
 * an asset does not load it — this class only tracks *what exists and
 * where*, so it can be queried synchronously (e.g. to build a preload
 * list, or to power the AssetBrowser dev tool) without touching the
 * network.
 */
export class AssetRegistry {
  private readonly descriptorsById = new Map<string, AssetDescriptor>();

  register(descriptor: AssetDescriptor): void {
    if (this.descriptorsById.has(descriptor.id)) {
      throw new DuplicateAssetIdError(descriptor.id);
    }
    this.descriptorsById.set(descriptor.id, descriptor);
  }

  registerAll(descriptors: readonly AssetDescriptor[]): void {
    for (const descriptor of descriptors) {
      this.register(descriptor);
    }
  }

  get(id: string): AssetDescriptor {
    const descriptor = this.descriptorsById.get(id);
    if (!descriptor) {
      throw new UnknownAssetIdError(id);
    }
    return descriptor;
  }

  has(id: string): boolean {
    return this.descriptorsById.has(id);
  }

  unregister(id: string): void {
    this.descriptorsById.delete(id);
  }

  list(): readonly AssetDescriptor[] {
    return Array.from(this.descriptorsById.values());
  }

  listByType(type: AssetType): readonly AssetDescriptor[] {
    return this.list().filter((descriptor) => descriptor.type === type);
  }

  listByTag(tag: string): readonly AssetDescriptor[] {
    return this.list().filter((descriptor) => descriptor.tags.includes(tag));
  }

  size(): number {
    return this.descriptorsById.size;
  }

  clear(): void {
    this.descriptorsById.clear();
  }
}

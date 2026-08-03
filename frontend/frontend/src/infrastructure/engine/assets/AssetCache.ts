export interface Disposable {
  dispose: () => void;
}

function isDisposable(value: unknown): value is Disposable {
  return (
    typeof value === "object" &&
    value !== null &&
    "dispose" in value &&
    typeof (value as Disposable).dispose === "function"
  );
}

/**
 * Caches loaded asset resources (Three.js Object3D graphs, Textures,
 * AudioBuffers, etc.) by id. Distinct from AssetRegistry, which only
 * tracks descriptors/metadata — this holds the actual loaded GPU/CPU
 * resources and is responsible for releasing them.
 */
export class AssetCache {
  private readonly resourcesById = new Map<string, unknown>();

  set(id: string, resource: unknown): void {
    if (this.resourcesById.has(id)) {
      this.disposeResource(this.resourcesById.get(id));
    }
    this.resourcesById.set(id, resource);
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- deliberate call-site-inferred generic, e.g. cache.get<Texture>(id); mirrors Map<K,V>.get's ergonomics.
  get<TResource>(id: string): TResource | undefined {
    return this.resourcesById.get(id) as TResource | undefined;
  }

  has(id: string): boolean {
    return this.resourcesById.has(id);
  }

  evict(id: string): void {
    const resource = this.resourcesById.get(id);
    if (resource !== undefined) {
      this.disposeResource(resource);
      this.resourcesById.delete(id);
    }
  }

  clear(): void {
    for (const resource of this.resourcesById.values()) {
      this.disposeResource(resource);
    }
    this.resourcesById.clear();
  }

  size(): number {
    return this.resourcesById.size;
  }

  private disposeResource(resource: unknown): void {
    if (isDisposable(resource)) {
      resource.dispose();
    }
  }
}

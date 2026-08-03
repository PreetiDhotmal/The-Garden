import type { CollectibleCategory } from "./CollectibleCategory";

export class CollectibleInventory {
  private readonly countsByCategory = new Map<CollectibleCategory, number>();
  private readonly collectedIds = new Set<string>();

  record(collectibleId: string, category: CollectibleCategory): void {
    if (this.collectedIds.has(collectibleId)) {
      return;
    }
    this.collectedIds.add(collectibleId);
    this.countsByCategory.set(category, (this.countsByCategory.get(category) ?? 0) + 1);
  }

  countOf(category: CollectibleCategory): number {
    return this.countsByCategory.get(category) ?? 0;
  }

  totalCollected(): number {
    return this.collectedIds.size;
  }

  hasCollected(collectibleId: string): boolean {
    return this.collectedIds.has(collectibleId);
  }
}

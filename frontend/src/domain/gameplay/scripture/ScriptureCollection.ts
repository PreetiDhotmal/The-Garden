import type { ScriptureReference } from "@the-garden/shared-types";
import type { ScriptureCategory } from "./ScriptureCategory";
import { referenceKey } from "./ScriptureFormatter";

export interface ScriptureCollection {
  readonly id: string;
  readonly title: string;
  readonly category: ScriptureCategory;
  readonly references: readonly ScriptureReference[];
}

export function collectionContainsReference(
  collection: ScriptureCollection,
  reference: ScriptureReference
): boolean {
  const key = referenceKey(reference);
  return collection.references.some((candidate) => referenceKey(candidate) === key);
}

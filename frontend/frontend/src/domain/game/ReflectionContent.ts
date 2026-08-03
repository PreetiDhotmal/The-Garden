import type { ScriptureReference } from "@the-garden/shared-types";

export interface ReflectionContent {
  readonly levelId: string;
  /** The short on-screen line — GDD Section 4's "Reflection Moment" field, always a stated truth, never an instruction (see GDD 11.3 on avoiding a preachy tone). */
  readonly lessonText: string;
  /** One or two sentences summarizing what the pair just did — GDD Section 2.7's "Summary". */
  readonly summaryText: string;
  /** Present only when this level has a GDD "Optional Scripture Integration" entry — null means no scripture link is offered for this level. */
  readonly scriptureReference: ScriptureReference | null;
}

export class DuplicateReflectionContentError extends Error {
  constructor(readonly levelId: string) {
    super(`Reflection content is already registered for level "${levelId}".`);
    this.name = "DuplicateReflectionContentError";
  }
}

export class UnknownReflectionContentError extends Error {
  constructor(readonly levelId: string) {
    super(`No reflection content registered for level "${levelId}".`);
    this.name = "UnknownReflectionContentError";
  }
}

export class ReflectionContentRegistry {
  private readonly contentByLevelId = new Map<string, ReflectionContent>();

  register(content: ReflectionContent): void {
    if (this.contentByLevelId.has(content.levelId)) {
      throw new DuplicateReflectionContentError(content.levelId);
    }
    this.contentByLevelId.set(content.levelId, content);
  }

  registerAll(contents: readonly ReflectionContent[]): void {
    for (const content of contents) {
      this.register(content);
    }
  }

  has(levelId: string): boolean {
    return this.contentByLevelId.has(levelId);
  }

  get(levelId: string): ReflectionContent {
    const content = this.contentByLevelId.get(levelId);
    if (!content) {
      throw new UnknownReflectionContentError(levelId);
    }
    return content;
  }
}

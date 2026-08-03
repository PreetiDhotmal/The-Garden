export class StoryFlags {
  private readonly flags = new Set<string>();

  set(flag: string): void {
    this.flags.add(flag);
  }

  has(flag: string): boolean {
    return this.flags.has(flag);
  }

  clear(flag: string): void {
    this.flags.delete(flag);
  }

  list(): readonly string[] {
    return Array.from(this.flags);
  }

  /** For save/load. */
  restore(flags: readonly string[]): void {
    this.flags.clear();
    for (const flag of flags) {
      this.flags.add(flag);
    }
  }
}

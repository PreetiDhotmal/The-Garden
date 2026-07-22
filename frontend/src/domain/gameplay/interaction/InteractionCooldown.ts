export class InteractionCooldown {
  private lastTriggeredAtSeconds: number | null = null;

  constructor(private readonly durationSeconds: number) {
    if (durationSeconds < 0) {
      throw new RangeError("durationSeconds must not be negative.");
    }
  }

  isReady(nowSeconds: number): boolean {
    if (this.lastTriggeredAtSeconds === null) {
      return true;
    }
    return nowSeconds - this.lastTriggeredAtSeconds >= this.durationSeconds;
  }

  trigger(nowSeconds: number): void {
    this.lastTriggeredAtSeconds = nowSeconds;
  }

  remainingSeconds(nowSeconds: number): number {
    if (this.lastTriggeredAtSeconds === null) {
      return 0;
    }
    const elapsed = nowSeconds - this.lastTriggeredAtSeconds;
    return Math.max(0, this.durationSeconds - elapsed);
  }

  reset(): void {
    this.lastTriggeredAtSeconds = null;
  }
}

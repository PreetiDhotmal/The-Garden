import { mergeInputFrameStates, type InputFrameState } from "@/domain/input/InputFrameState";
import type { InputSource } from "./InputSource";

/**
 * Owns the set of active input sources and merges their per-frame
 * contributions. The character controller and camera only ever talk
 * to this class — they never know how many or which device sources
 * are active, satisfying the "input mapping" abstraction requirement.
 */
export class InputSystem {
  private readonly sources: InputSource[] = [];

  addSource(source: InputSource): void {
    source.attach();
    this.sources.push(source);
  }

  removeAllSources(): void {
    for (const source of this.sources) {
      source.detach();
    }
    this.sources.length = 0;
  }

  sample(): InputFrameState {
    return mergeInputFrameStates(this.sources.map((source) => source.sample()));
  }
}

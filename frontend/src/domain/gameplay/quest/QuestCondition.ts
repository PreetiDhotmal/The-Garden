/**
 * Anything evaluable against arbitrary gameplay state. `context` is
 * deliberately `unknown` at this interface level — a QuestCondition
 * implementation and the code that evaluates it agree on a concrete
 * context shape between themselves (e.g. a future
 * `PlayerLevelCondition` expects `{ playerLevel: number }`). This
 * keeps QuestCondition usable for conditions this milestone doesn't
 * anticipate, without changing the interface later.
 */
export interface QuestCondition {
  readonly id: string;
  readonly description: string;
  evaluate: (context: unknown) => boolean;
}

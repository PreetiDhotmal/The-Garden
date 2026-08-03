import type { Quest } from "./Quest";

export class DuplicateQuestIdError extends Error {
  constructor(readonly id: string) {
    super(`A quest with id "${id}" is already registered.`);
    this.name = "DuplicateQuestIdError";
  }
}

export class UnknownQuestIdError extends Error {
  constructor(readonly id: string) {
    super(`No quest is registered with id "${id}".`);
    this.name = "UnknownQuestIdError";
  }
}

export class QuestRegistry {
  private readonly questsById = new Map<string, Quest>();

  register(quest: Quest): void {
    if (this.questsById.has(quest.id)) {
      throw new DuplicateQuestIdError(quest.id);
    }
    this.questsById.set(quest.id, quest);
  }

  registerAll(quests: readonly Quest[]): void {
    for (const quest of quests) {
      this.register(quest);
    }
  }

  get(id: string): Quest {
    const quest = this.questsById.get(id);
    if (!quest) {
      throw new UnknownQuestIdError(id);
    }
    return quest;
  }

  has(id: string): boolean {
    return this.questsById.has(id);
  }

  /** QuestEngine calls this after every state transition — the registry always holds the latest immutable Quest snapshot. */
  update(quest: Quest): void {
    if (!this.questsById.has(quest.id)) {
      throw new UnknownQuestIdError(quest.id);
    }
    this.questsById.set(quest.id, quest);
  }

  list(): readonly Quest[] {
    return Array.from(this.questsById.values());
  }
}
